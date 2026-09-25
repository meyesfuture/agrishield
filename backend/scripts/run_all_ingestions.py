import os
import sys
import subprocess

def run_script(script_name):
    print(f"\n{'='*60}")
    print(f"🚀 Starting ingestion: {script_name}")
    print(f"{'='*60}")
    
    script_path = os.path.join(os.path.dirname(__file__), script_name)
    
    # Run the script using the same python interpreter
    result = subprocess.run([sys.executable, script_path])
    
    if result.returncode != 0:
        print(f"\n❌ Error: {script_name} failed with exit code {result.returncode}")
    else:
        print(f"\n✅ Successfully finished {script_name}")

if __name__ == "__main__":
    print("Starting AgriShield Master Data Ingestion Pipeline...")
    
    scripts = [
        "ingest_ogd.py",
        "ingest_satellite.py",
        "ingest_news.py"
    ]
    
    for script in scripts:
        run_script(script)
        
    print("\n" + "="*60)
    print("🎉 All ingestion jobs completed!")
    print("Refresh your React dashboard to see the latest anomaly alerts.")
    print("="*60 + "\n")
