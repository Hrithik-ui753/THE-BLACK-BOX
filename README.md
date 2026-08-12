# THE BLACK BOX

## AI-Powered Battery Health, Predictive Maintenance & Cell-Level Diagnostics

THE BLACK BOX is an intelligent battery monitoring, predictive maintenance, and cell-level diagnostic platform designed for 3S Li-ion battery packs.

The system combines real-time battery telemetry, engineering calculations, feature engineering, machine learning, deterministic safety rules, cloud storage, alert services, and AI-powered explanations.

The primary objective is not simply to display battery voltage.

The objective is to answer:

- Is the battery healthy?
- How much charge remains?
- How much health remains?
- How many useful cycles may remain?
- Is the battery behaving abnormally?
- Which cell is responsible for the abnormality?
- Should the battery be recharged?
- Should a particular cell be replaced?
- Should the complete battery pack be replaced?
- What caused the detected condition?
- What action should the user take?

---

# 1. Problem Statement

Lithium-ion batteries are widely used in electric mobility, portable electronics, backup power systems, energy storage systems, robotics, and industrial equipment.

However, battery degradation is not always uniform across individual cells.

A multi-cell battery pack may contain:

- Healthy cells
- Degraded cells
- Imbalanced cells
- Over-discharged cells
- Failed cells

A conventional pack-level monitoring system may only observe the total pack voltage.

This can hide an important problem.

Two packs can have the same total voltage while having completely different individual cell conditions.

For example:

Cell 1 = 3.60 V  
Cell 2 = 3.60 V  
Cell 3 = 3.60 V

Total = 10.80 V

Another pack may have:

Cell 1 = 4.00 V  
Cell 2 = 3.90 V  
Cell 3 = 2.90 V

Total = 10.80 V

The total voltage is identical.

However, the second pack has significant cell imbalance.

Therefore, pack-level voltage alone is not sufficient for detailed battery diagnostics.

---

# 2. Proposed Solution

THE BLACK BOX solves this problem by monitoring individual cells and combining their measurements with current, temperature, ambient temperature, and gas-sensor information.

The platform contains four major intelligence layers:

1. Sensor monitoring
2. Engineering feature calculation
3. Machine learning prediction
4. Deterministic safety and action logic

The resulting system converts raw measurements into actionable battery information.

---

# 3. Main Objectives

The system is designed to:

- Monitor a 3S Li-ion battery pack.
- Measure individual cell voltages.
- Calculate pack voltage.
- Monitor battery current.
- Monitor battery temperature.
- Monitor ambient temperature.
- Monitor gas-sensor measurements.
- Calculate battery-health features.
- Estimate SOC.
- Estimate SOH.
- Predict RUL.
- Detect anomalies.
- Identify weak or failed cells.
- Determine battery risk.
- Recommend recharge or replacement.
- Send critical alerts.
- Provide AI-generated explanations.
- Display the information through a web dashboard.

---

# 4. Battery Configuration

The prototype uses a 3S Li-ion battery configuration.

3S means that three cells are connected in series.

The individual cells are approximately 3.6–3.7 V under normal operating conditions.

The three cells together form the battery pack.

The approximate nominal configuration is therefore:

Cell 1 + Cell 2 + Cell 3

The exact measured voltage varies according to:

- State of charge
- Charging condition
- Discharging condition
- Load
- Temperature
- Cell condition
- Aging
- Measurement conditions

---

# 5. Battery Capacity

The cells used in the prototype are approximately 3000 mAh.

Therefore:

Rated cell capacity ≈ 3 Ah

For a series-connected 3S configuration, the voltage increases while the Ah capacity remains approximately that of one cell, assuming matched cells and ideal series operation.

The battery capacity used for health calculations is therefore based on the rated capacity of the pack configuration.

---

# 6. Raw Sensor Inputs

The system receives raw telemetry such as:

- Cell 1 voltage
- Cell 2 voltage
- Cell 3 voltage
- Current
- Battery temperature
- Ambient temperature
- Gas sensor raw value

The system can also receive pack voltage directly when available.

---

# 7. Cell Voltage Inputs

The three cell voltages are represented as:

V1 = Cell 1 voltage

V2 = Cell 2 voltage

V3 = Cell 3 voltage

The pack voltage is calculated as:

Pack Voltage = V1 + V2 + V3

This allows the system to compare individual cell behavior with total pack behavior.

---

# 8. Current Input

The battery current in the prototype is observed in the approximate range:

0.1–0.4 A

Current is important because battery behavior depends not only on voltage but also on the load being applied.

