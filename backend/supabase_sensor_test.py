import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SECRET_KEY")
)

BATTERY_ID = "164de9f0-62ee-411a-b8b9-a73eb2406f97"

sensor_data = {
    "battery_id": BATTERY_ID,

    "cell1_voltage_v": 4.12,
    "cell2_voltage_v": 4.08,
    "cell3_voltage_v": 4.10,

    "total_voltage_v": 12.30,

    "battery_temperature_c": 35.4,
    "ambient_temperature_c": 30.1,

    "gas_sensor_raw": 215
}

result = (
    supabase
    .table("sensor_history")
    .insert(sensor_data)
    .execute()
)

print("SENSOR DATA STORED SUCCESSFULLY")
print(result.data)