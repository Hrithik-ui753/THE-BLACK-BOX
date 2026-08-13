package com.theblackbox.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.Preferences
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.layout.Box
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import androidx.glance.currentState
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

class BmsWidget : GlanceAppWidget() {

    override val stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            BmsWidgetContent()
        }
    }
}

/*
 * Constants
 */
private const val LOW_VOLTAGE_THRESHOLD = 3.0
private const val CRITICAL_VOLTAGE_THRESHOLD = 2.5
private const val SENSOR_FAULT_THRESHOLD = 0.5
private const val CRITICAL_TEMPERATURE_THRESHOLD = 45.0
private const val LIVE_DATA_THRESHOLD_MINUTES = 5L

/**
 * Custom ColorProvider implementation
 */
private class BmsColorProvider(private val color: Color) : ColorProvider {
    override fun getColor(context: Context): Color = color
}

private val BMS_BACKGROUND = BmsColorProvider(Color.Black)
private val BMS_CARD = BmsColorProvider(Color(0xFF151515))
private val BMS_WHITE = BmsColorProvider(Color.White)
private val BMS_SECONDARY = BmsColorProvider(Color(0xFFD0D0D0))
private val BMS_BLUE = BmsColorProvider(Color(0xFF42A5F5))
private val BMS_RED = BmsColorProvider(Color(0xFFFF5252))
private val BMS_GREEN = BmsColorProvider(Color(0xFF66BB6A))
private val BMS_YELLOW = BmsColorProvider(Color(0xFFFFD54F))

