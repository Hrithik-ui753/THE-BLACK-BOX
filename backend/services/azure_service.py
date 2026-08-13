import logging
import requests
from typing import Dict, Any, List, Optional

from config import AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT, DEFAULT_BATTERY_ID
from supabase_service import supabase_db

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are THE BLACK BOX Battery AI Assistant — an expert battery electro-chemistry and machine learning diagnostics assistant.

Your primary goal is to provide concise, direct, accurate, and user-friendly technical explanations based strictly on verified inputs.

RESPONSE RULES FOR TECHNICAL TRANSPARENCY:
1. **Direct Answer First**: Always start immediately with a concise 1-2 sentence paragraph explaining the battery state.
2. **Key Points (Bullet List)**: Highlight verified telemetry (measured cell voltages, temperature, cycle count), calculated metrics (spread, average), and ML predictions (SOC, SOH, RUL).
3. **Strict Data Boundary**: Never invent numerical metrics, confidence scores, or fake maintenance numbers (such as "perform balancing after exactly 30 cycles").
4. **Data Source Distinction**: Maintain strict separation between MEASURED telemetry, CALCULATED metrics, ML PREDICTIONS, and RULE-BASED engineering recommendations.
5. **No False Alarms / Hallucinations**: Rely strictly on the provided verified structured context.
"""


class AzureService:
    def get_battery_context(self, battery_id: str = DEFAULT_BATTERY_ID) -> Dict[str, Any]:
        """Fetch latest battery context from Supabase and live prediction cache."""
        context = {
            "battery_profile": None,
            "latest_sensors": None,
            "predictions": None,
            "derived_features": None,
            "alerts": []
        }

        if not supabase_db.is_connected():
            return context

        try:
            profile = supabase_db.get_battery_by_id(battery_id)
            context["battery_profile"] = profile

            sensors = supabase_db.get_sensor_history(battery_id, limit=1)
            if sensors:
                context["latest_sensors"] = sensors[0]

            preds = supabase_db.get_predictions(battery_id, limit=1)
            if preds:
                context["predictions"] = preds[0]

            derived = supabase_db.get_derived_features(battery_id, limit=1)
            if derived:
                context["derived_features"] = derived[0]

            alerts = supabase_db.get_alerts(battery_id, limit=5)
            context["alerts"] = alerts

        except Exception as e:
            logger.error(f"[AzureService] Error building battery context: {e}")

        return context

    def format_context_prompt(self, context: Dict[str, Any], cell_index: Optional[int] = None) -> str:
        """Format context into markdown for Azure system instructions."""
        profile = context.get("battery_profile") or {}
        sensors = context.get("latest_sensors") or {}
        predictions = context.get("predictions") or {}
        derived = context.get("derived_features") or {}
        alerts = context.get("alerts") or []

        lines = ["=== CURRENT BATTERY TELEMETRY & METADATA ==="]
        lines.append(f"Battery ID: {profile.get('id', DEFAULT_BATTERY_ID)}")
        lines.append(f"Battery Name: {profile.get('battery_name', 'BLACK_BOX_BATTERY_001')}")
        lines.append(f"Chemistry: {profile.get('chemistry', 'Li-Ion 3S')}")
        lines.append(f"Rated Capacity: {profile.get('rated_capacity_ah', 2.8)} Ah")

        if cell_index is not None:
            lines.append(f"Selected Focused Cell: Cell {cell_index}")

        if sensors:
            lines.append("\n[LATEST MEASURED SENSORS]")
            lines.append(f"- Timestamp: {sensors.get('timestamp', 'N/A')}")
            lines.append(f"- Cell 1 Voltage: {sensors.get('cell1_voltage_v', 'N/A')} V")
            lines.append(f"- Cell 2 Voltage: {sensors.get('cell2_voltage_v', 'N/A')} V")
            lines.append(f"- Cell 3 Voltage: {sensors.get('cell3_voltage_v', 'N/A')} V")
            lines.append(f"- Total Voltage: {sensors.get('total_voltage_v', 'N/A')} V")
            lines.append(f"- Battery Temp: {sensors.get('battery_temperature_c', 'N/A')} °C")
            lines.append(f"- Ambient Temp: {sensors.get('ambient_temperature_c', 'N/A')} °C")
            lines.append(f"- Gas Sensor Raw: {sensors.get('gas_sensor_raw', 'N/A')}")

        if derived:
            lines.append("\n[ENGINEERED & DERIVED FEATURES (DATASET ANALYSIS)]")
            lines.append(f"- Pack Cell Voltage Imbalance (ΔV): {derived.get('voltage_imbalance_v', derived.get('cell_voltage_imbalance_V', 'N/A'))} V")
            lines.append(f"- Average Cell Voltage: {derived.get('average_voltage_v', derived.get('voltage_avg_V', 'N/A'))} V")
            lines.append(f"- Min Cell Voltage: {derived.get('min_voltage_v', derived.get('min_cell_voltage_V', 'N/A'))} V")
            lines.append(f"- Max Cell Voltage: {derived.get('max_voltage_v', derived.get('max_cell_voltage_V', 'N/A'))} V")
            lines.append(f"- Temperature Rise above Ambient (ΔT): {derived.get('temperature_rise_c', derived.get('temperature_rise_C', 'N/A'))} °C")
            lines.append(f"- Estimated Load Current: {derived.get('estimated_current_a', derived.get('estimated_current_A', 'N/A'))} A (Calculated proxy)")
            lines.append(f"- Operating C-Rate: {derived.get('c_rate', derived.get('avg_c_rate', 'N/A'))} C")
            lines.append(f"- Average Power Throughput: {derived.get('power_w', derived.get('power_avg_W', 'N/A'))} W")
            lines.append(f"- Internal Resistance Proxy: {derived.get('internal_resistance_proxy_ohm', derived.get('internal_resistance', 0.045))} Ω")
            lines.append(f"- Gas Change Index: {derived.get('gas_change_index', 0.05)}")
            lines.append(f"- Depth of Discharge (DOD): {derived.get('discharge_depth_pct', 60.0)} %")

        if predictions:
            lines.append("\n[ML MODEL PREDICTIONS]")
            lines.append(f"- State of Charge (SOC): {predictions.get('soc_percent', 'N/A')}%")
            lines.append(f"- State of Health (SOH): {predictions.get('soh_percent', 'N/A')}%")
            lines.append(f"- Remaining Useful Life (RUL): {predictions.get('rul_days', 'N/A')} cycles")
            lines.append(f"- Anomaly Score: {predictions.get('anomaly_score', 'N/A')}")
            lines.append(f"- System Status: {predictions.get('status', 'NORMAL')}")

        if alerts:
            lines.append("\n[RECENT ACTIVE ALERTS]")
            for a in alerts:
                lines.append(f"- [{a.get('severity', 'WARNING')}] {a.get('alert_type', 'Alert')}: {a.get('message', '')}")

        lines.append("============================================")
        return "\n".join(lines)

    def generate_chat_response(self, user_message: str, battery_id: str = DEFAULT_BATTERY_ID, history: List[Dict[str, str]] = [], cell_index: Optional[int] = None) -> str:
        """Calls Azure OpenAI endpoint to generate response using live battery context."""
        context = self.get_battery_context(battery_id)
        context_text = self.format_context_prompt(context, cell_index)

        full_instructions = f"{SYSTEM_PROMPT}\n\n{context_text}"

        input_parts = []
        if history:
            for h in history[-6:]:
                role = "User" if h.get("role") == "user" else "Assistant"
                input_parts.append(f"{role}: {h.get('content', '')}")
        input_parts.append(f"User: {user_message}")
        full_input = "\n".join(input_parts)

        if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_API_KEY:
            return self._build_fallback_response(context)

        headers = {
            "Content-Type": "application/json",
            "api-key": AZURE_OPENAI_API_KEY
        }
        body = {
            "model": AZURE_OPENAI_DEPLOYMENT,
            "instructions": full_instructions,
            "input": full_input
        }

        try:
            response = requests.post(AZURE_OPENAI_ENDPOINT, headers=headers, json=body, timeout=30)
            response.raise_for_status()
            res_data = response.json()

            output_list = res_data.get("output", [])
            if output_list and len(output_list) > 0:
                content_list = output_list[0].get("content", [])
                if content_list and len(content_list) > 0:
                    reply_text = content_list[0].get("text", "").strip()
                    if reply_text:
                        return reply_text
        except Exception as e:
            logger.error(f"[AzureService] Azure OpenAI REST call failed: {e}")

        return self._build_fallback_response(context)

    def _build_fallback_response(self, context: Dict[str, Any]) -> str:
        sensors = context.get("latest_sensors") or {}
        derived = context.get("derived_features") or {}
        if not sensors:
            return "Insufficient live data."
        c1 = sensors.get('cell1_voltage_v', 3.799)
        c2 = sensors.get('cell2_voltage_v', 3.606)
        c3 = sensors.get('cell3_voltage_v', 3.425)
        total_v = sensors.get('total_voltage_v', 10.83)
        temp = sensors.get('battery_temperature_c', 27.14)

        imb = derived.get('voltage_imbalance_v', round(max(c1, c2, c3) - min(c1, c2, c3), 3))
        t_rise = derived.get('temperature_rise_c', 0.0)

        return f"Battery telemetry overview: Cell 1 = {c1} V, Cell 2 = {c2} V, Cell 3 = {c3} V. Net Pack Voltage = {total_v} V, Temp = {temp} °C. Derived Imbalance = {imb} V, Temp Rise = {t_rise} °C."


# Singleton Instance
azure_service = AzureService()
