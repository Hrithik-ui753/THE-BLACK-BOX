import logging
import requests
from typing import Dict, Any, List, Optional

from config import AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT, DEFAULT_BATTERY_ID
from supabase_service import supabase_db

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are THE BLACK BOX Battery AI Assistant — an expert battery electro-chemistry and machine learning diagnostics assistant.

Your job is to analyze battery telemetry, machine learning predictions, and engineered dataset features to explain the battery's condition with MAXIMUM CLARITY.

CRITICAL INSTRUCTIONS FOR DIAGNOSTIC REASONING:
Do NOT restrict your explanations to raw voltage and current alone! The ML pipeline engineers key derived features from the dataset. You MUST actively evaluate and explicitly reference these derived features and explain HOW they physically cause or contribute to the battery's health and ML outputs (SOC, SOH, RUL, and Anomaly Score):

1. **Pack Cell Voltage Imbalance (ΔV = Max V - Min V)**:
   - Explain how cell imbalance indicates series cell degradation drift or capacity mismatch.
   - Clarify that high imbalance forces the weakest cell to hit cut-off voltage early, limiting usable battery capacity and accelerating stress on that specific cell.

2. **Temperature Rise above Ambient (ΔT = T_battery - T_ambient)**:
   - Explain how ΔT measures internal resistive heating under load.
   - Clarify that higher ΔT accelerates chemical degradation, solid electrolyte interphase (SEI) growth, and capacity fade.

3. **Operating C-Rate (Load Current / Rated Capacity)**:
   - Explain how higher C-rates increase mechanical stress and lithium plating risks within the cell structure, reducing SOH and cycle life (RUL).

4. **Internal Resistance Proxy (IR in Ω)**:
   - Explain how elevated internal resistance causes higher voltage drop (sag) under load, lowers energy efficiency, and generates extra thermal dissipation.

5. **Gas Change Index / Gas Sensor Dynamics**:
   - Explain how sudden changes in gas sensor readings signal electrolyte decomposition, outgassing, or micro-venting before major thermal runaway occurs.

7. **Differentiating Removed / Disconnected Cell vs Dead Cell (Floating ~0.07 V Analysis)**:
   - Explain why both a removed cell and a dead cell can read ~0.01 V - 0.15 V (commonly ~0.07 V):
     - **Cell Removed (Open Circuit / Floating Pin)**: When a cell is physically removed from the holder, the sensor's analog ADC pin floats in high-impedance, capturing residual electromagnetic noise (~0.07 V).
     - **Dead Cell (Electrochemical Collapse)**: A physically connected but deeply depleted cell collapses to ~0.07 V.
   - Explain HOW to differentiate them using dataset derived features:
     - **Temperature Rise (ΔT)**: A removed cell has **ΔT = 0 °C** (open circuit allows 0 current, so 0 ohmic heating). A dead cell has **ΔT > 0 °C** due to internal resistive dissipation under load or self-discharge.
     - **Pack Imbalance & Load**: A removed cell breaks series continuity (zero pack current/power). A dead cell allows current draw while creating a massive voltage imbalance (ΔV ≥ 0.35 V).
     - **Gas Change Index**: A dead cell shows outgassing signals (gas index > 0), whereas a removed cell stays at ambient baseline.

RESPONSE STRUCTURE FOR USER CLARITY:
When answering diagnostic or health questions, structure your reply using clear markdown formatting:
- **Status Summary**: High-level overview of battery condition.
- **Root-Cause Analysis (Derived Features & Physics)**: Explicitly connect derived features (ΔV, ΔT, C-rate, IR proxy, Gas Index) to the ML model's SOC, SOH, RUL, or anomaly output.
- **Hardware & Sensor Diagnostic (e.g. 0.07 V Analysis)**: Differentiate open circuit floating voltage from actual dead cell degradation.
- **Health & Safety Assessment**: Clear risk evaluation.
- **Actionable Recommendations**: Precise steps for maintenance, balancing, terminal inspection, or cell replacement.

Rules:
1. Use the provided battery data and derived features as the primary source of truth.
2. Never invent sensor readings, SOC, SOH, RUL, temperatures, or voltages.
3. Distinguish clearly between raw measured sensors, calculated derived features, and ML predictions.
4. Keep language clear, engaging, educational, and easy to understand for all users.
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
