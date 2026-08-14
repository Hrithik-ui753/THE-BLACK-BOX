package com.blackbox.battery

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Locale


// ============================================================
// BATTERY HEALTH SCREEN
// ============================================================

@Composable
fun BatteryHealthScreen(
    batteryData: BatteryData,
    onBack: () -> Unit
) {

    // --------------------------------------------------------
    // CURRENT CELL VALUES
    // --------------------------------------------------------

    val cell1 = batteryData.cell1Voltage
    val cell2 = batteryData.cell2Voltage
    val cell3 = batteryData.cell3Voltage

    val highestCell =
        maxOf(
            cell1,
            cell2,
            cell3
        )

    val lowestCell =
        minOf(
            cell1,
            cell2,
            cell3
        )

    val imbalance =
        highestCell - lowestCell


    // --------------------------------------------------------
    // INDIVIDUAL CELL CONDITIONS
    // --------------------------------------------------------

    val cell1Critical =
        cell1 < 3.0

    val cell2Critical =
        cell2 < 3.0

    val cell3Critical =
        cell3 < 3.0


    // --------------------------------------------------------
    // TEMPERATURE
    // --------------------------------------------------------

    val temperature =
        batteryData.temperature

    val temperatureCritical =
        temperature >= 60.0

    val temperatureWarning =
        temperature >= 50.0


    // --------------------------------------------------------
    // CELL IMBALANCE
    // --------------------------------------------------------

    val imbalanceCritical =
        imbalance >= 0.5

    val imbalanceWarning =
        imbalance >= 0.2


    // --------------------------------------------------------
    // DETERMINE OVERALL CONDITION
    // --------------------------------------------------------

    val criticalIssue =
        cell1Critical ||
                cell2Critical ||
                cell3Critical ||
                temperatureCritical ||
                imbalanceCritical


    val warningIssue =
        temperatureWarning ||
                imbalanceWarning


    val overallStatus =
        when {

            criticalIssue ->
                "CRITICAL"

            warningIssue ->
                "ATTENTION REQUIRED"

            else ->
                "HEALTHY"
        }


    val overallColor =
        when {

            criticalIssue ->
                Red

            warningIssue ->
                Orange

            else ->
                Green
        }


    // --------------------------------------------------------
    // HEALTH SCORE
    // --------------------------------------------------------

    /*
     * This is NOT battery SOH.
     *
     * It is a telemetry health score.
     *
     * It evaluates the current measurable condition.
     */

    var healthScore = 100


    // Cell voltage penalties

    if (cell1Critical) {
        healthScore -= 25
    }

    if (cell2Critical) {
        healthScore -= 25
    }

    if (cell3Critical) {
        healthScore -= 25
    }


    // Cell imbalance penalties

    if (imbalance >= 0.5) {

        healthScore -= 20

    } else if (imbalance >= 0.2) {

        healthScore -= 10
    }


    // Temperature penalties

    if (temperature >= 60.0) {

        healthScore -= 20

    } else if (temperature >= 50.0) {

        healthScore -= 10
    }


    healthScore =
        healthScore.coerceIn(
            0,
            100
        )


    val scoreLabel =
        when {

            healthScore >= 85 ->
                "GOOD"

            healthScore >= 65 ->
                "MODERATE"

            healthScore >= 40 ->
                "POOR"

            else ->
                "CRITICAL"
        }


    val scoreColor =
        when {

            healthScore >= 85 ->
                Green

            healthScore >= 65 ->
                Orange

            else ->
                Red
        }


    // ========================================================
    // UI
    // ========================================================

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .verticalScroll(
                rememberScrollState()
            )
            .padding(
                start = 20.dp,
                end = 20.dp,
                top = 8.dp,
                bottom = 30.dp
            )
    ) {

        // ----------------------------------------------------
        // HEADER
        // ----------------------------------------------------

        Row(
            modifier = Modifier.fillMaxWidth(),

            verticalAlignment =
                Alignment.CenterVertically
        ) {

            TextButton(
                onClick = onBack
            ) {

                Text(
                    text = "‹ BACK",

                    color = Green,

                    fontSize = 15.sp,

                    fontWeight =
                        FontWeight.Bold
                )
            }


            Spacer(
                modifier =
                    Modifier.width(4.dp)
            )


            Column {

                Text(
                    text =
                        "BATTERY HEALTH",

                    color = White,

                    fontSize = 22.sp,

                    fontWeight =
                        FontWeight.Bold
                )

                Text(
                    text =
                        "TELEMETRY HEALTH ANALYSIS",

                    color =
                        SecondaryText,

                    fontSize = 9.sp,

                    letterSpacing = 1.sp
                )
            }
        }


        Spacer(
            modifier =
                Modifier.height(18.dp)
        )


        // ----------------------------------------------------
        // HEALTH SCORE
        // ----------------------------------------------------

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    CardBackground,
                    RoundedCornerShape(20.dp)
                )
                .padding(22.dp)
        ) {

            Column {

                Text(
                    text =
                        "CURRENT HEALTH SCORE",

                    color =
                        SecondaryText,

                    fontSize = 11.sp,

                    letterSpacing = 1.sp
                )


                Spacer(
                    modifier =
                        Modifier.height(8.dp)
                )


                Row(
                    modifier =
                        Modifier.fillMaxWidth(),

                    verticalAlignment =
                        Alignment.Bottom,

                    horizontalArrangement =
                        Arrangement.SpaceBetween
                ) {

                    Text(
                        text =
                            "$healthScore / 100",

                        color =
                            scoreColor,

                        fontSize = 40.sp,

                        fontWeight =
                            FontWeight.Bold
                    )


                    Text(
                        text =
                            scoreLabel,

                        color =
                            scoreColor,

                        fontSize = 13.sp,

                        fontWeight =
                            FontWeight.Bold
                    )
                }


                Spacer(
                    modifier =
                        Modifier.height(10.dp)
                )


                Text(
                    text =
                        "This is a current telemetry-based condition score, not a measured battery SOH percentage.",

                    color =
                        SecondaryText,

                    fontSize = 10.sp
                )
            }
        }


        Spacer(
            modifier =
                Modifier.height(18.dp)
        )


        // ----------------------------------------------------
        // OVERALL CONDITION
        // ----------------------------------------------------

        HealthStatusCard(
            status = overallStatus,
            color = overallColor
        )


        Spacer(
            modifier =
                Modifier.height(22.dp)
        )


        // ----------------------------------------------------
        // CELL ANALYSIS
        // ----------------------------------------------------

        Text(
            text =
                "CELL ANALYSIS",

            color = White,

            fontSize = 18.sp,

            fontWeight =
                FontWeight.Bold
        )


        Spacer(
            modifier =
                Modifier.height(10.dp)
        )


        HealthCellCard(
            cellNumber = 1,
            voltage = cell1,
            critical = cell1Critical
        )


        Spacer(
            modifier =
                Modifier.height(8.dp)
        )


        HealthCellCard(
            cellNumber = 2,
            voltage = cell2,
            critical = cell2Critical
        )


        Spacer(
            modifier =
                Modifier.height(8.dp)
        )


        HealthCellCard(
            cellNumber = 3,
            voltage = cell3,
            critical = cell3Critical
        )


        Spacer(
            modifier =
                Modifier.height(18.dp)
        )


        // ----------------------------------------------------
        // CELL BALANCE
        // ----------------------------------------------------

        HealthMetricCard(
            title =
                "CELL VOLTAGE IMBALANCE",

            value =
                String.format(
                    Locale.US,
                    "%.3f V",
                    imbalance
                ),

            status =
                when {

                    imbalanceCritical ->
                        "CRITICAL"

                    imbalanceWarning ->
                        "WARNING"

                    else ->
                        "NORMAL"
                },

            statusColor =
                when {

                    imbalanceCritical ->
                        Red

                    imbalanceWarning ->
                        Orange

                    else ->
                        Green
                }
        )


        Spacer(
            modifier =
                Modifier.height(18.dp)
        )


        // ----------------------------------------------------
        // ENVIRONMENT
        // ----------------------------------------------------

        Text(
            text =
                "ENVIRONMENT",

            color = White,

            fontSize = 18.sp,

            fontWeight =
                FontWeight.Bold
        )


        Spacer(
            modifier =
                Modifier.height(10.dp)
        )


        Row(
            modifier =
                Modifier.fillMaxWidth(),

            horizontalArrangement =
                Arrangement.spacedBy(8.dp)
        ) {

            HealthSmallCard(
                title =
                    "TEMPERATURE",

                value =
                    String.format(
                        Locale.US,
                        "%.2f °C",
                        temperature
                    ),

                status =
                    when {

                        temperatureCritical ->
                            "CRITICAL"

                        temperatureWarning ->
                            "HIGH"

                        else ->
                            "NORMAL"
                    },

                statusColor =
                    when {

                        temperatureCritical ->
                            Red

                        temperatureWarning ->
                            Orange

                        else ->
                            Green
                    },

                modifier =
                    Modifier.weight(1f)
            )


            HealthSmallCard(
                title =
                    "AMBIENT",

                value =
                    String.format(
                        Locale.US,
                        "%.2f °C",
                        batteryData.ambientTemperature
                    ),

                status =
                    "NORMAL",

                statusColor =
                    Green,

                modifier =
                    Modifier.weight(1f)
            )


            HealthSmallCard(
                title =
                    "GAS",

                value =
                    String.format(
                        Locale.US,
                        "%.0f",
                        batteryData.gas
                    ),

                status =
                    "READING",

                statusColor =
                    Green,

                modifier =
                    Modifier.weight(1f)
            )
        }


        Spacer(
            modifier =
                Modifier.height(22.dp)
        )


        // ----------------------------------------------------
        // DIAGNOSTIC SUMMARY
        // ----------------------------------------------------

        Text(
            text =
                "DIAGNOSTIC SUMMARY",

            color = White,

            fontSize = 18.sp,

            fontWeight =
                FontWeight.Bold
        )


        Spacer(
            modifier =
                Modifier.height(10.dp)
        )


        DiagnosticSummaryCard(
            cell1 = cell1,
            cell2 = cell2,
            cell3 = cell3,
            imbalance = imbalance,
            temperature = temperature
        )


        Spacer(
            modifier =
                Modifier.height(18.dp)
        )


        // ----------------------------------------------------
        // RECOMMENDATION
        // ----------------------------------------------------

        RecommendationCard(
            cell1Critical = cell1Critical,
            cell2Critical = cell2Critical,
            cell3Critical = cell3Critical,
            temperatureCritical = temperatureCritical,
            imbalanceCritical = imbalanceCritical
        )
    }
}


