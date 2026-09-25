from app.database import SessionLocal
from app.models import Location, Commodity
from app.engine import evaluate_alert

def main():
    db = SessionLocal()
    
    location = db.query(Location).first()
    commodity = db.query(Commodity).first()
    
    if not location or not commodity:
        print("No location or commodity found.")
        return
        
    alert = evaluate_alert(location.id, commodity.id, db)
    if alert:
        print(f"Alert generated: {alert.risk_score:.2f} (Severity: {alert.severity})")
        print(f"Explanation: {alert.explanation}")
        print(f"Missing signals: {alert.missing_signal_types}")
    else:
        print("No sufficient signals to generate alert.")
        
if __name__ == '__main__':
    main()
