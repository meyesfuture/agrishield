from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Commodity(Base):
    __tablename__ = 'commodities'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    active = Column(Boolean, default=True)

class Location(Base):
    __tablename__ = 'locations'

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

class Market(Base):
    __tablename__ = 'markets'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location_id = Column(Integer, ForeignKey('locations.id'), nullable=False)

    location = relationship("Location")

class MarketObservation(Base):
    __tablename__ = 'market_observations'

    id = Column(Integer, primary_key=True, index=True)
    market_id = Column(Integer, ForeignKey('markets.id'), nullable=False)
    commodity_id = Column(Integer, ForeignKey('commodities.id'), nullable=False)
    observed_at = Column(DateTime, nullable=False)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    modal_price = Column(Float, nullable=False)
    arrival_quantity = Column(Float, nullable=True)
    arrival_unit = Column(String, nullable=True)
    source_name = Column(String, nullable=False)
    source_url = Column(String, nullable=True)
    raw_reference = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False)

    market = relationship("Market")
    commodity = relationship("Commodity")

    __table_args__ = (
        UniqueConstraint('market_id', 'commodity_id', 'observed_at', 'source_name', name='uix_market_obs'),
    )

class SatelliteObservation(Base):
    __tablename__ = 'satellite_observations'

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey('locations.id'), nullable=False)
    commodity_id = Column(Integer, ForeignKey('commodities.id'), nullable=True)
    observed_at = Column(DateTime, nullable=False)
    metric_name = Column(String, nullable=False)
    metric_value = Column(Float, nullable=False)
    source_name = Column(String, nullable=False)
    product_id = Column(String, nullable=True)
    processing_version = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False)

    location = relationship("Location")
    commodity = relationship("Commodity")

class NewsItem(Base):
    __tablename__ = 'news_items'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    source_name = Column(String, nullable=False)
    source_url = Column(String, nullable=True)
    published_at = Column(DateTime, nullable=False)
    commodity_id = Column(Integer, ForeignKey('commodities.id'), nullable=True)
    location_id = Column(Integer, ForeignKey('locations.id'), nullable=True)
    event_type = Column(String, nullable=False)
    relevance_score = Column(Float, nullable=False)
    model_confidence = Column(Float, nullable=False)
    summary = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False)

    commodity = relationship("Commodity")
    location = relationship("Location")

class AnomalySignal(Base):
    __tablename__ = 'anomaly_signals'

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey('locations.id'), nullable=False)
    commodity_id = Column(Integer, ForeignKey('commodities.id'), nullable=False)
    observed_at = Column(DateTime, nullable=False)
    signal_type = Column(String, nullable=False)
    raw_value = Column(Float, nullable=True)
    baseline_value = Column(Float, nullable=True)
    deviation = Column(Float, nullable=True)
    normalized_score = Column(Float, nullable=True)
    weight = Column(Float, nullable=False)
    sufficient_data = Column(Boolean, nullable=False)
    source_reference = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False)

    location = relationship("Location")
    commodity = relationship("Commodity")

class Alert(Base):
    __tablename__ = 'alerts'

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey('locations.id'), nullable=False)
    commodity_id = Column(Integer, ForeignKey('commodities.id'), nullable=False)
    evaluated_at = Column(DateTime, nullable=False)
    risk_score = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    explanation = Column(String, nullable=True)
    recommended_action = Column(String, nullable=True)
    status = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    partial_signals = Column(Boolean, nullable=False)
    missing_signal_types = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False)

    location = relationship("Location")
    commodity = relationship("Commodity")

class AlertSignal(Base):
    __tablename__ = 'alert_signals'

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey('alerts.id'), nullable=False)
    signal_id = Column(Integer, ForeignKey('anomaly_signals.id'), nullable=False)

    alert = relationship("Alert")
    signal = relationship("AnomalySignal")
