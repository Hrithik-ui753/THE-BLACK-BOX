import pandas as pd


# ============================================================
# LOAD DATASET
# ============================================================

DATA_PATH = "../data/3S_LiIon_BMS_Training_Dataset_5000_3Batteries.xlsx"

df = pd.read_excel(DATA_PATH)


print("\n============================================================")
print("        THE BLACK BOX - OPERATING PROFILE ANALYSIS")
print("============================================================")


# ============================================================
# BASIC RANGES
# ============================================================

print("\nDATASET SIZE")
print("------------------------------------------------------------")
print(f"Rows : {len(df)}")


print("\nPACK VOLTAGE")
print("------------------------------------------------------------")
print(f"Minimum : {df['pack_voltage_V'].min():.3f} V")
print(f"Maximum : {df['pack_voltage_V'].max():.3f} V")
print(f"Mean    : {df['pack_voltage_V'].mean():.3f} V")


print("\nCURRENT")
print("------------------------------------------------------------")
print(f"Minimum max_current_A : {df['max_current_A'].min():.3f} A")
print(f"Maximum max_current_A : {df['max_current_A'].max():.3f} A")
print(f"Mean max_current_A    : {df['max_current_A'].mean():.3f} A")

print(f"\nMinimum avg_c_rate : {df['avg_c_rate'].min():.3f}")
print(f"Maximum avg_c_rate : {df['avg_c_rate'].max():.3f}")
print(f"Mean avg_c_rate    : {df['avg_c_rate'].mean():.3f}")


# ============================================================
# USAGE PROFILE
# ============================================================

print("\nUSAGE PROFILE")
print("------------------------------------------------------------")

print(
    df["usage_profile"]
    .value_counts()
    .to_string()
)


# ============================================================
# CURRENT BY USAGE PROFILE
# ============================================================

print("\nCURRENT BY USAGE PROFILE")
print("------------------------------------------------------------")

profile_current = (
    df.groupby("usage_profile")[
        ["avg_c_rate", "max_current_A"]
    ]
    .agg(["min", "max", "mean"])
)

print(profile_current.to_string())


# ============================================================
# PACK VOLTAGE BY USAGE PROFILE
# ============================================================

print("\nPACK VOLTAGE BY USAGE PROFILE")
print("------------------------------------------------------------")

profile_voltage = (
    df.groupby("usage_profile")[
        "pack_voltage_V"
    ]
    .agg(["min", "max", "mean"])
)

print(profile_voltage.to_string())


# ============================================================
# VOLTAGE → CURRENT RELATIONSHIP
# ============================================================

print("\nPACK VOLTAGE → CURRENT RELATIONSHIP")
print("------------------------------------------------------------")

voltage_current = (
    df.groupby(
        pd.cut(
            df["pack_voltage_V"],
            bins=10
        )
    )[
        ["pack_voltage_V", "max_current_A", "avg_c_rate"]
    ]
    .agg({
        "pack_voltage_V": ["min", "max", "mean"],
        "max_current_A": ["min", "max", "mean"],
        "avg_c_rate": ["min", "max", "mean"]
    })
)

print(
    voltage_current
    .to_string()
)


# ============================================================
# MORE USEFUL FIXED VOLTAGE BINS
# ============================================================

print("\nFIXED PACK-VOLTAGE PROFILE")
print("------------------------------------------------------------")

bins = [
    0,
    2,
    4,
    6,
    8,
    10,
    10.5,
    11.0,
    11.5,
    12.0,
    12.6,
    15
]

labels = [
    "0-2 V",
    "2-4 V",
    "4-6 V",
    "6-8 V",
    "8-10 V",
    "10-10.5 V",
    "10.5-11 V",
    "11-11.5 V",
    "11.5-12 V",
    "12-12.6 V",
    "12.6-15 V"
]

df["voltage_range"] = pd.cut(
    df["pack_voltage_V"],
    bins=bins,
    labels=labels,
    include_lowest=True
)

profile = (
    df.groupby(
        "voltage_range",
        observed=True
    )[
        [
            "max_current_A",
            "avg_c_rate",
            "pack_voltage_V"
        ]
    ]
    .agg([
        "count",
        "min",
        "max",
        "mean"
    ])
)

print(profile.to_string())


# ============================================================
# SAMPLE RECORDS
# ============================================================

print("\nSAMPLE OPERATING RECORDS")
print("------------------------------------------------------------")

columns = [
    "battery_id",
    "cycle_id",
    "usage_profile",
    "pack_voltage_V",
    "avg_c_rate",
    "max_current_A",
    "SoC_pct",
    "SoH_pct",
    "rul_to_80_cycles"
]

print(
    df[columns]
    .head(20)
    .to_string(index=False)
)


# ============================================================
# CORRELATIONS
# ============================================================

print("\nCORRELATION WITH CURRENT")
print("------------------------------------------------------------")

numeric_columns = [
    "pack_voltage_V",
    "voltage_avg_V",
    "cell_voltage_imbalance_V",
    "avg_c_rate",
    "max_current_A",
    "avg_temperature_C",
    "max_temperature_C",
    "ambient_temperature_C",
    "gas_sensor_raw",
    "discharge_depth_pct",
    "capacity_Ah",
    "temperature_rise_C",
    "power_avg_W",
    "gas_change_index",
    "SoC_pct",
    "SoH_pct",
    "rul_to_80_cycles"
]

correlation = (
    df[numeric_columns]
    .corr()["max_current_A"]
    .sort_values(
        ascending=False
    )
)

print(correlation.to_string())


print("\n============================================================")
print("                 ANALYSIS COMPLETE")
print("============================================================")