# THE_BLACK_BOX

## AI-Powered Battery Health, Predictive Maintenance & Cell-Level Diagnostics

<p align="center">
  <strong>3S Li-ion Battery Monitoring • Cell-Level Diagnostics • XGBoost Prediction • Predictive Maintenance • Cloud Analytics</strong>
</p>

<p align="center">
  <img src="https://drive.google.com/file/d/14pIGJqccQjgoghru6fAb0-iJUt63i9vv/view?usp=drive_link" alt="THE_BLACK_BOX hardware prototype" width="900">
</p>

> **THE_BLACK_BOX is not just a battery monitor. It is a battery intelligence system that converts raw cell-level telemetry into health predictions, anomaly detection, risk classification, and actionable maintenance decisions.**

---

## 🚀 Why THE_BLACK_BOX?

Traditional battery monitoring often focuses on **pack-level voltage**. That can hide a weak or failing cell.

For example:

```text
Pack A:  3.60 V + 3.60 V + 3.60 V = 10.80 V
Pack B:  4.00 V + 3.90 V + 2.90 V = 10.80 V
```

Both packs have the same total voltage.

But Pack B contains a severely weaker cell.

**THE_BLACK_BOX looks inside the pack.**

It continuously combines:

- 🔋 Individual cell voltage
- ⚡ Current
- 🌡️ Battery temperature
- 🌡️ Ambient temperature
- 🧪 Gas-sensor signal
- 🔄 Cycle information
- 📊 Derived battery-health features
- 🤖 XGBoost-based prediction
- 🚨 Deterministic safety rules
- ☁️ Cloud telemetry and storage
- 🧠 AI-assisted explanations
- 📈 Web-based analytics

The result is a system designed to answer:

> **Is the battery healthy, what is going wrong, which cell is responsible, and what should the user do next?**

---

# 🧠 Core Intelligence

THE_BLACK_BOX is structured as an end-to-end intelligence pipeline:

```text
┌──────────────────────┐
│   3S Li-ion Battery  │
│      Cell 1/2/3      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│       Sensors        │
│ Voltage • Current    │
│ Temperature • Gas    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Arduino Due /      │
│   Telemetry Layer    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Firebase / Supabase  │
│   Cloud Data Layer   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   FastAPI Backend    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Feature Engineering  │
│ Raw → Battery Health │
│       Features       │
└──────────┬───────────┘
           │
           ├──────────────────┐
           ▼                  ▼
┌──────────────────┐  ┌────────────────────┐
│ XGBoost ML Layer │  │ Deterministic       │
│ SOC / SOH / RUL  │  │ Safety & Rule Engine│
│ / Anomaly Logic  │  │ Risk / Actions      │
└────────┬─────────┘  └──────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
          ┌──────────────────────┐
          │ Battery Intelligence│
          │ Health • Risk • Cell │
          │ Diagnosis • Action   │
          └──────────┬───────────┘
                     │
          ┌──────────┴───────────┐
          ▼                      ▼
┌────────────────────┐  ┌───────────────────┐
│ React Web Dashboard│  │ Alerts / AI       │
│ Analytics / Reports│  │ Explanations      │
└────────────────────┘  └───────────────────┘
```

---

# 🔋 Hardware Prototype

The current prototype is a **3S battery monitoring and analytics system**.

### Hardware architecture

- 3 × 18650 cells connected in series
- 12 V battery pack
- Arduino Due
- Cell-voltage sensing modules
- Temperature sensors
- MQ-135 gas sensor
- Breadboard/interconnection layer
- Wiring harness
- 12 V DC power input

### Prototype connection concept

```text
B1 ── B2 ── B3
│      │      │
▼      ▼      ▼
V1     V2     V3
│      │      │
└──────┴──────┴──────► Arduino Due
                         │
                         ├── Temperature
                         ├── Gas Sensor
                         └── Telemetry
                                │
                                ▼
                         Firebase / Cloud
```