Current is used to derive:

- C-rate
- Power
- Load conditions
- High-current burst indicators
- Resistance-related features

---

# 9. Battery Temperature

The normal battery temperature operating range used in the project is approximately:

25–40 °C

Temperature is an important battery-health parameter.

Increasing temperature can affect:

- Battery efficiency
- Battery degradation
- Internal resistance
- Safety
- Available capacity
- Anomaly risk

The system therefore monitors both the average and maximum battery temperature.

---

# 10. Ambient Temperature

Ambient temperature is monitored separately from battery temperature.

The prototype environment is approximately:

20–35 °C

Ambient temperature is important because a battery temperature of 35 °C has a different meaning when the surrounding environment is 20 °C compared with when the environment is already 35 °C.

Therefore the system calculates temperature rise.

---

# 11. Gas Sensor

The system includes an MQ-135 gas sensor.

Example raw reading:

MQ-135 Raw = 155

Example voltage:

MQ-135 Voltage = 0.148 V

The gas sensor is treated as an abnormal-condition indicator rather than as a direct measurement of a specific battery gas concentration.

The system monitors changes in the gas signal and combines them with temperature and other battery measurements.

---

# 12. Telemetry Architecture

The general data flow is:

Battery

↓

Sensors

↓

Telemetry

↓

Cloud Database

↓

FastAPI Backend

↓

Feature Engineering

↓

Safety Rules + ML

↓

Predictions

↓

Frontend

The backend processes the incoming telemetry and generates battery intelligence.

---

# 13. Cloud Data Layer

The system uses cloud database services for telemetry and application data.

Supabase is used for backend data storage and retrieval.

Firebase is also integrated into the application where configured.

The cloud layer allows sensor data to be accessed by the backend and displayed by the frontend.

---

# 14. Backend

The backend is implemented using Python and FastAPI.

The backend is responsible for:

- Telemetry processing
- Database communication
- Feature calculation
- ML inference
- Prediction APIs
- Battery APIs
- Analytics APIs
- Alert processing
- Authentication
- AI services
- Timestamp handling

The backend acts as the central intelligence layer between the cloud data and frontend.

---

# 15. Feature Engineering

Raw sensor values are not directly sufficient for all predictions.

The system therefore derives additional features.

Feature engineering transforms raw telemetry into meaningful battery-health indicators.

The current feature set includes:

- battery_id
- cycle_id
- usage_profile
- voltage_avg_V
- avg_c_rate
- max_current_A
- avg_temperature_C
- max_temperature_C
- ambient_temperature_C
- gas_sensor_raw
- discharge_depth_pct
- high_current_burst
- charge_time_min
- discharge_time_min
- internal_resistance_proxy_ohm
- capacity_Ah
- temperature_rise_C
- power_avg_W
- gas_change_index

---

# 16. Average Voltage

Average cell voltage is calculated from the three measured cell voltages.

voltage_avg_V = (V1 + V2 + V3) / 3

This represents the average electrical state of the three cells.

It is useful for identifying overall pack behavior.

---

# 17. Minimum Cell Voltage

The minimum cell voltage is:

min_cell_voltage = min(V1, V2, V3)

This identifies the weakest cell at a particular measurement.

For example:

V1 = 3.60 V  
V2 = 3.55 V  
V3 = 2.90 V

Minimum cell voltage = 2.90 V

Cell 3 is therefore the weakest cell.

---

# 18. Maximum Cell Voltage

The maximum cell voltage is:

max_cell_voltage = max(V1, V2, V3)

This allows the system to compare the strongest and weakest cells.

---

# 19. Cell Voltage Imbalance

Cell imbalance is calculated as:

cell_voltage_imbalance = max_cell_voltage - min_cell_voltage

Example:

V1 = 3.60 V  
V2 = 3.55 V  
V3 = 2.90 V

Maximum = 3.60 V

Minimum = 2.90 V

Imbalance = 0.70 V

A larger imbalance indicates that the cells are behaving differently.

---

# 20. C-Rate

C-rate describes the charging or discharging current relative to battery capacity.

C-rate is calculated approximately as:

C-rate = Current / Capacity

For a 3 Ah battery:

Current = 0.3 A

C-rate = 0.3 / 3

C-rate = 0.1 C

Therefore a 0.3 A load corresponds to approximately 0.1C for a 3 Ah battery.

---

# 21. Maximum Current

The maximum current observed over a measurement period is stored as:

max_current_A

This captures high-current events that may not be visible from average current alone.

---

# 22. Temperature Rise

