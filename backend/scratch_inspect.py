import kagglehub
import pandas as pd
import os

print("Downloading dataset 1...")
path1 = kagglehub.dataset_download("arunkumargiri/indian-agricultural-mandi-prices-20232025")
print("Path 1:", path1)

print("\nDownloading dataset 2...")
path2 = kagglehub.dataset_download("anshtanwar/current-daily-price-of-various-commodities-india")
print("Path 2:", path2)

def inspect_dataset(path):
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(".csv"):
                file_path = os.path.join(root, file)
                print(f"\n--- Inspecting {file} ---")
                try:
                    df = pd.read_csv(file_path, low_memory=False)
                    print(f"Total rows: {len(df)}")
                    print("Columns:")
                    print(df.dtypes)
                    print("\nSample (first 2 rows):")
                    print(df.head(2).to_dict(orient='records'))
                    print("\nUnique Commodities (sample):", df.get('Commodity', df.get('commodity', df.get('commodity_name', pd.Series([])))).dropna().unique()[:10])
                except Exception as e:
                    print(f"Failed to read {file}: {e}")

inspect_dataset(path1)
inspect_dataset(path2)
