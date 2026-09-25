import numpy as np
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.models import (
    MarketObservation, SatelliteObservation, NewsItem,
    AnomalySignal, Alert, AlertSignal, Market
)

def _generate_explanation(commodity_name: str, location_name: str, price_sufficient: bool, price_dev,
                           arrival_sufficient: bool, arrival_dev, sat_sufficient: bool, sat_dev,
                           news_sufficient: bool, news_score, final_score: float) -> str:
    parts = []
    if price_sufficient and price_dev is not None:
        pct = price_dev * 100
        direction = "spike" if pct > 0 else "drop"
        parts.append(f"Price {direction} of {abs(pct):.1f}% above historical median")
    if arrival_sufficient and arrival_dev is not None:
        pct = arrival_dev * 100
        direction = "decline" if pct > 0 else "surge"
        parts.append(f"Arrival {direction} of {abs(pct):.1f}% vs baseline")
    if sat_sufficient and sat_dev is not None:
        pct = sat_dev * 100
        condition = "poor" if pct > 5 else "normal"
        parts.append(f"Crop health signal is {condition} (NDVI deviation {pct:.1f}%)")
    if news_sufficient:
        parts.append("Supporting news signal detected for this commodity and region")
    if not parts:
        return "Insufficient data to generate explanation."
    return f"{commodity_name} anomaly in {location_name}: " + ". ".join(parts) + f". Combined risk score: {final_score:.1f}/100."

def _generate_recommended_action(severity: str, price_dev, arrival_dev, sat_dev) -> str:
    if severity == 'critical':
        if arrival_dev is not None and arrival_dev > 0.2:
            return ("Immediate field verification recommended. Sharp arrival decline paired with "
                    "price spike suggests possible supply withholding. Cross-reference with "
                    "warehouse stock reports and transportation data.")
        elif sat_dev is not None and sat_dev > 0.1:
            return ("Crop failure pattern detected. Coordinate with agricultural department to "
                    "assess actual yield and authorize emergency procurement from alternate markets.")
        else:
            return ("Critical risk threshold crossed. Dispatch field verification team to mandis "
                    "and recommend escalation to district agriculture officer for investigation.")
    elif severity == 'elevated':
        return ("Monitor closely over the next 3–5 days. If price deviation persists above 15%, "
                "recommend initiating mandi inspection. No immediate action required.")
    else:
        return ("Low risk. Continue standard monitoring. No intervention required at this time.")