> The hardware image above documents the actual prototype architecture and wiring concept used by the project.

---

# 📡 What We Measure

| Signal | Purpose |
|---|---|
| Cell 1 Voltage | Cell-level condition |
| Cell 2 Voltage | Cell-level condition |
| Cell 3 Voltage | Cell-level condition |
| Pack Voltage | Overall electrical state |
| Current | Load / charging behavior |
| Battery Temperature | Thermal condition |
| Ambient Temperature | Environmental reference |
| MQ-135 Signal | Abnormal-condition indicator |
| Cycle ID | Aging / usage context |

---

# 🧮 Feature Engineering

Raw sensor readings are transformed into engineering features before prediction.

### Core features

```text
battery_id
cycle_id
usage_profile
voltage_avg_V
avg_c_rate
max_current_A
avg_temperature_C
max_temperature_C
ambient_temperature_C
gas_sensor_raw
discharge_depth_pct
high_current_burst
charge_time_min
discharge_time_min
internal_resistance_proxy_ohm
capacity_Ah
temperature_rise_C
power_avg_W
gas_change_index
```

### Important derived metrics

**Pack voltage**

```text
Pack Voltage = V1 + V2 + V3
```

**Average cell voltage**

```text
Vavg = (V1 + V2 + V3) / 3
```

**Cell imbalance**

```text
Cell Imbalance = max(V1, V2, V3) - min(V1, V2, V3)
```

**C-rate**

```text
C-rate ≈ Current / Capacity
```

**Temperature rise**

```text
Temperature Rise = Battery Temperature - Ambient Temperature
```

**Electrical power**

```text
Power ≈ Voltage × Current
```

**Internal-resistance proxy**

```text
Rproxy ≈ ΔV / ΔI
```

These features allow the system to reason about battery behavior rather than simply display raw measurements.

---

# 🤖 Machine Learning

THE_BLACK_BOX uses **XGBoost** for the machine-learning prediction layer.

The ML pipeline is designed around engineered battery features rather than a single sensor value.

### Prediction objectives

- **SOC** — State of Charge
- **SOH** — State of Health
- **RUL** — Remaining Useful Life
- **Anomaly / abnormal-condition assessment**

### Why feature engineering matters

Battery degradation is multi-dimensional.

A battery can show abnormal behavior because of a combination of:

```text
Voltage
   +
Current
   +
Temperature
   +
Cell Imbalance
   +
Cycle History
   +
Capacity
   +
Resistance Proxy
```

XGBoost can model nonlinear relationships between these engineered features and the target battery-health outputs.

---

# 🛡️ ML + Deterministic Safety

A key design principle of THE_BLACK_BOX is:

> **Machine learning predicts. Deterministic rules protect.**

ML is used for predictive intelligence such as:

- SOC
- SOH
- RUL
- anomaly-related intelligence

Deterministic rules are used for safety-critical decisions such as:

- critical cell voltage
- dead-cell conditions
- dead-pack conditions
- critical temperature
- alert severity
- replacement recommendations

This separation makes the architecture easier to explain, audit, and demonstrate.

---

# 🚨 Cell-Level Diagnostics

THE_BLACK_BOX does not stop at:

> "Battery unhealthy."

It attempts to answer:

> **"Which cell is responsible?"**

Example:

```text
Cell 1 → 3.61 V → Healthy
Cell 2 → 3.57 V → Healthy
Cell 3 → 2.91 V → Critical
```

The system can then associate the abnormal condition with the affected cell and generate an appropriate maintenance recommendation according to the configured safety rules.

---

# 📊 Battery Intelligence Layer

The final output is a structured battery-health decision:

```text
RAW TELEMETRY
      ↓
FEATURE ENGINEERING
      ↓
XGBOOST PREDICTION
      ↓
SAFETY / RULE ENGINE
      ↓
RISK CLASSIFICATION
      ↓
CELL DIAGNOSIS
      ↓
RECOMMENDED ACTION
```

