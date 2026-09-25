import random
from datetime import datetime, timedelta
from app.database import engine, Base, SessionLocal
from app.models import (
    Commodity, Location, Market, MarketObservation,
    SatelliteObservation, NewsItem
)
from app.engine import evaluate_alert

def seed_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    
    try:
        # Commodities
        onion = Commodity(name="Onion", unit="quintal", active=True)
        tomato = Commodity(name="Tomato", unit="quintal", active=True)
        db.add_all([onion, tomato])
        db.commit()

        # Locations with real coordinates
        loc1 = Location(state="Maharashtra", district="Nashik", latitude=20.00, longitude=73.78)
        loc2 = Location(state="Maharashtra", district="Pune",   latitude=18.52, longitude=73.85)
        loc3 = Location(state="Karnataka",   district="Kolar",  latitude=13.13, longitude=78.13)
        db.add_all([loc1, loc2, loc3])
        db.commit()

        # Markets
        m1 = Market(name="Nashik Mandi",    location_id=loc1.id)
        m2 = Market(name="Pune APMC",       location_id=loc2.id)
        m3 = Market(name="Kolar APMC",      location_id=loc3.id)
        db.add_all([m1, m2, m3])
        db.commit()

        now = datetime.utcnow()
        start_date = now - timedelta(days=30)

        # --- Seed market & satellite observations ---
        for i in range(30):
            obs_date = start_date + timedelta(days=i)
            is_anomaly_window = i > 24  # last 5 days show anomaly

            for m, loc in [(m1, loc1), (m2, loc2), (m3, loc3)]:
                for c in [onion, tomato]:
                    # Base price
                    base_price = 1500 if c.name == "Onion" else 2000
                    var = random.randint(-150, 150)

                    # Nashik Onion anomaly: price spike + arrival collapse
                    arrival_qty = random.uniform(700, 900)
                    if is_anomaly_window and m.id == m1.id and c.name == "Onion":
                        var += random.randint(800, 1200)       # price spike
                        arrival_qty = random.uniform(100, 250) # sharp arrival drop

                    modal = base_price + var
                    obs = MarketObservation(
                        market_id=m.id,
                        commodity_id=c.id,
                        observed_at=obs_date,
                        min_price=max(100, modal - 100),
                        max_price=modal + 100,
                        modal_price=modal,
                        arrival_quantity=arrival_qty,
                        arrival_unit="quintal",
                        source_name="demo",
                        source_url="demo://local",
                        created_at=now
                    )
                    db.add(obs)

                    # Satellite: Nashik Onion anomaly — NDVI drop
                    base_ndvi = 0.62 if c.name == "Onion" else 0.68
                    sat_var = random.uniform(-0.03, 0.03)
                    if is_anomaly_window:
                        if m.id == m1.id and c.name == "Onion":
                            sat_var -= random.uniform(0.15, 0.22)
                        elif m.id == m3.id and c.name == "Tomato":
                            sat_var -= random.uniform(0.20, 0.35)
                        elif m.id == m2.id and c.name == "Tomato":
                            sat_var -= random.uniform(0.10, 0.18)  # significant NDVI drop

                    sat_obs = SatelliteObservation(
                        location_id=loc.id,
                        commodity_id=c.id,
                        observed_at=obs_date,
                        metric_name="NDVI",
                        metric_value=max(0.05, base_ndvi + sat_var),
                        source_name="Copernicus Sentinel-2",
                        product_id="S2A_L2A",
                        processing_version="demo-v1",
                        created_at=now
                    )
                    db.add(sat_obs)

        # News for Nashik Onion anomaly
        news1 = NewsItem(
            title="Nashik Onion Prices Surge 60% Amid Transportation Strike",
            source_name="AgriNews Daily",
            source_url="demo://news/1",
            published_at=now - timedelta(days=3),
            commodity_id=onion.id,
            location_id=loc1.id,
            event_type="supply_shortage",
            relevance_score=0.92,
            model_confidence=0.88,
            summary="A week-long transportation strike has severely disrupted onion supply from Nashik mandis, causing prices to spike well above seasonal norms.",
            created_at=now
        )
        news2 = NewsItem(
            title="Maharashtra Onion Farmers Report Crop Damage from Unseasonal Rains",
            source_name="The Hindu",
            source_url="demo://news/2",
            published_at=now - timedelta(days=6),
            commodity_id=onion.id,
            location_id=loc1.id,
            event_type="crop_damage",
            relevance_score=0.78,
            model_confidence=0.80,
            summary="Unseasonal rains in Nashik district damaged standing onion crops, reducing expected harvest volumes for the current season.",
            created_at=now
        )
        news3 = NewsItem(
            title="Kolar Tomato Fields Hit by Devastating Whitefly Outbreak",
            source_name="AgriToday",
            source_url="demo://news/3",
            published_at=now - timedelta(days=2),
            commodity_id=tomato.id,
            location_id=loc3.id,
            event_type="pest_attack",
            relevance_score=0.95,
            model_confidence=0.90,
            summary="A massive whitefly outbreak has ruined tomato crops across Kolar, leading to severely restricted supplies in the market.",
            created_at=now
        )
        news4 = NewsItem(
            title="Pune Tomato Supply Impacted by Regional Heatwave",
            source_name="Local News",
            source_url="demo://news/4",
            published_at=now - timedelta(days=4),
            commodity_id=tomato.id,
            location_id=loc2.id,
            event_type="heatwave",
            relevance_score=0.85,
            model_confidence=0.82,
            summary="Soaring temperatures in the Pune region have affected tomato yields, driving prices higher as arrivals thin out.",
            created_at=now
        )
        db.add_all([news1, news2, news3, news4])
        db.commit()

        print("Seeding alerts via Anomaly Engine...")
        # Evaluate all location/commodity combinations
        combos = [
            (loc1, onion, "Onion", "Nashik, Maharashtra"),
            (loc1, tomato, "Tomato", "Nashik, Maharashtra"),
            (loc2, onion, "Onion", "Pune, Maharashtra"),
            (loc2, tomato, "Tomato", "Pune, Maharashtra"),
            (loc3, onion, "Onion", "Kolar, Karnataka"),
            (loc3, tomato, "Tomato", "Kolar, Karnataka"),
        ]
        for loc, c, cname, lname in combos:
            result = evaluate_alert(loc.id, c.id, db, now, commodity_name=cname, location_name=lname)
            if result:
                print(f"  + {cname} in {lname}: score={result.risk_score:.1f}, severity={result.severity}")
            else:
                print(f"  - {cname} in {lname}: insufficient data (skipped)")

        print("\nDatabase seeded successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_data()