def evaluate_alert(location_id: int, commodity_id: int, db: Session, target_date: Optional[datetime] = None,
                   commodity_name: str = "Commodity", location_name: str = "Location"):
    if target_date is None:
        target_date = datetime.utcnow()
        
    # 1. PRICE and ARRIVAL — join through Market to get location
    obs_query = db.query(MarketObservation).join(Market).filter(
        Market.location_id == location_id,
        MarketObservation.commodity_id == commodity_id,
        MarketObservation.observed_at <= target_date
    ).order_by(MarketObservation.observed_at.asc()).all()
    
    price_sufficient = len(obs_query) >= 14
    price_val = None
    price_baseline = None
    price_dev = None
    price_score = None
    
    arrival_sufficient = len(obs_query) >= 14
    arrival_val = None
    arrival_baseline = None
    arrival_dev = None
    arrival_score = None
    
    if len(obs_query) > 0:
        latest_obs = obs_query[-1]
        
        prices = [o.modal_price for o in obs_query if o.modal_price is not None]
        if price_sufficient and len(prices) >= 14:
            price_baseline = float(np.median(prices))
            price_val = latest_obs.modal_price
            if price_baseline > 0 and price_val is not None:
                price_dev = (price_val - price_baseline) / price_baseline
                price_score = min(100.0, max(0.0, abs(price_dev) * 200.0))
            else:
                price_sufficient = False
        else:
            price_sufficient = False
            
        arrivals = [o.arrival_quantity for o in obs_query if o.arrival_quantity is not None]
        if arrival_sufficient and len(arrivals) >= 14:
            arrival_baseline = float(np.median(arrivals))
            arrival_val = latest_obs.arrival_quantity
            if arrival_baseline > 0 and arrival_val is not None:
                arrival_dev = (arrival_baseline - arrival_val) / arrival_baseline
                arrival_score = min(100.0, max(0.0, arrival_dev * 200.0))
            else:
                arrival_sufficient = False
        else:
            arrival_sufficient = False

    # 3. SATELLITE
    sat_query = db.query(SatelliteObservation).filter(
        SatelliteObservation.location_id == location_id,
        SatelliteObservation.commodity_id == commodity_id,
        SatelliteObservation.observed_at <= target_date
    ).order_by(SatelliteObservation.observed_at.asc()).all()
    
    sat_sufficient = len(sat_query) >= 14
    sat_val = None
    sat_baseline = None
    sat_dev = None
    sat_score = None
    
    if len(sat_query) > 0:
        latest_sat = sat_query[-1]
        metrics = [s.metric_value for s in sat_query if s.metric_value is not None]
        if sat_sufficient and len(metrics) >= 14:
            sat_baseline = float(np.median(metrics))
            sat_val = latest_sat.metric_value
            if sat_baseline > 0 and sat_val is not None:
                sat_dev = (sat_baseline - sat_val) / sat_baseline
                sat_score = min(100.0, max(0.0, sat_dev * 200.0))
            else:
                sat_sufficient = False
        else:
            sat_sufficient = False

    # 4. NEWS
    news_query = db.query(NewsItem).filter(
        NewsItem.location_id == location_id,
        NewsItem.commodity_id == commodity_id,
        NewsItem.published_at <= target_date
    ).order_by(NewsItem.published_at.desc()).first()
    
    news_sufficient = news_query is not None
    news_score = None
    if news_sufficient:
        news_score = float(news_query.relevance_score * 100.0)
        
    base_weights = {
        'price': 0.35,
        'arrival': 0.35,
        'satellite': 0.20,
        'news': 0.10
    }
    
    def make_signal(sig_type, suf, score, val, base, dev):
        return AnomalySignal(
            location_id=location_id,
            commodity_id=commodity_id,
            observed_at=target_date,
            signal_type=sig_type,
            raw_value=float(val) if val is not None else None,
            baseline_value=float(base) if base is not None else None,
            deviation=float(dev) if dev is not None else None,
            normalized_score=float(score) if (suf and score is not None) else None,
            weight=base_weights[sig_type],
            sufficient_data=suf,
            created_at=datetime.utcnow()
        )
        
    s_price = make_signal('price', price_sufficient, price_score, price_val, price_baseline, price_dev)
    s_arrival = make_signal('arrival', arrival_sufficient, arrival_score, arrival_val, arrival_baseline, arrival_dev)
    s_satellite = make_signal('satellite', sat_sufficient, sat_score, sat_val, sat_baseline, sat_dev)
    s_news = make_signal('news', news_sufficient, news_score, None, None, None)
    
    db.add_all([s_price, s_arrival, s_satellite, s_news])
    db.flush()
    
    used_signals = [s for s in [s_price, s_arrival, s_satellite, s_news] if s.sufficient_data]
    total_weight = sum([s.weight for s in used_signals])
    
    partial = False
    missing = []
    for s in [s_price, s_arrival, s_satellite, s_news]:
        if not s.sufficient_data:
            partial = True
            missing.append(s.signal_type)
            
    if total_weight == 0:
        return None
        
    final_score = 0.0
    for s in used_signals:
        norm_w = s.weight / total_weight
        final_score += (s.normalized_score or 0.0) * norm_w
        
    used_scores = [s.normalized_score for s in used_signals if s.normalized_score is not None]
    consistency_score = max(0.0, 100.0 - float(np.std(used_scores))) if len(used_scores) > 1 else 100.0
    
    s_consistency = AnomalySignal(
        location_id=location_id,
        commodity_id=commodity_id,
        observed_at=target_date,
        signal_type='consistency',
        normalized_score=float(consistency_score),
        weight=0.0,
        sufficient_data=True,
        created_at=datetime.utcnow()
    )
    db.add(s_consistency)
    db.flush()
    
    if final_score > 80:
        severity = 'critical'
    elif final_score > 60:
        severity = 'elevated'
    else:
        severity = 'low'

    explanation = _generate_explanation(
        commodity_name, location_name,
        price_sufficient, price_dev,
        arrival_sufficient, arrival_dev,
        sat_sufficient, sat_dev,
        news_sufficient, news_score,
        final_score
    )
    recommended_action = _generate_recommended_action(severity, price_dev, arrival_dev, sat_dev)
        
    alert = db.query(Alert).filter_by(location_id=location_id, commodity_id=commodity_id).first()
    if not alert:
        alert = Alert(
            location_id=location_id,
            commodity_id=commodity_id,
            created_at=datetime.utcnow()
        )
        db.add(alert)
        
    alert.evaluated_at = target_date
    alert.risk_score = float(final_score)
    alert.severity = severity
    alert.explanation = explanation
    alert.recommended_action = recommended_action
    alert.status = 'active'
    alert.model_version = 'v1.0'
    alert.partial_signals = partial
    alert.missing_signal_types = ",".join(missing) if partial else None
    
    db.flush()
    
    db.query(AlertSignal).filter_by(alert_id=alert.id).delete()
    for s in [s_price, s_arrival, s_satellite, s_news, s_consistency]:
        db.add(AlertSignal(alert_id=alert.id, signal_id=s.id))
        
    db.commit()
    return alert