// ============================================================
// HEALTH STATUS CARD
// ============================================================

@Composable
fun HealthStatusCard(
    status: String,
    color: Color
) {

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                CardBackground,
                RoundedCornerShape(16.dp)
            )
            .padding(18.dp)
    ) {

        Row(
            verticalAlignment =
                Alignment.CenterVertically
        ) {

            Box(
                modifier = Modifier
                    .width(10.dp)
                    .height(10.dp)
                    .background(
                        color,
                        CircleShape
                    )
            )


            Spacer(
                modifier =
                    Modifier.width(12.dp)
            )


            Column {

                Text(
                    text =
                        "OVERALL CONDITION",

                    color =
                        SecondaryText,

                    fontSize = 9.sp
                )

                Spacer(
                    modifier =
                        Modifier.height(4.dp)
                )

                Text(
                    text = status,

                    color = color,

                    fontSize = 17.sp,

                    fontWeight =
                        FontWeight.Bold
                )
            }
        }
    }
}


// ============================================================
// CELL HEALTH CARD
// ============================================================

@Composable
fun HealthCellCard(
    cellNumber: Int,
    voltage: Double,
    critical: Boolean
) {

    val status =
        if (critical)
            "CRITICAL"
        else
            "NORMAL"


    val statusColor =
        if (critical)
            Red
        else
            Green


    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                CardBackground,
                RoundedCornerShape(14.dp)
            )
            .padding(16.dp)
    ) {

        Row(
            modifier =
                Modifier.fillMaxWidth(),

            horizontalArrangement =
                Arrangement.SpaceBetween,

            verticalAlignment =
                Alignment.CenterVertically
        ) {

            Column {

                Text(
                    text =
                        "CELL $cellNumber",

                    color =
                        White,

                    fontSize = 14.sp,

                    fontWeight =
                        FontWeight.Bold
                )

                Spacer(
                    modifier =
                        Modifier.height(4.dp)
                )

                Text(
                    text =
                        if (critical)
                            "Voltage below expected range"
                        else
                            "Voltage within monitored range",

                    color =
                        SecondaryText,

                    fontSize = 10.sp
                )
            }


            Column(
                horizontalAlignment =
                    Alignment.End
            ) {

                Text(
                    text =
                        String.format(
                            Locale.US,
                            "%.3f V",
                            voltage
                        ),

                    color =
                        White,

                    fontSize = 18.sp,

                    fontWeight =
                        FontWeight.Bold
                )

                Text(
                    text = status,

                    color =
                        statusColor,

                    fontSize = 9.sp,

                    fontWeight =
                        FontWeight.Bold
                )
            }
        }
    }
}


