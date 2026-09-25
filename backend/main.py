from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Location, Alert, MarketObservation, AnomalySignal, AlertSignal, Commodity, Market, NewsItem
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="AgriShield API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/api/overview")
def get_overview(db: Session = Depends(get_db)):
    monitored_locations = db.query(Location).count()
    active_alerts = db.query(Alert).filter(Alert.status == "active").count()
    commodities = db.query(Commodity).count()
    
    top_alert = db.query(Alert).filter(Alert.status == "active").order_by(Alert.risk_score.desc()).first()
    highest_risk = top_alert.risk_score if top_alert else 0
    
    return {
        "monitored_locations": monitored_locations,
        "active_alerts": active_alerts,
        "commodities": commodities,
        "highest_risk": highest_risk,
    }

def _build_alert_dict(alert, location, commodity, db: Session):
    """Build a complete alert dictionary with signals, history and timeline."""
    d = {}
    for col in alert.__table__.columns:
        val = getattr(alert, col.name)
        d[col.name] = val

    d['id'] = str(alert.id)
    d['location_name'] = f"{location.district}, {location.state}"
    d['latitude'] = location.latitude
    d['longitude'] = location.longitude
    d['commodity_name'] = commodity.name

    # Signals
    signals = (
        db.query(AnomalySignal)
        .join(AlertSignal, AlertSignal.signal_id == AnomalySignal.id)
        .filter(AlertSignal.alert_id == alert.id)
        .all()
    )
    signals_list = []
    for s in signals:
        sd = {}
        for col in s.__table__.columns:
            sd[col.name] = getattr(s, col.name)
        signals_list.append(sd)
    d['signals'] = signals_list

    return d

from typing import Optional

@app.get("/api/alerts")
def get_alerts(
    commodity: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    severity: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = (
        db.query(Alert, Location, Commodity)
        .join(Location, Alert.location_id == Location.id)
        .join(Commodity, Alert.commodity_id == Commodity.id)
    )
    
    if commodity:
        query = query.filter(Commodity.name.ilike(f"%{commodity}%"))
    if state:
        query = query.filter(Location.state.ilike(f"%{state}%"))
    if district:
        query = query.filter(Location.district.ilike(f"%{district}%"))
    if severity:
        query = query.filter(Alert.severity == severity)
    if start_date:
        query = query.filter(Alert.evaluated_at >= start_date)
    if end_date:
        query = query.filter(Alert.evaluated_at <= end_date)
        
    rows = query.all()
    return [_build_alert_dict(alert, loc, com, db) for alert, loc, com in rows]

@app.get("/api/alerts/{alert_id}")
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Alert, Location, Commodity)
        .join(Location, Alert.location_id == Location.id)
        .join(Commodity, Alert.commodity_id == Commodity.id)
        .filter(Alert.id == alert_id)
        .first()
    )
    if row is None:
        return {"error": "Alert not found"}

    alert, location, commodity = row
    d = _build_alert_dict(alert, location, commodity, db)

    # Price & arrival history — join through Market to get location
    observations = (
        db.query(MarketObservation)
        .join(Market, MarketObservation.market_id == Market.id)
        .filter(
            Market.location_id == alert.location_id,
            MarketObservation.commodity_id == alert.commodity_id
        )
        .order_by(MarketObservation.observed_at.asc())
        .limit(30)
        .all()
    )

    history = []
    for obs in observations:
        dt = obs.observed_at
        label = dt.strftime("%b %d") if hasattr(dt, 'strftime') else str(dt)
        history.append({
            "date": label,
            "price": obs.modal_price,
            "arrival": obs.arrival_quantity
        })
    d['history'] = history

    # Timeline: news items + alert creation event
    news_items = (
        db.query(NewsItem)
        .filter(
            NewsItem.location_id == alert.location_id,
            NewsItem.commodity_id == alert.commodity_id
        )
        .order_by(NewsItem.published_at.asc())
        .limit(5)
        .all()
    )

    timeline = []
    for n in news_items:
        dt = n.published_at
        label = dt.strftime("%b %d") if hasattr(dt, 'strftime') else str(dt)
        timeline.append({"date": label, "event": n.title})

    # Append the alert event last
    adate = alert.evaluated_at
    alabel = adate.strftime("%b %d") if hasattr(adate, 'strftime') else str(adate)
    timeline.append({
        "date": alabel,
        "event": f"Combined anomaly crossed threshold — Risk Score {alert.risk_score:.1f}/100"
    })
    d['timeline'] = timeline

    return d

@app.get("/api/alerts/{alert_id}/report")
def get_alert_report(alert_id: int, db: Session = Depends(get_db)):
    return get_alert(alert_id, db)

@app.get("/api/markets")
def get_markets(db: Session = Depends(get_db), limit: int = 100):
    """Returns a list of markets and their most recent observations."""
    markets = db.query(Market).all()
    results = []
    for m in markets:
        latest_obs = (
            db.query(MarketObservation)
            .filter(MarketObservation.market_id == m.id)
            .order_by(MarketObservation.observed_at.desc())
            .first()
        )
        results.append({
            "id": m.id,
            "name": m.name,
            "location_id": m.location_id,
            "latest_observation": {
                "date": latest_obs.observed_at if latest_obs else None,
                "modal_price": latest_obs.modal_price if latest_obs else None,
                "arrival_quantity": latest_obs.arrival_quantity if latest_obs else None
            } if latest_obs else None
        })
    return results

@app.get("/api/markets/{market_id}/history")
def get_market_history(market_id: int, db: Session = Depends(get_db), limit: int = 30):
    """Returns historical price/arrival observations for a market."""
    observations = (
        db.query(MarketObservation)
        .filter(MarketObservation.market_id == market_id)
        .order_by(MarketObservation.observed_at.desc())
        .limit(limit)
        .all()
    )
    
    # Return in chronological order
    observations.reverse()
    
    return [
        {
            "id": obs.id,
            "commodity_id": obs.commodity_id,
            "date": obs.observed_at,
            "min_price": obs.min_price,
            "max_price": obs.max_price,
            "modal_price": obs.modal_price,
            "arrival_quantity": obs.arrival_quantity,
            "arrival_unit": obs.arrival_unit
        } for obs in observations
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