Possible action categories include:

- Continue monitoring
- Recharge battery
- Inspect battery
- Inspect specific cell
- Replace affected cell
- Replace complete pack
- Escalate as critical

---

# ☁️ Cloud & Data Architecture

THE_BLACK_BOX uses cloud services as part of the telemetry and application architecture.

### Firebase

Configured Firebase services can support:

- Authentication
- Realtime/application data
- Telemetry integration

### Supabase

Supabase is used as the primary backend database layer for configured application data such as:

- Telemetry
- Predictions
- Alerts
- Historical records
- Battery information

---

# 🔄 Complete Data Flow

```text
                 ┌─────────────────┐
                 │  3S BATTERY PACK│
                 └────────┬────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ SENSORS               │
              │ V1 V2 V3              │
              │ Current               │
              │ Temperature           │
              │ Ambient Temperature   │
              │ MQ-135                │
              └───────────┬───────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │  ARDUINO DUE   │
                 │   Acquisition  │
                 └───────┬────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ CLOUD TELEMETRY  │
                │ Firebase /       │
                │ Supabase         │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │  FASTAPI BACKEND │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ FEATURE SERVICE  │
                └────────┬─────────┘
                         │
                ┌────────┴─────────┐
                ▼                  ▼
        ┌───────────────┐  ┌─────────────────┐
        │ XGBOOST MODEL │  │ SAFETY ENGINE   │
        │ SOC/SOH/RUL   │  │ Thresholds      │
        │ ML inference  │  │ Critical rules  │
        └───────┬───────┘  └────────┬────────┘
                │                   │
                └─────────┬─────────┘
                          ▼
                ┌──────────────────┐
                │ BATTERY DECISION │
                │ HEALTH / RISK    │
                │ CELL / ACTION    │
                └────────┬─────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          Dashboard    Alerts     AI Explain
              │          │          │
              └──────────┴──────────┘
                         │
                         ▼
                    END USER
```

---

# 🖥️ Frontend

The web application is built using:

- React
- TypeScript
- Vite

### Main interfaces

- Dashboard
- Battery details
- Cell diagnostics
- Analytics
- Reports
- Alerts
- Settings
- Authentication
- AI assistant
- Battery visualization

---

# 📈 Dashboard

The dashboard brings the most important battery information together:

```text
┌──────────────────────────────────────────────┐
│              BATTERY HEALTH                  │
├──────────────────────────────────────────────┤
│ Pack Voltage     Cell Status      Risk       │
│ Current          Temperature      SOC        │
│ SOH              RUL              Alerts     │
├──────────────────────────────────────────────┤
│              CELL DIAGNOSTICS                │
│   Cell 1       Cell 2       Cell 3           │
│   Healthy      Healthy      Warning/Critical │
├──────────────────────────────────────────────┤
│              RECOMMENDED ACTION              │
└──────────────────────────────────────────────┘
```

---

# 🧪 Analytics

The analytics layer can expose:

- Cell voltage trends
- Pack voltage
- Current behavior
- Temperature trends
- Ambient temperature
- Temperature rise
- Cell imbalance
- SOH degradation
- RUL prediction
- Anomaly information
- Battery reasoning

---

# 🧠 AI Explanation Layer

The AI interface is designed to translate technical battery outputs into understandable explanations.

Instead of only showing:

```text
Cell 3 = 2.91 V
```

the system can provide contextual reasoning such as:

```text
Cell 3 has been identified as the affected cell because
its voltage is significantly lower than the other cells.
The configured safety logic recommends inspection or
replacement according to the detected severity.
```

The AI layer is therefore an **explanation interface**, while deterministic safety rules remain responsible for safety-critical decisions.

---

# 🔔 Alerts

The alert layer can classify events using severity levels such as:

```text
INFO
LOW
WARNING
HIGH
CRITICAL
```

Critical events can be recorded and surfaced through the configured notification pipeline.

### Example critical workflow

