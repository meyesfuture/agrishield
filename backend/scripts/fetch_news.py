import os
import feedparser
import google.generativeai as genai
import json
from datetime import datetime

def fetch_and_classify_news(commodity_name, location_name):
    # Configure Gemini
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)

    # Check DEMO_MODE
    if os.getenv("DEMO_MODE", "True").lower() in ("true", "1", "yes"):
        print(f"DEMO_MODE enabled. Returning mock news for {commodity_name} in {location_name}.")
        return [{
            "title": f"Local reports indicate unusual {commodity_name.lower()} supply conditions in {location_name}",
            "source_name": "AgriNews Daily (Demo)",
            "source_url": "demo://news",
            "published_at": datetime.utcnow(),
            "event_type": "supply_shortage",
            "relevance_score": 0.85,
            "model_confidence": 0.90,
            "summary": f"This is a simulated news signal triggered by DEMO_MODE for {commodity_name} in {location_name}."
        }]
    
    print(f"Fetching live news for {commodity_name} in {location_name}...")
    
    # Real news fetching via Google News RSS
    query = f"{commodity_name} price OR supply {location_name}"
    # URL encode the query simply
    query = query.replace(" ", "+")
    rss_url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
    
    feed = feedparser.parse(rss_url)
    results = []
    
    if not feed.entries:
        print("No news articles found.")
        return results
        
    # Process top 3 articles
    for entry in feed.entries[:3]:
        title = entry.title
        link = entry.link
        
        # Use Gemini to classify the news
        if not api_key:
            print("Warning: GEMINI_API_KEY missing, skipping classification.")
            continue
            
        try:
            model = genai.GenerativeModel("gemini-3.8-flash")
            prompt = f"""
            Analyze this news headline for agricultural supply chain anomalies:
            "{title}"
            
            Commodity: {commodity_name}
            Location: {location_name}
            
            Respond with a JSON object containing exactly these fields:
            "is_relevant": boolean (is it about supply disruptions, price spikes, weather/crop damage, transport strikes, or pest attacks for this commodity?)
            "event_type": string (one of: supply_shortage, crop_damage, pest_attack, heatwave, transport_strike, storage_issue, none)
            "confidence": float between 0.0 and 1.0
            "summary": A one-sentence explanation.
            
            Return ONLY the raw JSON object, without markdown formatting or code blocks.
            """
            
            response = model.generate_content(prompt)
            # Clean markdown block if present
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
                
            data = json.loads(raw_text.strip())
            
            if data.get("is_relevant"):
                # Google News RSS formats title as "Headline - Source Name"
                source_parts = title.split(" - ")
                source_name = source_parts[-1] if len(source_parts) > 1 else "Google News"
                clean_title = " - ".join(source_parts[:-1]) if len(source_parts) > 1 else title
                
                results.append({
                    "title": clean_title,
                    "source_name": source_name,
                    "source_url": link,
                    "published_at": datetime.utcnow(), 
                    "event_type": data.get("event_type", "supply_shortage"),
                    "relevance_score": data.get("confidence", 0.5),
                    "model_confidence": data.get("confidence", 0.5),
                    "summary": data.get("summary", "")
                })
        except Exception as e:
            print(f"Error classifying news: {e}")
            continue
            
    return results

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    res = fetch_and_classify_news("Onion", "Nashik")
    print(json.dumps(res, indent=2, default=str))
