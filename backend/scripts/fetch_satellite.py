import os
import sys
from datetime import datetime, timedelta
from pystac_client import Client
import rasterio
import numpy as np

# Suppress rasterio warnings about not finding AWS credentials (since it's public data)
os.environ["AWS_NO_SIGN_REQUEST"] = "YES"

def calculate_ndvi_for_region(lon, lat, buffer=0.1, days_back=30):
    """
    Fetches the latest Sentinel-2 L2A image for a given coordinate 
    from Element 84 Earth Search (AWS) and calculates the average NDVI.
    """
    print(f"Searching for satellite data near [Lon: {lon}, Lat: {lat}]...")
    
    # Create a bounding box around the coordinate
    bbox = [lon - buffer, lat - buffer, lon + buffer, lat + buffer]
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days_back)
    date_range = f"{start_date.strftime('%Y-%m-%d')}/{end_date.strftime('%Y-%m-%d')}"

    # Connect to the public STAC API
    client = Client.open("https://earth-search.aws.element84.com/v1")
    
    search = client.search(
        collections=["sentinel-2-l2a"],
        bbox=bbox,
        datetime=date_range,
        query={"eo:cloud_cover": {"lt": 20}}, # Less than 20% cloud cover
        max_items=1
    )
    
    items = list(search.items())
    if not items:
        print("No clear satellite images found in the last 30 days.")
        return None
        
    item = items[0]
    obs_date = item.datetime
    cloud_cover = item.properties.get("eo:cloud_cover", 0)
    
    print(f"Found image from {obs_date.strftime('%Y-%m-%d')} (Cloud cover: {cloud_cover}%)")
    
    try:
        # In Element 84 STAC, the bands are named by their common names
        red_url = item.assets["red"].href
        nir_url = item.assets["nir"].href
        
        print("Downloading overview resolution to calculate NDVI...")
        
        # Read at a lower resolution (overview) to save bandwidth
        # 1/10th resolution is plenty for a regional average
        scale_factor = 10 
        
        with rasterio.open(red_url) as src:
            red = src.read(1, out_shape=(int(src.height // scale_factor), int(src.width // scale_factor)))
            
        with rasterio.open(nir_url) as src:
            nir = src.read(1, out_shape=(int(src.height // scale_factor), int(src.width // scale_factor)))
            
        # Convert to float for math
        red = red.astype(float)
        nir = nir.astype(float)
        
        # Prevent division by zero warnings
        np.seterr(divide='ignore', invalid='ignore')
        
        # Calculate NDVI: (NIR - RED) / (NIR + RED)
        ndvi_array = (nir - red) / (nir + red)
        
        # Get the average NDVI across this area, ignoring NaNs and negative values (water/clouds)
        valid_ndvi = ndvi_array[(ndvi_array > 0) & (~np.isnan(ndvi_array))]
        mean_ndvi = float(np.mean(valid_ndvi))
        
        print(f"--> Calculated Regional NDVI: {mean_ndvi:.4f}")
        
        return {
            "date": obs_date,
            "ndvi": mean_ndvi,
            "cloud_cover": cloud_cover,
            "product_id": item.id
        }
        
    except Exception as e:
        print(f"Error calculating NDVI: {e}")
        return None

if __name__ == "__main__":
    # Test coordinates for Nashik, Maharashtra
    NASHIK_LON = 73.78
    NASHIK_LAT = 20.00
    
    print("--- AgriShield Satellite Data Fetcher (Element 84) ---")
    result = calculate_ndvi_for_region(NASHIK_LON, NASHIK_LAT)
    
    if result:
        print("\nSuccess! You can now save this to your database:")
        print(f"Observation Date: {result['date']}")
        print(f"NDVI Metric: {result['ndvi']:.4f}")
        print(f"Source: Copernicus Sentinel-2 via Element 84 (ID: {result['product_id']})")
