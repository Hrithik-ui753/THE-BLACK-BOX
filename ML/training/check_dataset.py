import pandas as pd

DATA_PATH = ".data/3S_LiIon_BMS_Training_Dataset_5000_3Batteries.xlsx"

df = pd.read_excel(DATA_PATH)

print("\n========== DATASET SHAPE ==========")
print(df.shape)

print("\n========== COLUMNS ==========")
for i, column in enumerate(df.columns):
    print(f"{i}: {column}")

print("\n========== FIRST 5 ROWS ==========")
print(df.head())

print("\n========== DATA TYPES ==========")
print(df.dtypes)

print("\n========== MISSING VALUES ==========")
print(df.isnull().sum())