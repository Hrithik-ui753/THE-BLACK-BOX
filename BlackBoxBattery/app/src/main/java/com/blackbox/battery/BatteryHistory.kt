package com.blackbox.battery

data class BatteryHistory(
    val ambientTemperature: Double = 0.0,
    val cell1Voltage: Double = 0.0,
    val cell2Voltage: Double = 0.0,
    val cell3Voltage: Double = 0.0,
    val gas: Double = 0.0,
    val temperature: Double = 0.0,
    val timestamp: String = "",
    val totalVoltage: Double = 0.0
)