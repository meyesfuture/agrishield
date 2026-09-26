import os
import sys
import pandas as pd
import datetime
from sqlalchemy.orm import Session
import kagglehub

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import engine, Base, SessionLocal
from app.models import (
    Commodity, Location, Market, MarketObservation,
    SatelliteObservation, NewsItem
)
from app.engine import evaluate_alert

def get_coordinates(state, district):
    # Hardcoded fallback coords for demo visualization mapping
    coords = {
        "nashik": (20.00, 73.78),
        "pune": (18.52, 73.85),
        "kolar": (13.13, 78.13),
        "mumbai": (19.07, 72.87),
        "ahmednagar": (19.09, 74.74),
        "bangalore": (12.97, 77.59),
        "kolhapur": (16.70, 74.24),
        "satara": (17.68, 73.98),
        "solapur": (17.65, 75.90)
    }
    key = str(district).lower().strip()
    return coords.get(key, (20.59, 78.96))  # Default center of India

def ingest_kaggle():
    print("Downloading dataset from Kaggle...")
    path = kagglehub.dataset_download("arunkumargiri/indian-agricultural-mandi-prices-20232025")
    csv_file = None
    for root, _, files in os.walk(path):
        for f in files:
            if f.endswith('.csv'):
                csv_file = os.path.join(root, f)
                break
    
    if not csv_file:
        print("CSV file not found in downloaded dataset.")
        return

    print(f"Reading dataset: {csv_file}")
    df = pd.read_csv(csv_file, low_memory=False)
    
    # Clean data
    df = df.dropna(subset=['Modal_Price', 'Price Date', 'STATE', 'District Name', 'Market Name', 'Commodity'])
    # Fill missing Min_Price and Max_Price with Modal_Price
    df['Min_Price'] = df['Min_Price'].fillna(df['Modal_Price'])
    df['Max_Price'] = df['Max_Price'].fillna(df['Modal_Price'])
    df['Price Date'] = pd.to_datetime(df['Price Date'], format='mixed', dayfirst=True)
    
    # Filter for interesting commodities and specific districts to keep DB small and focused
    target_commodities = ['Onion', 'Tomato', 'Potato']
    target_districts = ['nashik', 'pune', 'ahmednagar', 'mumbai', 'kolhapur']
    
    df = df[df['Commodity'].isin(target_commodities)]
    df = df[df['District Name'].str.lower().isin(target_districts)]
    
    if df.empty:
        print("No data matched the target filters.")
        return
        
    print(f"Filtered to {len(df)} rows for {target_commodities} in {target_districts}")

    # Shift dates so the maximum date in the dataset becomes "today"
    max_date = df['Price Date'].max()
    today = pd.Timestamp(datetime.datetime.utcnow().date())
    date_shift = today - max_date
    df['Price Date'] = df['Price Date'] + date_shift
    
    # Filter to only the last 45 days of shifted data
    cutoff_date = today - pd.Timedelta(days=45)
    df = df[df['Price Date'] >= cutoff_date]
    
    # Drop duplicates so we only get one observation per day per market per commodity
    df = df.drop_duplicates(subset=['STATE', 'District Name', 'Market Name', 'Commodity', 'Price Date'])
    
    print(f"Final data shape after date filtering: {len(df)} rows")

    print("Resetting database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 1. Create Commodities
        com_objs = {}
        for c in df['Commodity'].unique():
            com = Commodity(name=c, unit="quintal", active=True)
            db.add(com)
            com_objs[c] = com
        db.commit()
        
        # 2. Create Locations and Markets
        # Group by State, District, Market
        market_groups = df.groupby(['STATE', 'District Name', 'Market Name'])
        market_objs = {}
        
        for (state, dist, mkt), group in market_groups:
            # Check if location exists
            loc = db.query(Location).filter_by(state=state, district=dist).first()
            if not loc:
                lat, lon = get_coordinates(state, dist)
                loc = Location(state=state, district=dist, latitude=lat, longitude=lon)
                db.add(loc)
                db.commit()
            
            market = Market(name=mkt, location_id=loc.id)
            db.add(market)
            db.commit()
            market_objs[(state, dist, mkt)] = market
            
        print("Inserted Commodities, Locations, and Markets.")
        
        # 3. Create Market Observations
        obs_list = []
        for _, row in df.iterrows():
            c_obj = com_objs[row['Commodity']]
            m_obj = market_objs[(row['STATE'], row['District Name'], row['Market Name'])]
            
            obs = MarketObservation(
                market_id=m_obj.id,
                commodity_id=c_obj.id,
                observed_at=row['Price Date'].to_pydatetime(),
                min_price=row['Min_Price'],
                max_price=row['Max_Price'],
                modal_price=row['Modal_Price'],
                # Dataset has no arrival quantity, so it's left as None
                source_name="Kaggle Dataset (ARUNKUMARGIRI)",
                created_at=datetime.datetime.utcnow()
            )
            obs_list.append(obs)
            
        db.add_all(obs_list)
        db.commit()
        print(f"Inserted {len(obs_list)} market observations.")
        
        # 4. Generate Alerts
        print("Evaluating anomaly engine...")
        now = datetime.datetime.utcnow()
        # Find all unique Location/Commodity pairs
        unique_pairs = df[['District Name', 'Commodity']].drop_duplicates()
        
        for _, row in unique_pairs.iterrows():
            dist = row['District Name']
            com_name = row['Commodity']
            loc = db.query(Location).filter(Location.district.ilike(f"%{dist}%")).first()
            com = com_objs[com_name]
            if loc and com:
                evaluate_alert(loc.id, com.id, db, now, commodity_name=com.name, location_name=f"{loc.district}, {loc.state}")
                
        print("Database seeded with Kaggle data successfully.")
        
    finally:
        db.close()

if __name__ == "__main__":
    ingest_kaggle()