// ============================================================
// HEALTH METRIC CARD
// ============================================================

@Composable
fun HealthMetricCard(
    title: String,
    value: String,
    status: String,
    statusColor: Color
) {

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                CardBackground,
                RoundedCornerShape(14.dp)
            )
            .padding(16.dp)
    ) {

        Row(
            modifier =
                Modifier.fillMaxWidth(),

            horizontalArrangement =
                Arrangement.SpaceBetween,

            verticalAlignment =
                Alignment.CenterVertically
        ) {

            Column {

                Text(
                    text = title,

                    color =
                        SecondaryText,

                    fontSize = 10.sp
                )

                Spacer(
                    modifier =
                        Modifier.height(4.dp)
                )

                Text(
                    text = value,

                    color = White,

                    fontSize = 20.sp,

                    fontWeight =
                        FontWeight.Bold
                )
            }


            Text(
                text = status,

                color =
                    statusColor,

                fontSize = 10.sp,

                fontWeight =
                    FontWeight.Bold
            )
        }
    }
}


// ============================================================
// SMALL HEALTH CARD
// ============================================================

@Composable
fun HealthSmallCard(
    title: String,
    value: String,
    status: String,
    statusColor: Color,
    modifier: Modifier
) {

    Box(
        modifier = modifier
            .background(
                CardBackground,
                RoundedCornerShape(14.dp)
            )
            .padding(12.dp)
    ) {

        Column {

            Text(
                text = title,

                color =
                    SecondaryText,

                fontSize = 8.sp
            )

            Spacer(
                modifier =
                    Modifier.height(5.dp)
            )

            Text(
                text = value,

                color = White,

                fontSize = 13.sp,

                fontWeight =
                    FontWeight.Bold
            )

            Spacer(
                modifier =
                    Modifier.height(4.dp)
            )

            Text(
                text = status,

                color =
                    statusColor,

                fontSize = 8.sp,

                fontWeight =
                    FontWeight.Bold
            )
        }
    }
}


