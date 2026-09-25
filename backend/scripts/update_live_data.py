import os
import sys
import json
import requests
from datetime import datetime

# Adjust Python path to run from backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from app.database import SessionLocal
from app.models import Commodity, Location, Market, MarketObservation, SatelliteObservation, NewsItem
from app.engine import evaluate_alert
from scripts.fetch_satellite import calculate_ndvi_for_region
from scripts.fetch_news import fetch_and_classify_news

def fetch_ogd_data(api_key, state, commodity_name):
    """Fetch market data from OGD India or local fixture."""
    is_demo = os.getenv("DEMO_MODE", "True").lower() in ("true", "1", "yes")
    
    if is_demo:
        print(f"DEMO_MODE: Reading OGD fixture for {commodity_name} in {state}...")
        fixture_path = os.path.join(os.path.dirname(__file__), "..", "fixtures", "ogd_sample.json")
        try:
            with open(fixture_path, "r") as f:
                data = json.load(f)
                return [r for r in data.get("records", []) if r["state"] == state and r["commodity"] == commodity_name]
        except Exception as e:
            print(f"Error reading fixture: {e}")
            return []

    if not api_key or api_key == "your_ogd_key_here":
        print("Warning: Live OGD API key not set. Skipping market fetch.")
        return []

    print(f"Fetching LIVE OGD data for {commodity_name} in {state}...")
    # NOTE: 9ef84268-d588-465a-a308-a864a43d0070 is a placeholder resource ID for Mandi Prices. 
    # You must update this with the specific resource ID from data.gov.in
    resource_id = "9ef84268-d588-465a-a308-a864a43d0070" 
    url = f"https://api.data.gov.in/resource/{resource_id}"
    params = {
        "api-key": api_key,
        "format": "json",
        "filters[state]": state,
        "filters[commodity]": commodity_name,
        "limit": 100
    }
    
    try:
        r = requests.get(url, params=params)
        r.raise_for_status()
        return r.json().get("records", [])
    except Exception as e:
        print(f"OGD API Error: {e}")
        return []

def run_pipeline():
    load_dotenv()
    db = SessionLocal()
    now = datetime.utcnow()
    ogd_key = os.getenv("OGD_API_KEY")
    is_demo = os.getenv("DEMO_MODE", "True").lower() in ("true", "1", "yes")
    
    print(f"--- AgriShield Ingestion Pipeline {'(DEMO MODE)' if is_demo else '(LIVE MODE)'} ---")
    
    try:
        # Get all active commodities and markets
        commodities = db.query(Commodity).filter(Commodity.active == True).all()
        markets = db.query(Market).all()
        
        for commodity in commodities:
            for market in markets:
                location = db.query(Location).filter(Location.id == market.location_id).first()
                if not location:
                    continue
                    
                print(f"\nProcessing {commodity.name} in {market.name} ({location.district}, {location.state})")
                
                # 1. MARKET DATA (OGD)
                records = fetch_ogd_data(ogd_key, location.state, commodity.name)
                # Filter to this specific market
                market_records = [r for r in records if r.get("district") == location.district]
                
                if market_records:
                    latest = market_records[-1]
                    try:
                        obs = MarketObservation(
                            market_id=market.id,
                            commodity_id=commodity.id,
                            observed_at=now,
                            min_price=float(latest.get("min_price", 0)),
                            max_price=float(latest.get("max_price", 0)),
                            modal_price=float(latest.get("modal_price", 0)),
                            arrival_quantity=float(latest.get("arrival_quantity", 500)), # OGD sometimes omits this
                            arrival_unit="quintal",
                            source_name="OGD India" if not is_demo else "OGD India (Demo)",
                            source_url="https://data.gov.in" if not is_demo else "demo://ogd",
                            created_at=now
                        )
                        db.add(obs)
                        print(f"  [+] Saved Market Observation: {obs.modal_price} INR")
                    except Exception as e:
                        print(f"  [!] Error parsing market data: {e}")
                else:
                    print("  [-] No market records found today.")

                # 2. SATELLITE DATA
                if is_demo:
                    print("  [+] DEMO_MODE: Skipping live satellite fetch. Using seed data baseline.")
                else:
                    sat_res = calculate_ndvi_for_region(location.longitude, location.latitude)
                    if sat_res:
                        sat_obs = SatelliteObservation(
                            location_id=location.id,
                            commodity_id=commodity.id,
                            observed_at=sat_res["date"],
                            metric_name="NDVI",
                            metric_value=sat_res["ndvi"],
                            source_name="Copernicus Sentinel-2",
                            product_id=sat_res["product_id"],
                            processing_version="v1",
                            created_at=now
                        )
                        db.add(sat_obs)
                        print(f"  [+] Saved Satellite NDVI: {sat_res['ndvi']:.4f}")
                
                # 3. NEWS SIGNAL
                news_items = fetch_and_classify_news(commodity.name, location.district)
                for item in news_items:
                    news_db = NewsItem(
                        title=item["title"],
                        source_name=item["source_name"],
                        source_url=item["source_url"],
                        published_at=item["published_at"],
                        commodity_id=commodity.id,
                        location_id=location.id,
                        event_type=item["event_type"],
                        relevance_score=item["relevance_score"],
                        model_confidence=item["model_confidence"],
                        summary=item["summary"],
                        created_at=now
                    )
                    db.add(news_db)
                    print(f"  [+] Saved News: {item['title'][:40]}...")

                db.commit()

                # 4. ANOMALY ENGINE
                print(f"  [*] Triggering Anomaly Engine...")
                result = evaluate_alert(
                    location.id, 
                    commodity.id, 
                    db, 
                    now, 
                    commodity_name=commodity.name, 
                    location_name=f"{location.district}, {location.state}"
                )
                if result:
                    print(f"  [!] ALERT GENERATED: Score {result.risk_score:.1f}/100 - {result.severity}")
                else:
                    print(f"  [-] No alert generated (insufficient data or normal conditions).")
                    
    finally:
        db.close()
        print("\n--- Pipeline Complete ---")

if __name__ == "__main__":
    run_pipeline()