```text
Abnormal telemetry
       ↓
Rule evaluation
       ↓
Critical condition?
       ↓ YES
Identify affected cell / pack
       ↓
Create alert
       ↓
Persist event
       ↓
Notify configured recipient
       ↓
Show on dashboard
```

---

# 📜 Reports

THE_BLACK_BOX can generate battery-health reports containing:

- Current battery condition
- Cell-level status
- SOC
- SOH
- RUL
- Anomalies
- Risk classification
- Recommended action
- Battery reasoning

This transforms raw telemetry into a maintenance-oriented document.

---

# 🛠️ Backend Architecture

The backend is implemented with **Python + FastAPI**.

Conceptually:

```text
backend/
├── authentication/
├── routes/
│   ├── battery
│   ├── telemetry
│   ├── analytics
│   ├── predictions
│   ├── alerts
│   └── AI
└── services/
    ├── feature engineering
    ├── ML inference
    ├── prediction
    ├── alerts
    └── database integration
```

The exact route names and module organization should be treated as implementation-specific and may evolve with the codebase.

---

# 🧰 Technology Stack

| Layer | Technology |
|---|---|
| Hardware | Arduino Due |
| Battery | 3S Li-ion |
| Cell sensing | Voltage sensor modules |
| Temperature | Temperature sensors |
| Gas sensing | MQ-135 |
| Backend | Python |
| API | FastAPI |
| ML | XGBoost |
| Frontend | React |
| Language | TypeScript |
| Build Tool | Vite |
| Cloud Data | Supabase / Firebase where configured |
| Authentication | Firebase where configured |
| AI Explanation | Azure OpenAI where configured |
| Alerts | SMTP/Gmail where configured |
| Repository | GitHub |

---

# 🔐 Security

Secrets must never be committed to source control.

Use environment variables for sensitive configuration:

```text
SUPABASE_URL
SUPABASE_KEY
FIREBASE_PROJECT_ID
FIREBASE_DATABASE_URL
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
GMAIL_USER
GMAIL_APP_PASSWORD
ALERT_RECIPIENT_EMAIL
AZURE_OPENAI_API_KEY
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_DEPLOYMENT
```

Use:

```text
.env
```

for real local/deployment secrets and:

```text
.env.example
```

for safe documentation.

---

# 🧪 Robustness & Error Handling

The backend is designed to handle real telemetry conditions such as:

- Missing values
- Null sensor values
- Numeric strings
- Invalid numeric input
- Division by zero
- ML inference errors
- Database failures
- External AI-service failures
- Notification failures

External services should not unnecessarily stop the core battery-monitoring pipeline.

---

# 📁 Repository Structure

```text
THE-BLACK-BOX/
│
├── ML/
│   ├── firebase/
│   ├── prediction/
│   └── training/
│
├── THEBLACKBOX_ALERT/
│
├── ai_test/
│
├── backend/
│   ├── authentication/
│   ├── routes/
│   └── services/
│
├── frontend/
│   ├── public/
│   └── src/
│
├── assets/
│   └── hardware-prototype.png
│
├── .env.example
├── .gitignore
└── README.md
```

---

# ▶️ Getting Started

## 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd THE-BLACK-BOX
```

## 2. Backend environment

Create the environment file:

```bash
cp .env.example .env
```

Fill in the required service configuration.

## 3. Install backend dependencies

Use the project's existing Python dependency configuration.

Example:

```bash
pip install -r requirements.txt
```

## 4. Start the FastAPI backend

Use the project's configured FastAPI entry point.

A typical development command is:

```bash
uvicorn <backend_entrypoint>:app --reload
```

> Replace `<backend_entrypoint>` with the actual entry module in the repository.

## 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 📡 Live Firebase Telemetry

For demonstrations and debugging, the latest Firebase telemetry can also be surfaced in a terminal-style view.

Example:

```text
Firebase Live Data
------------------
Voltage:      11.82 V
Current:       1.43 A
Temperature:  29.4 °C
SOC:          78.6 %
SOH:          94.2 %
Cycle:        247
Timestamp:    2026-08-13 18:48:21
```

This provides a simple way to verify that the cloud telemetry pipeline is receiving the latest battery data.

---

# 🏆 What Makes THE_BLACK_BOX Different?

### 1. Cell-level visibility

The system does not rely only on total pack voltage.

### 2. Predictive instead of purely reactive

The system combines historical and current battery features with XGBoost prediction.

### 3. Engineering + AI

The architecture combines:

```text
Electrical Engineering
        +
