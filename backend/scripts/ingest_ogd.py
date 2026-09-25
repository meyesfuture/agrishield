import os
import json
import sys
import datetime
import requests
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

# Add parent dir to path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models import Commodity, Location, Market, MarketObservation
from app.engine import evaluate_alert
from dotenv import load_dotenv

load_dotenv()

def fetch_ogd_data():
    demo_mode = os.getenv("DEMO_MODE", "True").lower() in ("true", "1", "yes")
    
    if demo_mode:
        print("DEMO_MODE is True. Loading from fixture...")
        fixture_path = os.path.join(os.path.dirname(__file__), '..', 'fixtures', 'ogd_sample.json')
        with open(fixture_path, 'r') as f:
            return json.load(f).get('records', [])
    else:
        print("Fetching live data from OGD API...")
        # Placeholder for live API call
        api_key = os.getenv("OGD_API_KEY")
        if not api_key:
            print("Error: OGD_API_KEY not set. Cannot fetch live data.")
            sys.exit(1)
            
        url = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key={api_key}&format=json&limit=100"
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.json().get('records', [])
        except Exception as e:
            print(f"Error fetching live data: {e}")
            sys.exit(1)

def ingest_data():
    records = fetch_ogd_data()
    db = SessionLocal()
    
    inserted_count = 0
    skipped_count = 0
    locations_to_eval = set()
    
    now = datetime.datetime.now(datetime.timezone.utc)
    
    try:
        for record in records:
            # Get or create commodity
            c_name = record.get('commodity')
            commodity = db.query(Commodity).filter(Commodity.name == c_name).first()
            if not commodity:
                commodity = Commodity(name=c_name, unit="Quintal")
                db.add(commodity)
                db.flush()
                
            # Get or create location
            state = record.get('state')
            district = record.get('district')
            location = db.query(Location).filter(Location.state == state, Location.district == district).first()
            if not location:
                location = Location(state=state, district=district)
                db.add(location)
                db.flush()
                
            # Get or create market
            m_name = record.get('market')
            market = db.query(Market).filter(Market.name == m_name, Market.location_id == location.id).first()
            if not market:
                market = Market(name=m_name, location_id=location.id)
                db.add(market)
                db.flush()
                
            # Parse date
            date_str = record.get('arrival_date')
            try:
                # OGD dates are often DD/MM/YYYY
                obs_date = datetime.datetime.strptime(date_str, "%d/%m/%Y").replace(tzinfo=datetime.timezone.utc)
            except ValueError:
                obs_date = now # Fallback
                
            # Add observation
            obs = MarketObservation(
                market_id=market.id,
                commodity_id=commodity.id,
                observed_at=obs_date,
                min_price=float(record.get('min_price', 0)),
                max_price=float(record.get('max_price', 0)),
                modal_price=float(record.get('modal_price', 0)),
                arrival_quantity=float(record.get('arrival_quantity', 0)) if 'arrival_quantity' in record else None,
                arrival_unit="Tonnes" if 'arrival_quantity' in record else None,
                source_name="OGD India",
                created_at=now
            )
            
            # Check unique constraint manually to avoid transaction rollback
            exists = db.query(MarketObservation).filter(
                MarketObservation.market_id == market.id,
                MarketObservation.commodity_id == commodity.id,
                MarketObservation.observed_at == obs_date,
                MarketObservation.source_name == "OGD India"
            ).first()
            
            if not exists:
                db.add(obs)
                inserted_count += 1
                locations_to_eval.add((location.id, commodity.id))
            else:
                skipped_count += 1
                
        db.commit()
        print(f"Ingestion complete: {inserted_count} records inserted, {skipped_count} skipped (duplicates).")
        
        if inserted_count > 0:
            print("Running Anomaly Engine on updated markets...")
            for loc_id, com_id in locations_to_eval:
                alert = evaluate_alert(loc_id, com_id, db)
                if alert:
                    print(f"Alert generated for Location {loc_id}, Commodity {com_id}: Score {alert.risk_score}")
                
    except Exception as e:
        db.rollback()
        print(f"Database error during ingestion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    ingest_data()