@Composable
fun BmsWidgetContent() {
    val prefs = currentState<Preferences>()

    val cell1 = prefs[BatterySyncWorker.KEY_CELL1] ?: 0.0
    val cell2 = prefs[BatterySyncWorker.KEY_CELL2] ?: 0.0
    val cell3 = prefs[BatterySyncWorker.KEY_CELL3] ?: 0.0
    val totalVoltage = prefs[BatterySyncWorker.KEY_TOTAL] ?: 0.0
    val temperature = prefs[BatterySyncWorker.KEY_TEMP] ?: 0.0
    val soh = prefs[BatterySyncWorker.KEY_SOH]
    val currentCycle = prefs[BatterySyncWorker.KEY_CURRENT_CYCLE]
    val predictedRul = prefs[BatterySyncWorker.KEY_PREDICTED_RUL]
    val avgCyclesPerDay = prefs[BatterySyncWorker.KEY_AVG_CYCLES_PER_DAY]
    val estimatedDays = prefs[BatterySyncWorker.KEY_ESTIMATED_DAYS]

    val timestamp = prefs[BatterySyncWorker.KEY_TIMESTAMP] ?: ""
    val isDataAvailable = timestamp.isNotEmpty()

    val isLive = if (isDataAvailable) {
        checkIsLive(timestamp)
    } else {
        false
    }

    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(BMS_BACKGROUND),
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .padding(10.dp),
            verticalAlignment = Alignment.Vertical.Top,
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally
        ) {
            // Header Row
            Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.Vertical.CenterVertically) {
                Column(modifier = GlanceModifier.defaultWeight()) {
                    Text(
                        text = "THE BLACK BOX",
                        style = TextStyle(color = BMS_WHITE, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "BATTERY MONITOR",
                        style = TextStyle(color = BMS_SECONDARY, fontSize = 9.sp)
                    )
                }
                
                if (isDataAvailable) {
                    val statusLabel = if (isLive) "● LIVE" else "● RECENT"
                    val statusColor = if (isLive) BMS_GREEN else BMS_YELLOW
                    
                    Text(
                        text = statusLabel,
                        style = TextStyle(color = statusColor, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    )
                }
            }

            Spacer(GlanceModifier.height(6.dp))

            if (!isDataAvailable) {
                Box(modifier = GlanceModifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = "FETCHING DATA...",
                        style = TextStyle(color = BMS_RED, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    )
                }
            } else {
                Text(
                    text = "CELL VOLTAGES",
                    style = TextStyle(color = BMS_SECONDARY, fontSize = 8.sp, fontWeight = FontWeight.Bold),
                    modifier = GlanceModifier.fillMaxWidth()
                )

                Spacer(GlanceModifier.height(4.dp))

                // Cells Row
                Row(modifier = GlanceModifier.fillMaxWidth()) {
                    CellCard(name = "CELL 1", voltage = cell1, modifier = GlanceModifier.defaultWeight())
                    Spacer(GlanceModifier.width(4.dp))
                    CellCard(name = "CELL 2", voltage = cell2, modifier = GlanceModifier.defaultWeight())
                    Spacer(GlanceModifier.width(4.dp))
                    CellCard(name = "CELL 3", voltage = cell3, modifier = GlanceModifier.defaultWeight())
                }

                Spacer(GlanceModifier.height(6.dp))

                // Metrics Row
                Row(modifier = GlanceModifier.fillMaxWidth()) {
                    MetricItem(
                        label = "TOTAL VOLTAGE",
                        value = "%.3f V".format(totalVoltage),
                        modifier = GlanceModifier.defaultWeight()
                    )
                    Spacer(GlanceModifier.width(8.dp))
                    MetricItem(
                        label = "TEMPERATURE",
                        value = "%.2f °C".format(temperature),
                        valueColor = if (temperature >= CRITICAL_TEMPERATURE_THRESHOLD) BMS_RED else BMS_GREEN,
                        modifier = GlanceModifier.defaultWeight()
                    )
                }

                Spacer(GlanceModifier.height(6.dp))

                // Evaluate Live Safety Condition (Priority Over RUL)
                val validCells = listOf(cell1, cell2, cell3).filter { it > 0.0 }
                val minCell = if (validCells.isNotEmpty()) validCells.minOrNull() ?: 0.0 else 0.0
                val minCellIndex = when (minCell) {
                    cell1 -> 1
                    cell2 -> 2
                    else -> 3
                }

                val isCriticalTemp = temperature >= CRITICAL_TEMPERATURE_THRESHOLD
                val isSensorFault = minCell > 0.0 && minCell < SENSOR_FAULT_THRESHOLD
                val isCriticalVoltage = minCell >= SENSOR_FAULT_THRESHOLD && minCell < CRITICAL_VOLTAGE_THRESHOLD
                val isLowVoltage = minCell >= CRITICAL_VOLTAGE_THRESHOLD && minCell < LOW_VOLTAGE_THRESHOLD

                val liveConditionLabel = when {
                    isCriticalTemp -> "CRITICAL TEMP (%.1f°C)".format(temperature)
                    isSensorFault -> "CHECK SENSOR / CELL $minCellIndex (%.2fV)".format(minCell)
                    isCriticalVoltage -> "CRITICAL CELL $minCellIndex VOLTAGE (%.2fV)".format(minCell)
                    isLowVoltage -> "LOW VOLTAGE CELL $minCellIndex (%.2fV)".format(minCell)
                    else -> "HEALTHY"
                }

                val liveConditionColor = when {
                    isCriticalTemp || isSensorFault || isCriticalVoltage -> BMS_RED
                    isLowVoltage -> BMS_YELLOW
                    else -> BMS_GREEN
                }

                // LIVE CONDITION Row
                Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.Vertical.CenterVertically) {
                    Column(modifier = GlanceModifier.defaultWeight()) {
                        Text(
                            text = "LIVE CONDITION",
                            style = TextStyle(color = BMS_SECONDARY, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "● $liveConditionLabel",
                            style = TextStyle(color = liveConditionColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        )
                    }

                    Column(horizontalAlignment = Alignment.Horizontal.End) {
                        Text(
                            text = "HEALTH (SOH)",
                            style = TextStyle(color = BMS_SECONDARY, fontSize = 8.sp)
                        )
                        Text(
                            text = soh?.let { "%.0f%%".format(it) } ?: "N/A",
                            style = TextStyle(
                                color = if (soh != null && soh > 80) BMS_GREEN else BMS_WHITE,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        )
                    }
                }

                Spacer(GlanceModifier.height(6.dp))

                // MODEL FORECAST (XGBoost RUL) Section
                val usageProfileRate = if (avgCyclesPerDay != null && avgCyclesPerDay > 0.0) avgCyclesPerDay else 1.0
                val computedDays = if (predictedRul != null && predictedRul > 0.0) predictedRul / usageProfileRate else estimatedDays

                Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.Vertical.CenterVertically) {
                    Column(modifier = GlanceModifier.defaultWeight()) {
                        Text(
                            text = "MODEL FORECAST (EST. REMAINING LIFE)",
                            style = TextStyle(color = BMS_SECONDARY, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                        )

                        val estDaysText = when {
                            predictedRul != null && predictedRul <= 0.0 -> "REPLACEMENT DUE"
                            computedDays != null && computedDays > 0.0 -> "~%.0f DAYS".format(computedDays)
                            else -> "N/A"
                        }

                        val estDaysColor = when {
                            isCriticalTemp || isSensorFault || isCriticalVoltage -> BMS_RED
                            predictedRul != null && predictedRul <= 0.0 -> BMS_RED
                            computedDays == null -> BMS_WHITE
                            computedDays <= 30.0 -> BMS_YELLOW
                            else -> BMS_GREEN
                        }

                        Text(
                            text = estDaysText,
                            style = TextStyle(color = estDaysColor, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        )

                        val forecastProfileText = when {
                            predictedRul != null && predictedRul > 0.0 -> 
                                "${predictedRul.toInt()} cycles (at %.1f cycle/day profile)".format(usageProfileRate)
                            currentCycle != null -> 
                                "Current cycle: ${currentCycle.toInt()}"
                            else -> null
                        }

                        if (forecastProfileText != null) {
                            Text(
                                text = forecastProfileText,
                                style = TextStyle(color = BMS_SECONDARY, fontSize = 7.sp)
                            )
                        }
                    }
                }

                Spacer(GlanceModifier.height(4.dp))

                // Footer
                val displayTime = if (timestamp.length > 19) {
                     timestamp.substring(0, 19).replace("T", " ")
                } else {
                    timestamp
                }
                
                Text(
                    text = "LAST UPLOAD: $displayTime",
                    style = TextStyle(color = BMS_SECONDARY, fontSize = 7.sp),
                    modifier = GlanceModifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
private fun CellCard(name: String, voltage: Double, modifier: GlanceModifier = GlanceModifier) {
    val (statusLabel, statusColor) = when {
        voltage <= 0.0 -> Pair("NO DATA", BMS_SECONDARY)
        voltage < SENSOR_FAULT_THRESHOLD -> Pair("CHECK SENSOR", BMS_RED)
        voltage < CRITICAL_VOLTAGE_THRESHOLD -> Pair("CRITICAL", BMS_RED)
        voltage < LOW_VOLTAGE_THRESHOLD -> Pair("LOW", BMS_YELLOW)
        else -> Pair("NORMAL", BMS_BLUE)
    }

    Column(
        modifier = modifier
            .background(BMS_CARD)
            .padding(4.dp),
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally
    ) {
        Text(
            text = name,
            style = TextStyle(color = BMS_SECONDARY, fontSize = 8.sp)
        )
        Text(
            text = "%.3f V".format(voltage),
            style = TextStyle(color = BMS_WHITE, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        )
        Text(
            text = statusLabel,
            style = TextStyle(color = statusColor, fontSize = 7.sp, fontWeight = FontWeight.Bold)
        )
    }
}

@Composable
private fun MetricItem(
    label: String,
    value: String,
    valueColor: ColorProvider = BMS_WHITE,
    modifier: GlanceModifier = GlanceModifier
) {
    Column(modifier = modifier) {
        Text(
            text = label,
            style = TextStyle(color = BMS_SECONDARY, fontSize = 8.sp)
        )
        Text(
            text = value,
            style = TextStyle(color = valueColor, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        )
    }
}

private fun GlanceModifier.defaultWeight(): GlanceModifier = this.width(0.dp).padding(0.dp)

private fun checkIsLive(timestamp: String): Boolean {
    return try {
        val formatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME
        val parsedTime = OffsetDateTime.parse(timestamp, formatter)
        val currentTime = OffsetDateTime.now(parsedTime.offset)
        
        val minutesDiff = ChronoUnit.MINUTES.between(parsedTime, currentTime)
        Math.abs(minutesDiff) < LIVE_DATA_THRESHOLD_MINUTES
    } catch (e: Exception) {
        false
    }
}