Temperature rise is calculated relative to ambient temperature.

temperature_rise_C = battery_temperature - ambient_temperature

Example:

Battery temperature = 35 °C

Ambient temperature = 30 °C

Temperature rise = 5 °C

This helps distinguish environmental temperature from battery-generated heating.

---

# 23. Average Temperature

Average battery temperature represents the typical thermal condition over the selected observation period.

It is used by the ML models and risk engine.

---

# 24. Maximum Temperature

Maximum temperature identifies the highest battery temperature observed during the measurement period.

This is important for detecting thermal stress.

---

# 25. Power

Average electrical power is approximately:

Power = Voltage × Current

For example:

Voltage = 11 V

Current = 0.3 A

Power = 3.3 W

Power provides information about the electrical load being experienced by the battery.

---

# 26. Discharge Depth

Discharge depth represents how deeply the battery has been discharged relative to its usable range.

A larger discharge depth means that more of the battery's available charge has been consumed.

Repeated deep discharge can contribute to battery degradation.

---

# 27. High Current Burst

A high-current burst identifies periods where current temporarily increases above the normal operating level.

This feature helps distinguish steady operation from transient electrical stress.

---

# 28. Charge Time

charge_time_min represents the duration of the charging period.

Charging duration can provide additional information about battery condition and charging behavior.

---

# 29. Discharge Time

discharge_time_min represents the duration of the discharge period.

This can be combined with current, capacity, voltage, and discharge depth to characterize battery usage.

---

# 30. Internal Resistance Proxy

Battery internal resistance can be approximated from voltage response to changes in current.

Conceptually:

Resistance ≈ ΔV / ΔI

The project stores this as:

internal_resistance_proxy_ohm

It is called a proxy because it is an estimated indicator rather than a laboratory-grade impedance measurement.

Increasing resistance can be associated with battery aging.

---

# 31. Capacity

capacity_Ah represents the estimated available battery capacity.

The rated cell capacity is approximately:

3 Ah

If the measured usable capacity decreases over time, the battery is degrading.

Capacity is therefore an important feature for SOH prediction.

---

# 32. Gas Change Index

The gas-change feature captures variation in the gas sensor signal.

The purpose is to detect unusual changes rather than treat one raw gas value as a complete safety diagnosis.

Gas behavior can be combined with:

- Battery temperature
- Ambient temperature
- Current
- Voltage
- Voltage imbalance

to improve abnormal-condition detection.

---

# 33. Feature Interaction

Battery behavior is not determined by a single parameter.

Important combinations include:

Current + Temperature

Voltage + Current

Cell Voltage + Cell Imbalance

Temperature + Ambient Temperature

Gas + Temperature

Cycle Number + Capacity

These relationships can be nonlinear.

For example, low voltage at low current may indicate a depleted battery, while low voltage combined with high current and high temperature can indicate a more severe operating condition.

---

# 34. Why Individual Cell Measurements Matter

Pack voltage alone can hide cell-level failures.

For example:

3.6 + 3.6 + 3.6 = 10.8 V

and:

4.0 + 3.9 + 2.9 = 10.8 V

Both have the same total voltage.

However, the second pack contains a much weaker cell.

Therefore the system preserves individual cell voltage measurements throughout the processing pipeline.

---

# 35. End-to-End Intelligence

The system converts:

Raw Sensor Data

↓

Derived Features

↓

ML Predictions

↓

Safety Rules

↓

Risk Classification

↓

Action Recommendation

↓

User Notification

This is the core architecture of THE BLACK BOX.# 101. Frontend

The frontend is built using React, TypeScript, and Vite.

Its purpose is to transform complex battery telemetry and ML outputs into a clear operational dashboard.

The frontend includes views for:

- Dashboard
- Battery details
- Analytics
- Reports
- Settings
- Authentication
- AI assistant
- Battery visualization
- Cell diagnostics
- Alerts

---

# 102. Dashboard

The dashboard provides a high-level overview of battery condition.

Typical information includes:

- Pack voltage
- Cell voltages
- Current
- Battery temperature
- Ambient temperature
- Gas sensor status
- SOC
- SOH
- RUL
- Risk status
- Recommended action

---

# 103. Battery Visualization

The frontend represents the three cells individually.

Example:

Cell 1

Cell 2

Cell 3

Each cell can be associated with a health state.

Possible visual states include:

- Healthy
- Warning
- Critical
- Failed

This makes cell-level diagnosis easier to understand.

---

# 104. Cell Detail Panel

The cell detail interface can display:

