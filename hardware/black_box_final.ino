// =====================================================
// ARDUINO DUE R3
// 3 VOLTAGE + 2 TEMPERATURE + MQ-135
// =====================================================

// ---------------- PIN DEFINITIONS ----------------

#define VOLTAGE_SENSOR_1 A0
#define VOLTAGE_SENSOR_7 A7
#define VOLTAGE_SENSOR_3 A2

#define BATTERY_TEMP_PIN A3
#define AMBIENT_TEMP_PIN A4

#define MQ135_PIN A5


// ---------------- DUE ADC SETTINGS ----------------

const float VREF = 13.5;
const int ADC_MAX = 4096;


// =====================================================
// SETUP
// =====================================================

void setup()
{
  Serial.begin(9600);

  // Arduino Due ADC resolution
  analogReadResolution(12);

  delay(2000);

  Serial.println();
  Serial.println("========================================");
  Serial.println("       ARDUINO DUE BMS MONITOR");
  Serial.println("========================================");

  Serial.println("Voltage Sensor 1 -> A0");
  Serial.println("Voltage Sensor 2 -> A1");
  Serial.println("Voltage Sensor 3 -> A2");
  Serial.println("Battery LM35     -> A3");
  Serial.println("Ambient LM35     -> A4");
  Serial.println("MQ-135           -> A5");

  Serial.println();
  Serial.println("Starting measurements...");

  delay(1000);
}


// =====================================================
// LOOP
// =====================================================

void loop()
{

  // ===================================================
  // VOLTAGE SENSOR 1 - A0
  // ===================================================

  int rawVoltage1 =
    analogRead(VOLTAGE_SENSOR_1);

  float voltage1 =
    (rawVoltage1 * VREF) / ADC_MAX;


  // ===================================================
  // VOLTAGE SENSOR 2 - A1
  // ===================================================

  int rawVoltage2 =
    analogRead(VOLTAGE_SENSOR_7);

  float voltage2 =
    (rawVoltage2 * VREF) / ADC_MAX;


  // ===================================================
  // VOLTAGE SENSOR 3 - A2
  // ===================================================

  int rawVoltage3 =
    analogRead(VOLTAGE_SENSOR_3);

  float voltage3 =
    (rawVoltage3 * VREF) / ADC_MAX;


  // ===================================================
  // TOTAL VOLTAGE
  // ===================================================

  float totalVoltage =
    voltage1 + voltage2 + voltage3;


  // ===================================================
  // BATTERY TEMPERATURE - LM35 A3
  // ===================================================

  int rawBatteryTemp =
    analogRead(BATTERY_TEMP_PIN);

  float batteryTempVoltage =
    (rawBatteryTemp * VREF) / (ADC_MAX*3.5);

  // LM35 = 10 mV per °C
  float batteryTemperature =
    batteryTempVoltage * 100.0;


  // ===================================================
  // AMBIENT TEMPERATURE - LM35 A4
  // ===================================================

  int rawAmbientTemp =
    analogRead(AMBIENT_TEMP_PIN);

  float ambientTempVoltage =
    (rawAmbientTemp * VREF) / (ADC_MAX*8.15);

  // LM35 = 10 mV per °C
  float ambientTemperature =
    ambientTempVoltage * 100.0;


  // ===================================================
  // MQ-135 - A5
  // ===================================================

  int mqRaw =
    analogRead(MQ135_PIN)/21;

  float mqVoltage =
    (mqRaw * VREF) / ADC_MAX*100;


  // ===================================================
  // SERIAL OUTPUT
  // =====================================================

  Serial.println();
  Serial.println("========================================");
  Serial.println("          BATTERY SENSOR DATA");
  Serial.println("========================================");


  // ---------------- VOLTAGE ----------------

  Serial.println();
  Serial.println("VOLTAGE");

  Serial.print("Voltage Sensor 1 (A0): ");
  Serial.print(voltage1, 3);
  Serial.println(" V");

  Serial.print("Voltage Sensor 2 (A1): ");
  Serial.print(voltage2, 3);
  Serial.println(" V");

  Serial.print("Voltage Sensor 3 (A2): ");
  Serial.print(voltage3, 3);
  Serial.println(" V");

  Serial.print("TOTAL VOLTAGE: ");
  Serial.print(totalVoltage, 3);
  Serial.println(" V");


  // ---------------- TEMPERATURE ----------------

  Serial.println();
  Serial.println("TEMPERATURE");

  Serial.print("Battery Temperature (A3): ");
  Serial.print(batteryTemperature, 2);
  Serial.println(" C");

  Serial.print("Ambient Temperature (A4): ");
  Serial.print(ambientTemperature, 2);
  Serial.println(" C");


  // ---------------- GAS ----------------

  Serial.println();
  Serial.println("GAS SENSOR");

  Serial.print("MQ-135 Raw (A5): ");
  Serial.println(mqRaw);

  Serial.print("MQ-135 Voltage: ");
  Serial.print(mqVoltage, 3);
  Serial.println(" V");


  Serial.println();
  Serial.println("========================================");

  // =====================================================
  // CLOUD DATA OUTPUT
  // =====================================================

  Serial.print("DATA,");
  Serial.print(voltage1, 3);
  Serial.print(",");
  Serial.print(voltage2, 3);
  Serial.print(",");
  Serial.print(voltage3, 3);
  Serial.print(",");
  Serial.print(totalVoltage, 3);
  Serial.print(",");
  Serial.print(batteryTemperature, 2);
  Serial.print(",");
  Serial.print(ambientTemperature, 2);
  Serial.print(",");
  Serial.println(mqRaw);

  delay(1000);
}