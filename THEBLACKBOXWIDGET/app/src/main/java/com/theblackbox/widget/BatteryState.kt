package com.theblackbox.widget

data class BatteryState(
    val cell1Voltage: Double = 0.0,
    val cell2Voltage: Double = 0.0,
    val cell3Voltage: Double = 0.0,
    val totalVoltage: Double = 0.0,
    val temperature: Double = 0.0,
    val ambientTemperature: Double = 0.0,
    val gas: Double = 0.0,
    val timestamp: String = "",
    val soh: Double? = null,
    val dataPath: String = "",
    val currentCycle: Double? = null,
    val predictedRulCycles: Double? = null,
    val predictedEOLCycle: Double? = null,
    val averageCyclesPerDay: Double? = null,
    val estimatedRemainingDays: Double? = null
)