- Cell voltage
- Relative cell condition
- Voltage imbalance
- Cell status
- Fault indication
- Recommended action

If one cell is critically low, the interface identifies that specific cell.

---

# 105. Battery Health Gauge

The health interface can present:

SOC

SOH

RUL

These provide a compact view of current battery condition and predicted future usability.

---

# 106. Analytics

The analytics section provides deeper information such as:

- Voltage trends
- Temperature trends
- Cell imbalance
- SOH degradation
- Thermal risk
- Predictive failure
- Anomaly detection
- Battery reasoning

---

# 107. Cell Imbalance Analytics

Cell imbalance is displayed separately because total pack voltage alone can hide individual-cell problems.

The interface can compare:

Cell 1

Cell 2

Cell 3

and show the difference between the highest and lowest cell voltage.

---

# 108. Voltage Degradation

Voltage trends can be plotted over time.

The objective is to identify:

- Voltage decline
- Cell divergence
- Discharge behavior
- Abnormal voltage changes

---

# 109. Temperature Analytics

Temperature analytics can show:

- Battery temperature
- Ambient temperature
- Temperature rise
- Maximum temperature
- Thermal-risk classification

---

# 110. Gas Analytics

Gas sensor data can be monitored over time.

The system focuses particularly on changes in the signal.

A sudden change can be combined with temperature and electrical measurements for anomaly detection.

---

# 111. Predictive Failure Analysis

Predictive failure analysis combines:

- Current battery condition
- SOH
- RUL
- Cell imbalance
- Temperature
- Anomaly information

The objective is to identify developing failure conditions before they become severe.

---

# 112. Battery Reports

The frontend can provide battery reports containing:

- Current health
- Cell status
- Predictions
- Anomalies
- Risk
- Recommended actions

This can support maintenance decisions.

---

# 113. AI Battery Reasoning

The frontend contains AI reasoning interfaces.

The AI can convert technical measurements into understandable explanations.

For example:

Instead of displaying only:

Cell 3 = 0.2 V

the system can explain:

Cell 3 is significantly below the expected operating range and has been identified as the affected cell. The recommended action is to isolate and inspect or replace Cell 3 according to the configured safety procedure.

---

# 114. AI Chatbot

The frontend includes an AI chatbot.

The chatbot communicates with the backend AI service.

The backend can use Azure OpenAI to generate explanations based on the battery context.

The chatbot is intended to help users understand:

- Battery status
- Health predictions
- Anomalies
- Risk
- Recommended action

---

# 115. Backend API

FastAPI provides the application programming interface between the frontend and backend services.

The backend includes routes for:

- Authentication
- Battery data
- Telemetry
- Analytics
- Predictions
- Alerts
- AI services
- Supabase access

---

# 116. Authentication

The application contains authentication services.

Authentication functionality is separated into:

- Controller
- Middleware
- Routes
- Firebase configuration

This allows protected application functionality to be separated from public interfaces.

---

# 117. Telemetry Routes

Telemetry routes provide access to battery sensor data.

The telemetry pipeline handles incoming battery information and passes it to the processing layer.

---

# 118. Battery Routes

Battery routes provide battery-specific information to the frontend.

These routes can expose:

- Battery identification
- Battery status
- Cell information
- Pack information
- Battery metrics

---

# 119. Prediction Routes

Prediction routes expose ML outputs.

Examples include:

- SOC
- SOH
- RUL
- anomaly information
- risk status

---

# 120. Analytics Routes

Analytics routes expose derived battery information used by frontend graphs and analytical components.

---

# 121. Alert Routes

Alert routes expose alert history and critical battery events.

This allows the frontend to display notifications and historical incidents.

---

# 122. Feature Service

The feature service is responsible for converting raw telemetry into the feature representation required by the ML models.

This is critical because training and inference must use consistent feature definitions.

---

# 123. ML Service

The ML service is responsible for:

- Loading trained models
- Preparing prediction features
- Performing inference
- Handling prediction failures
- Returning model outputs

---

# 124. Prediction Service

The prediction service coordinates prediction logic and can combine:

- ML outputs
- Battery measurements
- Safety rules
- Risk calculations

---

# 125. Alert Service

The alert service evaluates critical battery conditions and generates alert events.

It includes special handling for:

- Dead cells
- Dead battery packs
- Critical voltage
- Critical temperatures
- Other configured anomalies

---

# 126. Email Alerts

Email alerts can be sent through SMTP/Gmail configuration.

The system stores alert events so notification failures do not stop the primary battery pipeline.

---

# 127. SMS Alerts

