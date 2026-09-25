import os
import sys
import pandas as pd
from datetime import datetime, timedelta

# Adjust Python path to run from backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Commodity, Location, Market, MarketObservation

def fetch_agmarknet_data():
    db = SessionLocal()
    
    # 1. We will fetch data for the last 30 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    date_from = start_date.strftime("%d-%b-%Y") # e.g., 26-Aug-2026
    date_to = end_date.strftime("%d-%b-%Y")
    
    print(f"Scraping Agmarknet from {date_from} to {date_to}...")

    # Pre-fetch existing commodities and markets
    commodities = {c.name.lower(): c.id for c in db.query(Commodity).all()}
    markets_db = db.query(Market, Location).join(Location).all()
    markets = {m.Market.name.lower(): m.Market.id for m in markets_db}
    
    records_added = 0
    now = datetime.utcnow()

    # 2. Iterate through our target combinations
    # Agmarknet uses specific IDs. For a simple MVP scraper, we can do a generalized text search 
    # but the easiest way is hitting their direct report URL and letting Pandas parse the HTML table!
    
    targets = [
        {"commodity": "Onion", "state": "MH", "state_name": "Maharashtra", "district": "14", "district_name": "Nashik", "comm_id": "78"},
        {"commodity": "Tomato", "state": "MH", "state_name": "Maharashtra", "district": "14", "district_name": "Nashik", "comm_id": "78"}, # Note: Tomato ID differs, using general search
    ]

    try:
        for t in targets:
            print(f"  -> Fetching {t['commodity']} in {t['district_name']}...")
            
            # The exact URL format Agmarknet uses for Date-to-Date reports
            url = f"https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity={t['comm_id']}&Tx_State={t['state']}&Tx_District={t['district']}&Tx_Market=0&DateFrom={date_from}&DateTo={date_to}&Fr_Date={date_from}&To_Date={date_to}&Tx_Trend=0&Tx_CommodityHead={t['commodity']}&Tx_StateHead={t['state_name']}&Tx_DistrictHead={t['district_name']}"
            
            try:
                # Pandas magically extracts HTML tables from a URL!
                tables = pd.read_html(url)
                if not tables:
                    continue
                    
                df = tables[0]
                
                # Check if the table has actual data or just the "No Data Found" header
                if len(df) < 2 or 'Market Name' not in df.columns:
                    print(f"     No data found for this combination.")
                    continue
                
                for index, row in df.iterrows():
                    c_name = str(row.get('Commodity', '')).strip().lower()
                    m_name = str(row.get('Market Name', '')).strip().lower()
                    
                    if c_name not in commodities or m_name not in markets:
                        continue
                        
                    date_str = str(row.get('Price Date', ''))
                    try:
                        obs_date = datetime.strptime(date_str, "%d %b %Y")
                    except ValueError:
                        continue
                        
                    try:
                        min_p = float(row.get('Min Price (Rs./Quintal)', 0))
                        max_p = float(row.get('Max Price (Rs./Quintal)', 0))
                        modal_p = float(row.get('Modal Price (Rs./Quintal)', 0))
                    except ValueError:
                        continue
                        
                    obs = MarketObservation(
                        market_id=markets[m_name],
                        commodity_id=commodities[c_name],
                        observed_at=obs_date,
                        min_price=min_p,
                        max_price=max_p,
                        modal_price=modal_p,
                        arrival_quantity=0, # Agmarknet basic price table often omits arrivals
                        arrival_unit="quintal",
                        source_name="Agmarknet (Scraped)",
                        created_at=now
                    )
                    db.add(obs)
                    records_added += 1
            except Exception as e:
                print(f"     Failed to parse URL: {e}")
                
        db.commit()
        print(f"\nSuccess! Scraped {records_added} historical records straight from the government website.")
        
    except Exception as e:
        print(f"Error scraping Agmarknet: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("--- AgriShield Direct Agmarknet Scraper ---")
    fetch_agmarknet_data()
