import pytest
from datetime import datetime, timedelta
from app.database import engine, Base, SessionLocal
from app.models import (
    Commodity, Location, Market, MarketObservation,
    SatelliteObservation, NewsItem
)
from app.engine import evaluate_alert

def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    onion = Commodity(name="Onion", unit="quintal", active=True)
    db.add(onion)
    db.commit()

    loc1 = Location(state="Maharashtra", district="Nashik", latitude=20.0, longitude=73.78)
    db.add(loc1)
    db.commit()

    m1 = Market(name="Nashik Mandi", location_id=loc1.id)
    db.add(m1)
    db.commit()
    
    return db, onion, loc1, m1

def test_missing_data():
    db, onion, loc1, m1 = setup_db()
    now = datetime.utcnow()
    
    # Generate only 10 days of MarketObservation (insufficient data)
    start_date = now - timedelta(days=10)
    for i in range(10):
        obs_date = start_date + timedelta(days=i)
        obs = MarketObservation(
            market_id=m1.id,
            commodity_id=onion.id,
            observed_at=obs_date,
            min_price=1400, max_price=1600, modal_price=1500,
            arrival_quantity=800, arrival_unit="quintal",
            source_name="demo", created_at=now
        )
        db.add(obs)
    db.commit()
    
    # Evaluate alert
    alert = evaluate_alert(loc1.id, onion.id, db, now)
    
    # Assertions
    assert alert is None, "Should return None if zero signals are usable (total_weight == 0)"
    db.close()

def test_partial_signals():
    db, onion, loc1, m1 = setup_db()
    now = datetime.utcnow()
    
    # Generate 15 days of MarketObservation (sufficient data)
    start_date = now - timedelta(days=15)
    for i in range(15):
        obs_date = start_date + timedelta(days=i)
        obs = MarketObservation(
            market_id=m1.id,
            commodity_id=onion.id,
            observed_at=obs_date,
            min_price=1400, max_price=1600, modal_price=1500,
            arrival_quantity=800, arrival_unit="quintal",
            source_name="demo", created_at=now
        )
        db.add(obs)
    db.commit()
    
    # Missing satellite data, missing news
    
    # Evaluate alert
    alert = evaluate_alert(loc1.id, onion.id, db, now)
    
    # Assertions
    assert alert is not None
    assert alert.partial_signals is True
    assert "satellite" in alert.missing_signal_types
    assert "news" in alert.missing_signal_types
    db.close()

if __name__ == "__main__":
    print("Running validations...")
    test_missing_data()
    test_partial_signals()
    print("All validations passed.")