Twilio can be used for SMS alerts.

A critical battery condition can trigger an SMS notification to the configured recipient.

---

# 128. WhatsApp Alerts

Twilio WhatsApp integration can also be configured for critical notifications.

---

# 129. Alert Severity

Alerts can be categorized by severity.

Example levels:

- INFO
- LOW
- WARNING
- HIGH
- CRITICAL

A critically failed cell is handled as a critical event.

---

# 130. Critical Cell Alert

When an individual cell reaches the configured dead-cell threshold:

The system:

1. Identifies the cell.
2. Sets critical severity.
3. Generates an alert.
4. Records the event.
5. Produces a replacement recommendation.
6. Sends configured notifications.

---

# 131. Dead Pack Alert

When the configured dead-pack condition is reached:

The system:

1. Identifies the pack condition.
2. Sets critical severity.
3. Generates the dead-pack protocol.
4. Records the event.
5. Sends configured notifications.

---

# 132. Alert Tracker

Alert history can be stored in Supabase.

The alert tracker allows the system to retain information about previous critical events.

This supports:

- Audit history
- Debugging
- Maintenance history
- Notification tracking

---

# 133. External Service Resilience

External services may fail.

For example:

- SMTP credentials may be invalid.
- Twilio may be unavailable.
- AI API may be temporarily unavailable.

The battery monitoring pipeline should continue operating even when an external service fails.

---

# 134. Error Handling

The backend includes error handling to prevent a single service failure from stopping the complete application.

Examples include:

- Invalid sensor values
- Null values
- String-formatted numeric values
- Missing fields
- External service failures
- ML inference errors

---

# 135. Safe Numeric Parsing

Sensor values may arrive as:

"0"

"0.0"

12.3

or null.

The backend therefore uses safe numeric conversion before performing calculations.

This prevents runtime type errors.

---

# 136. Division-by-Zero Protection

Derived calculations such as:

C-rate

Resistance proxy

and other ratios must avoid division by zero.

The backend therefore validates denominators before calculation.

---

# 137. Database

Supabase provides the primary cloud database layer used by the backend.

The database stores relevant telemetry and application information.

Possible categories include:

- Battery telemetry
- Predictions
- Alerts
- Historical records
- Battery information

---

# 138. Data Flow Through Supabase

The typical flow is:

Sensor data

↓

Supabase

↓

Backend reads latest telemetry

↓

Feature service

↓

ML + safety engine

↓

Prediction

↓

Prediction/alert records

↓

Frontend

---

# 139. Firebase

Firebase services are integrated into the project where configured.

Firebase can support:

- Authentication
- Realtime data
- Application services

The backend includes Firebase service configuration.

---

# 140. Environment Variables

Sensitive configuration is stored in environment variables.

Examples include:

SUPABASE_URL

SUPABASE_KEY

FIREBASE_PROJECT_ID

FIREBASE_DATABASE_URL

FIREBASE_PRIVATE_KEY

FIREBASE_CLIENT_EMAIL

TWILIO_ACCOUNT_SID

TWILIO_AUTH_TOKEN

TWILIO_SMS_FROM

TWILIO_SMS_TO

GMAIL_USER

GMAIL_APP_PASSWORD

ALERT_RECIPIENT_EMAIL

AZURE_OPENAI_API_KEY

AZURE_OPENAI_ENDPOINT

AZURE_OPENAI_DEPLOYMENT

---

# 141. Security Principle

Real secrets must never be committed to a public GitHub repository.

The project therefore uses:

.env

for local secrets

and:

.env.example

for safe configuration documentation.

---

# 142. .env.example

The repository contains an example environment file containing placeholder values.

It allows developers to understand which configuration values are required without exposing real credentials.

---

# 143. Git Security

The `.gitignore` file protects:

- .env
- service account keys
- ML model binaries
- datasets
- logs
- virtual environments
- node_modules
- generated build files

The actual secret files remain outside version control.

---

# 144. GitHub

The project is maintained in the GitHub repository:

THE-BLACK-BOX

The repository contains the application source code and development pipeline.

Sensitive local configuration is excluded.

---

# 145. Repository Structure

```text
THE BLACK BOX/
|
|-- ML/
|   |-- firebase/
|   |-- prediction/
|   `-- training/
|
|-- THEBLACKBOX_ALERT/
|
|-- ai_test/
|
|-- backend/
|   |-- authentication/
|   |-- routes/
|   `-- services/
|
|-- frontend/
|   |-- public/
|   `-- src/
|
|-- .env.example
|-- .gitignore
`-- README.md
