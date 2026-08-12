import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY")

class SupabaseService:
    def __init__(self):
        self.client: Optional[Client] = None
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
                logger.info("[SupabaseService] Initialized Supabase client successfully.")
            except Exception as e:
                logger.error(f"[SupabaseService] Initialization failed: {e}")

    def is_connected(self) -> bool:
        return self.client is not None

    # ============================================================
    # 1. BATTERIES CRUD OPERATIONS
    # ============================================================
    def get_all_batteries(self) -> List[Dict[str, Any]]:
        """READ: Fetch all battery records from Supabase."""
        if not self.client:
            return []
        try:
            res = self.client.table("batteries").select("*").execute()
            return res.data or []
        except Exception as e:
            logger.error(f"[SupabaseService] Failed to fetch batteries: {e}")
            return []

    def get_battery_by_id(self, battery_id: str) -> Optional[Dict[str, Any]]:
        """READ: Fetch single battery record."""
        if not self.client:
            return None
        try:
            res = self.client.table("batteries").select("*").eq("id", battery_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"[SupabaseService] Failed to fetch battery {battery_id}: {e}")
            return None

    def create_battery(self, battery_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """CREATE: Insert a new battery record."""
        if not self.client:
            return None
        try:
            res = self.client.table("batteries").insert(battery_data).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"[SupabaseService] Failed to create battery: {e}")
            return None

    def update_battery(self, battery_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """UPDATE: Update battery details."""
        if not self.client:
            return None
        try:
            res = self.client.table("batteries").update(updates).eq("id", battery_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"[SupabaseService] Failed to update battery {battery_id}: {e}")
            return None

    def delete_battery(self, battery_id: str) -> bool:
        """DELETE: Delete battery record from Supabase."""
        if not self.client:
            return False
        try:
            self.client.table("batteries").delete().eq("id", battery_id).execute()
            return True
        except Exception as e:
            logger.error(f"[SupabaseService] Failed to delete battery {battery_id}: {e}")
            return False

    # ============================================================
    # 2. SENSOR HISTORY & FULL ALL-TABLE CASCADE INSERT
    # ============================================================
    def record_full_telemetry(self, sensor_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Populates ALL 6 Supabase tables automatically:
        1. sensor_history
        2. derived_features
        3. predictions
        4. ai_analysis
        5. alerts (if warning/critical)
        """
        if not self.client:
            return {"status": "error", "message": "Supabase client not connected"}

        battery_id = sensor_data.get("battery_id", "164de9f0-62ee-411a-b8b9-a73eb2406f97")
        c1 = float(sensor_data.get("cell1_voltage_v", 4.12))
        c2 = float(sensor_data.get("cell2_voltage_v", 3.65))
        c3 = float(sensor_data.get("cell3_voltage_v", 4.10))
        total_v = float(sensor_data.get("total_voltage_v", c1 + c2 + c3))
        temp_c = float(sensor_data.get("battery_temperature_c", 35.4))

        voltages = [c1, c2, c3]
        min_v = min(voltages)
        max_v = max(voltages)
        avg_v = sum(voltages) / len(voltages)
        imbalance_v = max_v - min_v

        output = {}

        # 1. Insert into sensor_history
        try:
            sh_data = {
                "battery_id": battery_id,
                "cell1_voltage_v": c1,
                "cell2_voltage_v": c2,
                "cell3_voltage_v": c3,
                "total_voltage_v": total_v,
                "battery_temperature_c": temp_c,
                "ambient_temperature_c": sensor_data.get("ambient_temperature_c", 30.1),
                "gas_sensor_raw": sensor_data.get("gas_sensor_raw", 215),
            }
            res_sh = self.client.table("sensor_history").insert(sh_data).execute()
            output["sensor_history"] = res_sh.data[0] if res_sh.data else None
        except Exception as e:
            logger.error(f"[SupabaseService] sensor_history insert failed: {e}")

        # 2. Insert into derived_features
        try:
            df_data = {
                "battery_id": battery_id,
                "pack_voltage_v": total_v,
                "average_voltage_v": round(avg_v, 3),
                "min_voltage_v": min_v,
                "max_voltage_v": max_v,
                "voltage_imbalance_v": round(imbalance_v, 3),
                "temperature_rise_c": round(max(0.0, temp_c - 30.0), 2),
                "estimated_current_a": -2.8,
                "c_rate": 1.12,
                "power_w": round(total_v * 2.8, 2),
            }
            res_df = self.client.table("derived_features").insert(df_data).execute()
            output["derived_features"] = res_df.data[0] if res_df.data else None
        except Exception as e:
            logger.error(f"[SupabaseService] derived_features insert failed: {e}")

        # 3. Insert into predictions
        soc_pct = max(10, min(100, int((avg_v - 3.0) / 1.2 * 100)))
        soh_pct = 94.2 if min_v > 2.8 else 76.0
        anomaly_score = 94 if min_v <= 1.5 or imbalance_v > 0.5 else 12
        status_str = "CRITICAL" if min_v <= 2.5 or total_v < 7.5 else "WARNING" if imbalance_v > 0.15 else "HEALTHY"

        try:
            pred_data = {
                "battery_id": battery_id,
                "soc_percent": soc_pct,
                "soh_percent": soh_pct,
                "rul_days": 180 if min_v > 2.8 else 20,
                "anomaly_score": anomaly_score,
                "status": status_str,
            }
            res_pred = self.client.table("predictions").insert(pred_data).execute()
            output["predictions"] = res_pred.data[0] if res_pred.data else None
        except Exception as e:
            logger.error(f"[SupabaseService] predictions insert failed: {e}")

        # 4. Insert into ai_analysis
        try:
            ai_msg = (
                f"Severe Cell 3 voltage drop ({c3:.2f}V) detected with {imbalance_v:.2f}V pack imbalance."
                if min_v < 2.5
                else f"Battery net voltage {total_v:.2f}V is operating within configured bounds."
            )
            rec_act = (
                "Isolate battery pack and replace respective Cell 3 immediately!"
                if min_v <= 0.5
                else "Connect pack to charger immediately."
                if total_v < 7.5
                else "Continue standard monitoring."
            )
            ai_data = {
                "battery_id": battery_id,
                "severity": status_str,
                "ai_status": f"AI Assessment: {status_str}",
                "ai_message": ai_msg,
                "recommended_action": rec_act,
            }
            res_ai = self.client.table("ai_analysis").insert(ai_data).execute()
            output["ai_analysis"] = res_ai.data[0] if res_ai.data else None
        except Exception as e:
            logger.error(f"[SupabaseService] ai_analysis insert failed: {e}")

        # 5. Insert into alerts (if warning or critical)
        if status_str in ["WARNING", "CRITICAL"]:
            try:
                alert_data = {
                    "battery_id": battery_id,
                    "severity": status_str,
                    "alert_type": "CELL_IMBALANCE" if imbalance_v > 0.2 else "LOW_VOLTAGE",
                    "message": f"Alert: {status_str} status for {battery_id} — Net V: {total_v:.2f}V, Imbalance: {imbalance_v:.2f}V",
                    "acknowledged": False,
                }
                res_alt = self.client.table("alerts").insert(alert_data).execute()
                output["alerts"] = res_alt.data[0] if res_alt.data else None
            except Exception as e:
                logger.error(f"[SupabaseService] alerts insert failed: {e}")

        return {"status": "success", "data": output}

    # ============================================================
    # 3. READ QUERIES FOR ALL TABLES
    # ============================================================
    def get_sensor_history(self, battery_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """READ: Query sensor history from Supabase."""
        if not self.client:
            return []
        try:
            res = (
                self.client.table("sensor_history")
                .select("*")
                .eq("battery_id", battery_id)
                .order("timestamp", desc=True)
                .limit(limit)
                .execute()
            )
            return res.data or []
        except Exception as e:
            logger.error(f"[SupabaseService] Failed to fetch sensor history: {e}")
            return []

    def get_derived_features(self, battery_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """READ: Query derived features from Supabase."""
        if not self.client:
            return []
        try:
            res = (
                self.client.table("derived_features")
                .select("*")
                .eq("battery_id", battery_id)
                .order("timestamp", desc=True)
                .limit(limit)
                .execute()
            )
            return res.data or []
        except Exception as e:
            logger.error(f"[SupabaseService] Failed to fetch derived features: {e}")
            return []

    def get_predictions(self, battery_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """READ: Query ML predictions from Supabase."""
        if not self.client:
            return []
        try:
            res = (
                self.client.table("predictions")
                .select("*")
                .eq("battery_id", battery_id)
                .order("timestamp", desc=True)
                .limit(limit)
                .execute()
            )
            return res.data or []
        except Exception as e:
            logger.error(f"[SupabaseService] Failed to fetch predictions: {e}")
            return []

    def get_ai_analysis(self, battery_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """READ: Query AI analysis records from Supabase."""
        if not self.client:
            return []
        try:
            res = (
                self.client.table("ai_analysis")
                .select("*")
                .eq("battery_id", battery_id)
                .order("timestamp", desc=True)
                .limit(limit)
                .execute()
            )
            return res.data or []
        except Exception as e:
            logger.error(f"[SupabaseService] Failed to fetch ai analysis: {e}")
            return []

    def get_alerts(self, battery_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """READ: Query alerts log from Supabase."""
        if not self.client:
            return []
        try:
            query = self.client.table("alerts").select("*")
            if battery_id:
                query = query.eq("battery_id", battery_id)
            res = query.order("timestamp", desc=True).limit(limit).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"[SupabaseService] Failed to fetch alerts: {e}")
            return []

    def get_latest_processed_timestamp(self, battery_id: str) -> Optional[str]:
        """READ: Query the newest processed timestamp from sensor_history for backend restart recovery."""
        if not self.client:
            return None
        try:
            res = (
                self.client.table("sensor_history")
                .select("timestamp")
                .eq("battery_id", battery_id)
                .order("timestamp", desc=True)
                .limit(1)
                .execute()
            )
            if res.data and len(res.data) > 0:
                return str(res.data[0].get("timestamp", ""))
            return None
        except Exception as e:
            logger.error(f"[SupabaseService] Failed to fetch latest timestamp: {e}")
            return None

    def is_timestamp_processed(self, battery_id: str, timestamp_str: str) -> bool:
        """READ: Check if a specific Firebase timestamp already exists in sensor_history."""
        if not self.client or not timestamp_str:
            return False
        try:
            res = (
                self.client.table("sensor_history")
                .select("id")
                .eq("battery_id", battery_id)
                .eq("timestamp", timestamp_str)
                .limit(1)
                .execute()
            )
            return bool(res.data and len(res.data) > 0)
        except Exception as e:
            logger.error(f"[SupabaseService] Error checking timestamp deduplication: {e}")
            return False


# Global Singleton Service
supabase_db = SupabaseService()