// ============================================================
// DIAGNOSTIC SUMMARY
// ============================================================

@Composable
fun DiagnosticSummaryCard(
    cell1: Double,
    cell2: Double,
    cell3: Double,
    imbalance: Double,
    temperature: Double
) {

    val issues =
        mutableListOf<String>()


    if (cell1 < 3.0) {

        issues.add(
            "Cell 1 voltage is below the monitored threshold."
        )
    }


    if (cell2 < 3.0) {

        issues.add(
            "Cell 2 voltage is below the monitored threshold."
        )
    }


    if (cell3 < 3.0) {

        issues.add(
            "Cell 3 voltage is significantly low."
        )
    }


    if (imbalance >= 0.5) {

        issues.add(
            "Large voltage imbalance detected between cells."
        )

    } else if (imbalance >= 0.2) {

        issues.add(
            "Moderate voltage imbalance detected between cells."
        )
    }


    if (temperature >= 60.0) {

        issues.add(
            "Battery temperature is critically high."
        )

    } else if (temperature >= 50.0) {

        issues.add(
            "Battery temperature is elevated."
        )
    }


    if (issues.isEmpty()) {

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    CardBackground,
                    RoundedCornerShape(16.dp)
                )
                .padding(18.dp)
        ) {

            Text(
                text =
                    "No significant abnormal conditions detected in the current telemetry.",

                color =
                    Green,

                fontSize = 12.sp
            )
        }

    } else {

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    CardBackground,
                    RoundedCornerShape(16.dp)
                )
                .padding(18.dp)
        ) {

            Column {

                issues.forEachIndexed {
                        index,
                        issue ->

                    Row(
                        verticalAlignment =
                            Alignment.Top
                    ) {

                        Text(
                            text = "•",

                            color = Red,

                            fontSize = 15.sp,

                            fontWeight =
                                FontWeight.Bold
                        )

                        Spacer(
                            modifier =
                                Modifier.width(8.dp)
                        )

                        Text(
                            text = issue,

                            color = White,

                            fontSize = 11.sp
                        )
                    }


                    if (
                        index <
                        issues.lastIndex
                    ) {

                        Spacer(
                            modifier =
                                Modifier.height(10.dp)
                        )
                    }
                }
            }
        }
    }
}


// ============================================================
// RECOMMENDATION
// ============================================================

@Composable
fun RecommendationCard(
    cell1Critical: Boolean,
    cell2Critical: Boolean,
    cell3Critical: Boolean,
    temperatureCritical: Boolean,
    imbalanceCritical: Boolean
) {

    val recommendation =

        when {

            cell1Critical ||
                    cell2Critical ||
                    cell3Critical ->

                "Inspect the affected cell and verify its physical connection, voltage condition, and battery state before continued operation."

            temperatureCritical ->

                "Battery temperature is critically high. Stop operation if required by your safety procedure and inspect the thermal condition."

            imbalanceCritical ->

                "A significant cell imbalance is present. Inspect the cell voltages and battery configuration."

            else ->

                "Continue monitoring the battery. No immediate critical telemetry condition is currently detected."
        }


    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Color(0xFF111111),
                RoundedCornerShape(16.dp)
            )
            .padding(18.dp)
    ) {

        Column {

            Text(
                text =
                    "RECOMMENDED ACTION",

                color =
                    SecondaryText,

                fontSize = 10.sp,

                letterSpacing = 1.sp
            )


            Spacer(
                modifier =
                    Modifier.height(8.dp)
            )


            Text(
                text =
                    recommendation,

                color =
                    White,

                fontSize = 12.sp
            )
        }
    }
}