Feature Engineering
        +
Machine Learning
        +
Deterministic Safety
        +
Cloud Computing
        +
AI Explanation
```

### 4. Action-oriented output

The goal is not just:

> "Battery = 72%"

The goal is:

> **"Battery health is deteriorating, Cell 3 is the likely affected cell, the risk is high, and the configured maintenance action is inspection/replacement."**

### 5. Explainable decision flow

The system preserves the chain:

```text
Sensor
  ↓
Feature
  ↓
Prediction
  ↓
Rule
  ↓
Risk
  ↓
Cell
  ↓
Action
```

That makes the platform easier to demonstrate and audit.

---

# 📌 Key Project Value

THE_BLACK_BOX transforms a battery from a **passive energy source** into a **measurable, diagnosable and predictive asset**.

Instead of waiting for:

```text
Battery Failure
      ↓
Unexpected Shutdown
      ↓
Manual Inspection
```

the intended workflow is:

```text
Continuous Monitoring
        ↓
Early Detection
        ↓
Prediction
        ↓
Cell-Level Diagnosis
        ↓
Risk Assessment
        ↓
Preventive Action
```

---

# 🔮 Future Scalability

The current prototype is a 3S battery system, but the architecture can be extended toward:

- Larger battery packs
- More cells
- Battery modules
- EV battery monitoring
- Energy-storage systems
- Robotics
- Industrial backup systems
- Fleet-level battery analytics
- Remote predictive maintenance
- Battery service history
- Multi-battery dashboards
- Edge inference
- Advanced digital-twin capabilities

The key scalability principle is to preserve the same pipeline:

```text
More Sensors
     ↓
More Telemetry
     ↓
More Features
     ↓
Same Intelligence Architecture
     ↓
More Batteries / Modules
```

---

# ⚠️ Safety Note

THE_BLACK_BOX is a prototype and engineering/research platform.

Battery thresholds, charging limits, fault rules, and replacement decisions must be validated against the specific battery chemistry, cell manufacturer specifications, protection circuitry, and applicable safety standards before deployment in a production or safety-critical system.

The MQ-135 signal is an abnormal-condition indicator and should not be interpreted as a laboratory-grade measurement of a specific battery gas concentration.

---

# 👥 Project

**THE_BLACK_BOX**

### AI-Powered Battery Health, Predictive Maintenance & Cell-Level Diagnostics

Built around the principle:

> **Don't just monitor the battery. Understand the battery.**

---

## 🔖 Keywords / Tags

`battery-monitoring` `battery-management` `BMS` `battery-health` `battery-diagnostics` `predictive-maintenance` `lithium-ion` `li-ion` `3S-battery` `cell-level-diagnostics` `SOC` `SOH` `RUL` `XGBoost` `machine-learning` `anomaly-detection` `Arduino-Due` `IoT` `Firebase` `Supabase` `FastAPI` `React` `TypeScript` `Vite` `AI` `Azure-OpenAI` `battery-analytics` `smart-battery` `embedded-systems` `cloud-monitoring`

---

## ⭐ Project Pitch

**THE_BLACK_BOX is an AI-powered battery intelligence platform that combines real-time cell-level sensing, engineered battery-health features, XGBoost prediction, deterministic safety rules, cloud telemetry, alerts, analytics, and AI explanations to move battery monitoring from simple measurement to pred
