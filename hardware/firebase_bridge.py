import serial
import firebase_admin

from firebase_admin import credentials
from firebase_admin import db

from datetime import datetime


# =====================================================
# CONFIGURATION
# =====================================================

SERIAL_PORT = "COM9"
BAUD_RATE = 9600

SERVICE_ACCOUNT_FILE = "black-box-24537-firebase-adminsdk-fbsvc-a7c1ce317e.json"

DATABASE_URL = "https://black-box-24537-default-rtdb.firebaseio.com/"


# =====================================================
# FIREBASE INITIALIZATION
# =====================================================

cred = credentials.Certificate(
    SERVICE_ACCOUNT_FILE
)

firebase_admin.initialize_app(
    cred,
    {
        "databaseURL": DATABASE_URL
    }
)


# =====================================================
# ARDUINO SERIAL CONNECTION
# =====================================================

arduino = serial.Serial(
    SERIAL_PORT,
    BAUD_RATE,
    timeout=1
)

print("==========================================")
print("      THE BLACK BOX FIREBASE BRIDGE")
print("==========================================")
print()
print("Arduino :", SERIAL_PORT)
print("Firebase: CONNECTED")
print()
print("Waiting for sensor data...")
print()


# =====================================================
# MAIN LOOP
# =====================================================

while True:

    try:

        # -------------------------------------------------
        # READ ARDUINO SERIAL DATA
        # -------------------------------------------------

        line = arduino.readline().decode(
            "utf-8",
            errors="ignore"
        ).strip()

        if not line:
            continue

        print("Arduino:", line)


        # -------------------------------------------------
        # ONLY PROCESS DATA PACKET
        # -------------------------------------------------

        if not line.startswith("DATA,"):
            continue


        values = line.split(",")


        # -------------------------------------------------
        # EXPECTED FORMAT
        #
        # DATA,
        # cell1 voltage,
        # cell2 voltage,
        # cell3 voltage,
        # total voltage,
        # battery temperature,
        # ambient temperature,
        # gas
        # -------------------------------------------------

        if len(values) != 8:

            print("ERROR: Invalid DATA packet")

            continue


        # -------------------------------------------------
        # READ VALUES
        # -------------------------------------------------

        cell1_voltage = float(values[1])

        cell2_voltage = float(values[2])

        cell3_voltage = float(values[3])

        total_voltage = float(values[4])

        battery_temperature = float(values[5])

        ambient_temperature = float(values[6])

        gas = int(float(values[7]))


        # =================================================
        # TIMESTAMP
        # =================================================

        timestamp = datetime.now().astimezone().isoformat()


        # =================================================
        # SENSOR DATA
        # =================================================

        sensor_data = {

            "cell1 voltage": cell1_voltage,

            "cell2 voltage": cell2_voltage,

            "cell3 voltage": cell3_voltage,

            "totalVoltage": total_voltage,

            "temperature": battery_temperature,

            "ambientTemperature":
                ambient_temperature,

            "gas": gas,

            "timestamp": timestamp
        }


        # =================================================
        # 1. UPDATE LIVE DATA
        # =================================================
        #
        # This ALWAYS replaces the previous live reading.
        #
        # /battery/live
        #
        # =================================================

        db.reference(
            "battery/live"
        ).set(sensor_data)


        # =================================================
        # 2. ADD TO HISTORY
        # =================================================
        #
        # push() creates a unique Firebase ID.
        #
        # Previous history records are NOT overwritten.
        #
        # /battery/history/<unique_id>
        #
        # =================================================

        db.reference(
            "battery/history"
        ).push(sensor_data)


        # =================================================
        # SUCCESS MESSAGE
        # =================================================

        print()
        print("------------------------------------------")
        print("       DATA SENT TO FIREBASE")
        print("------------------------------------------")

        print(
            f"cell1 voltage      : {cell1_voltage}"
        )

        print(
            f"cell2 voltage      : {cell2_voltage}"
        )

        print(
            f"cell3 voltage      : {cell3_voltage}"
        )

        print(
            f"totalVoltage       : {total_voltage}"
        )

        print(
            f"temperature        : {battery_temperature}"
        )

        print(
            f"ambientTemperature : {ambient_temperature}"
        )

        print(
            f"gas                : {gas}"
        )

        print(
            f"timestamp          : {timestamp}"
        )

        print("------------------------------------------")
        print("LIVE      -> UPDATED")
        print("HISTORY   -> SAVED")
        print("------------------------------------------")
        print()


    # =====================================================
    # STOP PROGRAM
    # =====================================================

    except KeyboardInterrupt:

        print()
        print("Firebase bridge stopped.")

        arduino.close()

        break


    # =====================================================
    # ERROR HANDLING
    # =====================================================

    except Exception as e:

        print()
        print("ERROR:")
        print(e)
        print()