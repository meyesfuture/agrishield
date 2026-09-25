import os
import sys
import datetime
import json
import feedparser
from sqlalchemy.orm import Session
from google import genai
from pydantic import BaseModel

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import SessionLocal
from app.models import Commodity, Location, NewsItem
from app.engine import evaluate_alert
from dotenv import load_dotenv

load_dotenv()

# Define the expected JSON structure from Gemini
class NewsExtraction(BaseModel):
    commodity_name: str
    location_district: str
    event_type: str
    relevance_score: float
    summary: str

def fetch_and_parse_news():
    if os.getenv("DEMO_MODE", "False").lower() == "true":
        print("DEMO_MODE is True. Skipping real news ingestion and using fixtures.")
        return [], None

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY is not set in .env")
        sys.exit(1)
        
    client = genai.Client(api_key=api_key)
    
    # Use Google News RSS for free real-time news
    rss_urls = [
        "https://news.google.com/rss/search?q=onion+price+india+agriculture&hl=en-IN&gl=IN&ceid=IN:en",
        "https://news.google.com/rss/search?q=tomato+price+crop+damage+india&hl=en-IN&gl=IN&ceid=IN:en"
    ]
    
    articles = []
    for url in rss_urls:
        feed = feedparser.parse(url)
        for entry in feed.entries[:5]: # Take top 5 from each
            articles.append({
                "title": entry.title,
                "link": entry.link,
                "published_at": entry.published
            })
            
    return articles, client

def process_articles(articles, client):
    db = SessionLocal()
    inserted = 0
    now = datetime.datetime.now(datetime.timezone.utc)
    
    try:
        for article in articles:
            # Check if we already processed this URL
            exists = db.query(NewsItem).filter(NewsItem.source_url == article['link']).first()
            if exists:
                continue
                
            print(f"Analyzing article: {article['title']}")
            
            prompt = f"""
            Analyze the following news headline for agricultural supply chain anomalies (hoarding, weather damage, price spikes, transport issues).
            Headline: {article['title']}
            
            Extract the commodity involved (e.g. Onion, Tomato), the district/state in India if mentioned (otherwise 'Unknown'), 
            the event type (e.g. Weather, Hoarding, Price Spike, Normal), 
            and a relevance score from 0.0 to 1.0 representing how much this impacts supply.
            """
            
            try:
                # Use Gemini structured output
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                    config={
                        'response_mime_type': 'application/json',
                        'response_schema': NewsExtraction,
                        'temperature': 0.1
                    }
                )
                
                result = json.loads(response.text)
                c_name = result.get('commodity_name')
                dist = result.get('location_district')
                
                commodity = db.query(Commodity).filter(Commodity.name.ilike(f"%{c_name}%")).first()
                location = db.query(Location).filter(Location.district.ilike(f"%{dist}%")).first()
                
                # We only insert if it matches our monitored commodities
                if commodity:
                    news_item = NewsItem(
                        title=article['title'],
                        source_name="Google News",
                        source_url=article['link'],
                        published_at=now,
                        commodity_id=commodity.id,
                        location_id=location.id if location else None,
                        event_type=result.get('event_type', 'Unknown'),
                        relevance_score=float(result.get('relevance_score', 0.5)),
                        model_confidence=0.9,
                        summary=result.get('summary', ''),
                        created_at=now
                    )
                    db.add(news_item)
                    db.commit()
                    inserted += 1
                    
                    if location:
                        evaluate_alert(location.id, commodity.id, db)
                        
            except Exception as e:
                print(f"Failed to process with Gemini: {e}")
                
        print(f"News ingestion complete. Inserted {inserted} real news items.")
        
    finally:
        db.close()

if __name__ == "__main__":
    articles, client = fetch_and_parse_news()
    process_articles(articles, client)
