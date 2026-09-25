import os
import sys
import csv
from datetime import datetime

# Adjust Python path to run from backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Commodity, Location, Market, MarketObservation

# ==========================================
# CONFIGURATION - CHANGE THESE TO MATCH YOUR CSV
# ==========================================
CSV_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "fixtures", "kaggle_sample.csv")

# Map your CSV column headers to our database fields
# If your Kaggle CSV uses different column names (e.g. "Min Price" instead of "Min_Price"), change them here!
COLUMN_MAP = {
    "state": "State",
    "district": "District",
    "market": "Market",
    "commodity": "Commodity",
    "date": "Arrival_Date",
    "min_price": "Min Price",
    "max_price": "Max Price",
    "modal_price": "Modal Price",
    "arrival_qty": "Arrival_Volume" # Some CSVs don't have this, that's okay
}
# ==========================================

def import_csv():
    if not os.path.exists(CSV_FILE_PATH):
        print(f"Error: Could not find CSV file at {CSV_FILE_PATH}")
        print("Please download a dataset from Kaggle and place it there.")
        return

    db = SessionLocal()
    
    # Pre-fetch existing commodities and markets to minimize DB calls
    commodities = {c.name.lower(): c.id for c in db.query(Commodity).all()}
    markets_db = db.query(Market, Location).join(Location).all()
    markets = {m.Market.name.lower(): m.Market.id for m in markets_db}
    
    records_added = 0
    now = datetime.utcnow()
    
    try:
        seen = set()
        with open(CSV_FILE_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                # 1. Parse CSV fields safely
                c_name = row.get(COLUMN_MAP["commodity"], "").strip().lower()
                m_name = row.get(COLUMN_MAP["market"], "").strip().lower()
                
                # Fuzzy matching for markets
                target_market_id = None
                for db_m_name, m_id in markets.items():
                    # Check for partial matches like "pune" in "pune(khadiki)" or "nashik" 
                    if db_m_name.replace(" apmc", "").replace(" mandi", "") in m_name:
                        target_market_id = m_id
                        break
                    if "lasalgaon" in m_name and "nashik" in db_m_name:
                        target_market_id = m_id
                        break
                        
                if c_name not in commodities or not target_market_id:
                    continue
                    
                # 2. Parse Date (Try multiple common formats Kaggle datasets use)
                date_str = row.get(COLUMN_MAP["date"], "")
                obs_date = None
                for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
                    try:
                        obs_date = datetime.strptime(date_str, fmt)
                        break
                    except ValueError:
                        continue
                        
                if not obs_date:
                    continue
                
                # 3. Parse Numbers
                try:
                    min_p = float(row.get(COLUMN_MAP["min_price"], 0))
                    max_p = float(row.get(COLUMN_MAP["max_price"], 0))
                    modal_p = float(row.get(COLUMN_MAP["modal_price"], 0))
                    
                    arrival_str = row.get(COLUMN_MAP.get("arrival_qty", ""), "0")
                    arrival_q = float(arrival_str) if arrival_str else 0.0
                except ValueError:
                    continue
                
                # 4. Check for duplicates in memory and DB
                record_key = (target_market_id, commodities[c_name], obs_date)
                if record_key in seen:
                    continue
                seen.add(record_key)
                
                exists = db.query(MarketObservation.id).filter_by(
                    market_id=target_market_id,
                    commodity_id=commodities[c_name],
                    observed_at=obs_date,
                    source_name="Kaggle Dataset"
                ).first()
                
                if exists:
                    continue
                    
                # 5. Insert into database
                obs = MarketObservation(
                    market_id=target_market_id,
                    commodity_id=commodities[c_name],
                    observed_at=obs_date,
                    min_price=min_p,
                    max_price=max_p,
                    modal_price=modal_p,
                    arrival_quantity=arrival_q,
                    arrival_unit="quintal",
                    source_name="Kaggle Dataset",
                    created_at=now
                )
                db.add(obs)
                records_added += 1
                
                if records_added % 1000 == 0:
                    db.commit()
                
        db.commit()
        print(f"\nSuccess! Imported {records_added} historical records into the database.")
        print("Your Anomaly Engine now has a realistic baseline to compute from!")
        
    except Exception as e:
        print(f"Failed to import CSV: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("--- AgriShield Kaggle Data Importer ---")
    import_csv()
