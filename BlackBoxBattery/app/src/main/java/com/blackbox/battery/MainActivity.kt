package com.blackbox.battery

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale


// ============================================================
// MAIN ACTIVITY
// ============================================================

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {

            Surface(
                modifier = Modifier.fillMaxSize(),
                color = Background
            ) {

                AppScreen()
            }
        }
    }
}


// ============================================================
// COLORS
// ============================================================

val Background = Color(0xFF080808)
val CardBackground = Color(0xFF151515)
val SecondaryText = Color(0xFF888888)
val Green = Color(0xFF00E676)
val Red = Color(0xFFFF5252)
val Orange = Color(0xFFFFAB40)
val White = Color.White


// ============================================================
// MAIN APP SCREEN
// ============================================================

@Composable
fun AppScreen() {

    // --------------------------------------------------------
    // ONE SHARED LIVE BATTERY DATA
    // --------------------------------------------------------

    var batteryData by remember {
        mutableStateOf(BatteryData())
    }

    var connectionError by remember {
        mutableStateOf<String?>(null)
    }


    // --------------------------------------------------------
    // SCREEN NAVIGATION
    // --------------------------------------------------------

    var selectedCell by remember {
        mutableStateOf<Int?>(null)
    }

    var showBatteryHealth by remember {
        mutableStateOf(false)
    }


    // --------------------------------------------------------
    // FIREBASE REALTIME LISTENER
    //
    // This now lives HERE instead of inside DashboardScreen.
    //
    // That means Battery Health and Dashboard receive the
    // exact same live Firebase data.
    // --------------------------------------------------------

    LaunchedEffect(Unit) {

        val repository = FirebaseRepository()

        repository.observeBatteryData(

            onDataChanged = { data ->

                batteryData = data
                connectionError = null
            },

            onError = { error ->

                connectionError = error
            }
        )
    }


    // --------------------------------------------------------
    // CAMERA / STATUS BAR SAFE AREA
    // --------------------------------------------------------

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .statusBarsPadding()
    ) {

        when {

            // ------------------------------------------------
            // BATTERY HEALTH
            // ------------------------------------------------

            showBatteryHealth -> {

                BatteryHealthScreen(
                    batteryData = batteryData,

                    onBack = {
                        showBatteryHealth = false
                    }
                )
            }


            // ------------------------------------------------
            // CELL HISTORY
            // ------------------------------------------------

            selectedCell != null -> {

                CellDetailScreen(
                    cellNumber = selectedCell!!,

                    onBack = {
                        selectedCell = null
                    }
                )
            }


            // ------------------------------------------------
            // MAIN DASHBOARD
            // ------------------------------------------------

            else -> {

                DashboardScreen(
                    batteryData = batteryData,
                    connectionError = connectionError,

                    onCellClicked = { cell ->

                        selectedCell = cell
                    },

                    onHealthClicked = {

                        showBatteryHealth = true
                    }
                )
            }
        }
    }
}


// ============================================================
// TIMESTAMP PARSER
// ============================================================

fun parseFirebaseDate(
    timestamp: String
): Date? {

    if (timestamp.isBlank()) {
        return null
    }

    return try {

        val normalizedTimestamp =
            timestamp.replace(
                Regex(
                    """\.(\d{3})\d+([+-]\d{2}:\d{2})$"""
                ),
                ".$1$2"
            )

        val inputFormat =
            SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                Locale.ENGLISH
            )

        inputFormat.parse(
            normalizedTimestamp
        )

    } catch (e: Exception) {

        null
    }
}


// ============================================================
// FULL TIMESTAMP
// ============================================================

fun formatTimestamp(
    timestamp: String
): String {

    if (timestamp.isBlank()) {
        return "Waiting for data..."
    }

    val date =
        parseFirebaseDate(timestamp)

    if (date == null) {
        return timestamp
    }

    return try {

        val outputFormat =
            SimpleDateFormat(
                "dd MMM yyyy • hh:mm:ss a",
                Locale.ENGLISH
            )

        outputFormat.format(date)

    } catch (e: Exception) {

        timestamp
    }
}


// ============================================================
// SHORT TIME
// ============================================================

fun formatShortTime(
    timestamp: String
): String {

    if (timestamp.isBlank()) {
        return "--:--"
    }

    val date =
        parseFirebaseDate(timestamp)

    if (date == null) {
        return "--:--"
    }

    return try {

        val outputFormat =
            SimpleDateFormat(
                "hh:mm:ss a",
                Locale.ENGLISH
            )

        outputFormat.format(date)

    } catch (e: Exception) {

        "--:--"
    }
}


// ============================================================
// DASHBOARD
// ============================================================

@Composable
fun DashboardScreen(
    batteryData: BatteryData,
    connectionError: String?,
    onCellClicked: (Int) -> Unit,
    onHealthClicked: () -> Unit
) {

    // --------------------------------------------------------
    // CELL VALUES
    // --------------------------------------------------------

    val cell1 =
        batteryData.cell1Voltage

    val cell2 =
        batteryData.cell2Voltage

    val cell3 =
        batteryData.cell3Voltage


    // --------------------------------------------------------
    // CELL BALANCE
    // --------------------------------------------------------

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
    // WARNINGS
    // --------------------------------------------------------

    val cell1Warning =
        cell1 < 3.0

    val cell2Warning =
        cell2 < 3.0

    val cell3Warning =
        cell3 < 3.0

    val temperatureWarning =
        batteryData.temperature >= 50.0


    val batteryCritical =
        cell1Warning ||
                cell2Warning ||
                cell3Warning ||
                temperatureWarning ||
                imbalance >= 0.5


    val batteryStatus =
        if (batteryCritical)
            "ATTENTION REQUIRED"
        else
            "BATTERY HEALTHY"


    val batteryStatusColor =
        if (batteryCritical)
            Red
        else
            Green


    // --------------------------------------------------------
    // DASHBOARD UI
    // --------------------------------------------------------

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
                top = 12.dp,
                bottom = 30.dp
            )
    ) {

        // ----------------------------------------------------
        // HEADER
        // ----------------------------------------------------

        Text(
            text = "THE BLACK BOX",
            color = White,
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold
        )

        Text(
            text = "BATTERY INTELLIGENCE",
            color = SecondaryText,
            fontSize = 11.sp,
            letterSpacing = 2.sp
        )

        Spacer(
            modifier =
                Modifier.height(22.dp)
        )


        // ----------------------------------------------------
        // CONNECTION STATUS
        // ----------------------------------------------------

        StatusCard(
            connected =
                connectionError == null
        )

        Spacer(
            modifier =
                Modifier.height(16.dp)
        )


        // ----------------------------------------------------
        // BATTERY CONDITION
        // ----------------------------------------------------

        BatteryConditionCard(
            status =
                batteryStatus,

            statusColor =
                batteryStatusColor
        )

        Spacer(
            modifier =
                Modifier.height(16.dp)
        )


        // ----------------------------------------------------
        // TOTAL VOLTAGE
        // ----------------------------------------------------

        VoltageCard(
            voltage =
                batteryData.totalVoltage
        )

        Spacer(
            modifier =
                Modifier.height(22.dp)
        )


        // ----------------------------------------------------
        // CELL MONITOR
        // ----------------------------------------------------

        SectionTitle(
            title = "CELL MONITOR"
        )

        Text(
            text =
                "Tap a cell to view its history",

            color =
                SecondaryText,

            fontSize = 11.sp
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

            CellCard(
                title = "CELL 1",
                voltage = cell1,
                warning = cell1Warning,
                modifier = Modifier.weight(1f),

                onClick = {
                    onCellClicked(1)
                }
            )

            CellCard(
                title = "CELL 2",
                voltage = cell2,
                warning = cell2Warning,
                modifier = Modifier.weight(1f),

                onClick = {
                    onCellClicked(2)
                }
            )

            CellCard(
                title = "CELL 3",
                voltage = cell3,
                warning = cell3Warning,
                modifier = Modifier.weight(1f),

                onClick = {
                    onCellClicked(3)
                }
            )
        }


        Spacer(
            modifier =
                Modifier.height(16.dp)
        )


        // ----------------------------------------------------
        // CELL IMBALANCE
        // ----------------------------------------------------

        InfoWideCard(
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

                    imbalance >= 0.5 ->
                        "CRITICAL"

                    imbalance >= 0.2 ->
                        "WARNING"

                    else ->
                        "NORMAL"
                }
        )


        Spacer(
            modifier =
                Modifier.height(22.dp)
        )


        // ----------------------------------------------------
        // BATTERY HEALTH BUTTON
        // ----------------------------------------------------

        BatteryHealthButton(
            onClick =
                onHealthClicked
        )


        Spacer(
            modifier =
                Modifier.height(22.dp)
        )


        // ----------------------------------------------------
        // ENVIRONMENT
        // ----------------------------------------------------

        SectionTitle(
            title = "ENVIRONMENT"
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

            InfoCard(
                title =
                    "TEMPERATURE",

                value =
                    String.format(
                        Locale.US,
                        "%.2f °C",
                        batteryData.temperature
                    ),

                warning =
                    temperatureWarning,

                modifier =
                    Modifier.weight(1f)
            )


            InfoCard(
                title =
                    "AMBIENT",

                value =
                    String.format(
                        Locale.US,
                        "%.2f °C",
                        batteryData.ambientTemperature
                    ),

                warning = false,

                modifier =
                    Modifier.weight(1f)
            )


            InfoCard(
                title =
                    "GAS",

                value =
                    String.format(
                        Locale.US,
                        "%.0f",
                        batteryData.gas
                    ),

                warning = false,

                modifier =
                    Modifier.weight(1f)
            )
        }


        Spacer(
            modifier =
                Modifier.height(22.dp)
        )


        // ----------------------------------------------------
        // LAST UPDATE
        // ----------------------------------------------------

        SectionTitle(
            title =
                "LAST UPDATE"
        )

        Spacer(
            modifier =
                Modifier.height(8.dp)
        )


        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    CardBackground,
                    RoundedCornerShape(14.dp)
                )
                .padding(16.dp)
        ) {

            Text(
                text =
                    formatTimestamp(
                        batteryData.timestamp
                    ),

                color =
                    White,

                fontSize =
                    14.sp,

                fontWeight =
                    FontWeight.Medium
            )
        }
    }
}


// ============================================================
// BATTERY HEALTH BUTTON
// ============================================================

@Composable
fun BatteryHealthButton(
    onClick: () -> Unit
) {

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                CardBackground,
                RoundedCornerShape(18.dp)
            )
            .clickable(
                onClick = onClick
            )
            .padding(18.dp)
    ) {

        Row(
            modifier =
                Modifier.fillMaxWidth(),

            verticalAlignment =
                Alignment.CenterVertically,

            horizontalArrangement =
                Arrangement.SpaceBetween
        ) {

            Column {

                Text(
                    text =
                        "BATTERY HEALTH",

                    color =
                        White,

                    fontSize =
                        17.sp,

                    fontWeight =
                        FontWeight.Bold
                )

                Spacer(
                    modifier =
                        Modifier.height(4.dp)
                )

                Text(
                    text =
                        "View telemetry-based health analysis",

                    color =
                        SecondaryText,

                    fontSize =
                        10.sp
                )
            }


            Text(
                text =
                    "VIEW →",

                color =
                    Green,

                fontSize =
                    10.sp,

                fontWeight =
                    FontWeight.Bold
            )
        }
    }
}


// ============================================================
// CELL DETAIL SCREEN
// ============================================================

@Composable
fun CellDetailScreen(
    cellNumber: Int,
    onBack: () -> Unit
) {

    var history by remember {
        mutableStateOf<List<BatteryHistory>>(
            emptyList()
        )
    }

    var loading by remember {
        mutableStateOf(true)
    }

    var error by remember {
        mutableStateOf<String?>(null)
    }


    // --------------------------------------------------------
    // LOAD HISTORY
    // --------------------------------------------------------

    LaunchedEffect(cellNumber) {

        loading = true

        HistoryRepository().loadHistory(

            onDataLoaded = { data ->

                history =
                    data.sortedByDescending {

                        parseFirebaseDate(
                            it.timestamp
                        )?.time ?: 0L
                    }

                loading = false
                error = null
            },

            onError = { message ->

                error = message
                loading = false
            }
        )
    }


    // --------------------------------------------------------
    // CURRENT READING
    // --------------------------------------------------------

    val latestReading =
        history.maxByOrNull {

            parseFirebaseDate(
                it.timestamp
            )?.time ?: 0L
        }


    val currentVoltage =
        latestReading?.let {

            when (cellNumber) {

                1 ->
                    it.cell1Voltage

                2 ->
                    it.cell2Voltage

                else ->
                    it.cell3Voltage
            }

        } ?: 0.0


    val currentWarning =
        currentVoltage < 3.0


    val status =
        if (currentWarning)
            "WARNING"
        else
            "NORMAL"


    val statusColor =
        if (currentWarning)
            Red
        else
            Green


    // --------------------------------------------------------
    // DETAIL PAGE
    // --------------------------------------------------------

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .background(
                    Background
                )
    ) {

        Row(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(
                        horizontal = 8.dp,
                        vertical = 6.dp
                    ),

            verticalAlignment =
                Alignment.CenterVertically
        ) {

            TextButton(
                onClick = onBack
            ) {

                Text(
                    text = "‹ BACK",

                    color = Green,

                    fontWeight =
                        FontWeight.Bold,

                    fontSize = 15.sp
                )
            }


            Spacer(
                modifier =
                    Modifier.width(4.dp)
            )


            Column {

                Text(
                    text =
                        "CELL $cellNumber",

                    color =
                        White,

                    fontSize =
                        22.sp,

                    fontWeight =
                        FontWeight.Bold
                )

                Text(
                    text =
                        "CELL VOLTAGE ANALYSIS",

                    color =
                        SecondaryText,

                    fontSize =
                        10.sp,

                    letterSpacing =
                        1.sp
                )
            }
        }


        if (loading) {

            Box(
                modifier =
                    Modifier.fillMaxSize(),

                contentAlignment =
                    Alignment.Center
            ) {

                Text(
                    text =
                        "Loading cell history...",

                    color =
                        SecondaryText
                )
            }

        } else if (error != null) {

            Box(
                modifier =
                    Modifier
                        .fillMaxSize()
                        .padding(20.dp),

                contentAlignment =
                    Alignment.Center
            ) {

                Text(
                    text =
                        "Error: $error",

                    color =
                        Red
                )
            }

        } else {

            LazyColumn(

                modifier =
                    Modifier.fillMaxSize(),

                contentPadding =
                    PaddingValues(
                        start = 20.dp,
                        end = 20.dp,
                        bottom = 30.dp
                    ),

                verticalArrangement =
                    Arrangement.spacedBy(14.dp)
            ) {

                item {

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                CardBackground,
                                RoundedCornerShape(18.dp)
                            )
                            .padding(20.dp)
                    ) {

                        Column {

                            Text(
                                text =
                                    "CURRENT VOLTAGE",

                                color =
                                    SecondaryText,

                                fontSize = 10.sp,

                                letterSpacing =
                                    1.sp
                            )

                            Spacer(
                                modifier =
                                    Modifier.height(6.dp)
                            )

                            Text(
                                text =
                                    String.format(
                                        Locale.US,
                                        "%.3f V",
                                        currentVoltage
                                    ),

                                color =
                                    White,

                                fontSize =
                                    38.sp,

                                fontWeight =
                                    FontWeight.Bold
                            )

                            Spacer(
                                modifier =
                                    Modifier.height(5.dp)
                            )

                            Text(
                                text =
                                    status,

                                color =
                                    statusColor,

                                fontSize =
                                    11.sp,

                                fontWeight =
                                    FontWeight.Bold
                            )
                        }
                    }
                }


                item {

                    Column {

                        Text(
                            text =
                                "VOLTAGE VS TIME",

                            color =
                                White,

                            fontSize =
                                18.sp,

                            fontWeight =
                                FontWeight.Bold
                        )

                        Text(
                            text =
                                "Historical cell voltage",

                            color =
                                SecondaryText,

                            fontSize =
                                11.sp
                        )
                    }
                }


                item {

                    CellVoltageChart(
                        history =
                            history,

                        cellNumber =
                            cellNumber
                    )
                }


                item {

                    Column {

                        Text(
                            text =
                                "READING HISTORY",

                            color =
                                White,

                            fontSize =
                                18.sp,

                            fontWeight =
                                FontWeight.Bold
                        )

                        Text(
                            text =
                                "${history.size} recorded readings",

                            color =
                                SecondaryText,

                            fontSize =
                                11.sp
                        )
                    }
                }


                items(history) { reading ->

                    CellHistoryCard(
                        reading =
                            reading,

                        cellNumber =
                            cellNumber
                    )
                }
            }
        }
    }
}


// ============================================================
// VOLTAGE GRAPH
// ============================================================

@Composable
fun CellVoltageChart(
    history: List<BatteryHistory>,
    cellNumber: Int
) {

    val chronologicalHistory =
        history.sortedBy {

            parseFirebaseDate(
                it.timestamp
            )?.time ?: 0L
        }


    if (chronologicalHistory.size < 2) {

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(280.dp)
                .background(
                    CardBackground,
                    RoundedCornerShape(18.dp)
                ),

            contentAlignment =
                Alignment.Center
        ) {

            Text(
                text =
                    "Not enough historical data",

                color =
                    SecondaryText,

                fontSize =
                    12.sp
            )
        }

        return
    }


    val values =
        chronologicalHistory.map {

            when (cellNumber) {

                1 ->
                    it.cell1Voltage

                2 ->
                    it.cell2Voltage

                else ->
                    it.cell3Voltage
            }
        }


    val rawMin =
        values.minOrNull() ?: 0.0

    val rawMax =
        values.maxOrNull() ?: 1.0


    val dataRange =
        rawMax - rawMin

    val graphPadding =
        maxOf(
            dataRange * 0.10,
            0.05
        )


    val minValue =
        rawMin - graphPadding

    val maxValue =
        rawMax + graphPadding

    val valueRange =
        maxValue - minValue


    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(290.dp)
            .background(
                CardBackground,
                RoundedCornerShape(18.dp)
            )
            .padding(16.dp)
    ) {

        Column {

            Row(
                modifier =
                    Modifier.fillMaxWidth(),

                horizontalArrangement =
                    Arrangement.SpaceBetween
            ) {

                Text(
                    text =
                        String.format(
                            Locale.US,
                            "%.3f V",
                            rawMax
                        ),

                    color =
                        SecondaryText,

                    fontSize =
                        10.sp
                )

                Text(
                    text =
                        String.format(
                            Locale.US,
                            "%.3f V",
                            rawMin
                        ),

                    color =
                        SecondaryText,

                    fontSize =
                        10.sp
                )
            }


            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(215.dp)
            ) {

                val chartWidth =
                    size.width

                val chartHeight =
                    size.height


                for (i in 0..4) {

                    val y =
                        chartHeight *
                                i /
                                4f

                    drawLine(

                        color =
                            Color(0xFF292929),

                        start =
                            Offset(
                                0f,
                                y
                            ),

                        end =
                            Offset(
                                chartWidth,
                                y
                            ),

                        strokeWidth =
                            1f
                    )
                }


                val path =
                    Path()

                val lastIndex =
                    values.lastIndex


                values.forEachIndexed {
                        index,
                        voltage
                    ->

                    val progress =
                        index.toFloat() /
                                lastIndex.toFloat()

                    val x =
                        progress *
                                chartWidth


                    val normalized =
                        if (valueRange == 0.0) {

                            0.5f

                        } else {

                            (
                                    (voltage - minValue) /
                                            valueRange
                                    )
                                .toFloat()
                        }


                    val y =
                        chartHeight -
                                normalized *
                                chartHeight


                    if (index == 0) {

                        path.moveTo(
                            x,
                            y
                        )

                    } else {

                        path.lineTo(
                            x,
                            y
                        )
                    }


                    drawCircle(

                        color =
                            Green,

                        radius =
                            3f,

                        center =
                            Offset(
                                x,
                                y
                            )
                    )
                }


                drawPath(

                    path =
                        path,

                    color =
                        Green,

                    style =
                        Stroke(
                            width = 3f
                        )
                )
            }


            Row(
                modifier =
                    Modifier.fillMaxWidth(),

                horizontalArrangement =
                    Arrangement.SpaceBetween
            ) {

                Text(
                    text =
                        formatShortTime(
                            chronologicalHistory
                                .first()
                                .timestamp
                        ),

                    color =
                        SecondaryText,

                    fontSize =
                        9.sp
                )

                Text(
                    text =
                        formatShortTime(
                            chronologicalHistory
                                .last()
                                .timestamp
                        ),

                    color =
                        SecondaryText,

                    fontSize =
                        9.sp
                )
            }


            Spacer(
                modifier =
                    Modifier.height(4.dp)
            )


            Row(
                modifier =
                    Modifier.fillMaxWidth(),

                horizontalArrangement =
                    Arrangement.SpaceBetween
            ) {

                Text(
                    text =
                        "OLDEST",

                    color =
                        SecondaryText,

                    fontSize =
                        8.sp
                )

                Text(
                    text =
                        "NEWEST",

                    color =
                        SecondaryText,

                    fontSize =
                        8.sp
                )
            }
        }
    }
}


// ============================================================
// HISTORY CARD
// ============================================================

@Composable
fun CellHistoryCard(
    reading: BatteryHistory,
    cellNumber: Int
) {

    val voltage =
        when (cellNumber) {

            1 ->
                reading.cell1Voltage

            2 ->
                reading.cell2Voltage

            else ->
                reading.cell3Voltage
        }


    val warning =
        voltage < 3.0


    val statusColor =
        if (warning)
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
                        formatTimestamp(
                            reading.timestamp
                        ),

                    color =
                        SecondaryText,

                    fontSize =
                        11.sp
                )

                Spacer(
                    modifier =
                        Modifier.height(5.dp)
                )

                Text(
                    text =
                        "CELL $cellNumber",

                    color =
                        White,

                    fontSize =
                        10.sp,

                    fontWeight =
                        FontWeight.Bold
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

                    fontSize =
                        18.sp,

                    fontWeight =
                        FontWeight.Bold
                )

                Text(
                    text =
                        if (warning)
                            "WARNING"
                        else
                            "NORMAL",

                    color =
                        statusColor,

                    fontSize =
                        9.sp,

                    fontWeight =
                        FontWeight.Bold
                )
            }
        }
    }
}


// ============================================================
// CONNECTION CARD
// ============================================================

@Composable
fun StatusCard(
    connected: Boolean
) {

    val statusColor =
        if (connected)
            Green
        else
            Red


    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                CardBackground,
                RoundedCornerShape(16.dp)
            )
            .padding(16.dp)
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
                        statusColor,
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
                        if (connected)
                            "LIVE DATA CONNECTED"
                        else
                            "CONNECTION ERROR",

                    color =
                        White,

                    fontWeight =
                        FontWeight.Bold,

                    fontSize =
                        14.sp
                )

                Text(
                    text =
                        if (connected)
                            "Firebase realtime monitoring active"
                        else
                            "Unable to receive live data",

                    color =
                        SecondaryText,

                    fontSize =
                        11.sp
                )
            }
        }
    }
}


// ============================================================
// BATTERY CONDITION
// ============================================================

@Composable
fun BatteryConditionCard(
    status: String,
    statusColor: Color
) {

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                CardBackground,
                RoundedCornerShape(18.dp)
            )
            .padding(20.dp)
    ) {

        Column {

            Text(
                text =
                    "BATTERY CONDITION",

                color =
                    SecondaryText,

                fontSize =
                    11.sp,

                letterSpacing =
                    1.sp
            )

            Spacer(
                modifier =
                    Modifier.height(8.dp)
            )

            Text(
                text =
                    status,

                color =
                    statusColor,

                fontSize =
                    22.sp,

                fontWeight =
                    FontWeight.Bold
            )
        }
    }
}


// ============================================================
// TOTAL VOLTAGE
// ============================================================

@Composable
fun VoltageCard(
    voltage: Double
) {

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                CardBackground,
                RoundedCornerShape(20.dp)
            )
            .padding(24.dp)
    ) {

        Column {

            Text(
                text =
                    "TOTAL VOLTAGE",

                color =
                    SecondaryText,

                fontSize =
                    11.sp,

                letterSpacing =
                    1.sp
            )

            Spacer(
                modifier =
                    Modifier.height(6.dp)
            )

            Text(
                text =
                    String.format(
                        Locale.US,
                        "%.3f V",
                        voltage
                    ),

                color =
                    White,

                fontSize =
                    42.sp,

                fontWeight =
                    FontWeight.Bold
            )
        }
    }
}


// ============================================================
// SECTION TITLE
// ============================================================

@Composable
fun SectionTitle(
    title: String
) {

    Text(
        text =
            title,

        color =
            White,

        fontSize =
            18.sp,

        fontWeight =
            FontWeight.Bold
    )
}


// ============================================================
// CELL CARD
// ============================================================

@Composable
fun CellCard(
    title: String,
    voltage: Double,
    warning: Boolean,
    modifier: Modifier,
    onClick: () -> Unit
) {

    val statusColor =
        if (warning)
            Red
        else
            Green


    Box(
        modifier = modifier
            .background(
                CardBackground,
                RoundedCornerShape(16.dp)
            )
            .clickable(
                onClick = onClick
            )
            .padding(13.dp)
    ) {

        Column {

            Text(
                text =
                    title,

                color =
                    SecondaryText,

                fontSize =
                    10.sp
            )

            Spacer(
                modifier =
                    Modifier.height(7.dp)
            )

            Text(
                text =
                    String.format(
                        Locale.US,
                        "%.3f V",
                        voltage
                    ),

                color =
                    White,

                fontSize =
                    15.sp,

                fontWeight =
                    FontWeight.Bold
            )

            Spacer(
                modifier =
                    Modifier.height(6.dp)
            )

            Text(
                text =
                    if (warning)
                        "WARNING"
                    else
                        "NORMAL",

                color =
                    statusColor,

                fontSize =
                    9.sp,

                fontWeight =
                    FontWeight.Bold
            )

            Spacer(
                modifier =
                    Modifier.height(5.dp)
            )

            Text(
                text =
                    "VIEW →",

                color =
                    SecondaryText,

                fontSize =
                    8.sp
            )
        }
    }
}


// ============================================================
// WIDE INFORMATION CARD
// ============================================================

@Composable
fun InfoWideCard(
    title: String,
    value: String,
    status: String
) {

    val statusColor =
        when (status) {

            "CRITICAL" ->
                Red

            "WARNING" ->
                Orange

            else ->
                Green
        }


    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                CardBackground,
                RoundedCornerShape(16.dp)
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
                        title,

                    color =
                        SecondaryText,

                    fontSize =
                        10.sp
                )

                Spacer(
                    modifier =
                        Modifier.height(5.dp)
                )

                Text(
                    text =
                        value,

                    color =
                        White,

                    fontSize =
                        20.sp,

                    fontWeight =
                        FontWeight.Bold
                )
            }


            Text(
                text =
                    status,

                color =
                    statusColor,

                fontSize =
                    10.sp,

                fontWeight =
                    FontWeight.Bold
            )
        }
    }
}


// ============================================================
// SMALL INFORMATION CARD
// ============================================================

@Composable
fun InfoCard(
    title: String,
    value: String,
    warning: Boolean,
    modifier: Modifier
) {

    val statusColor =
        if (warning)
            Red
        else
            Green


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
                text =
                    title,

                color =
                    SecondaryText,

                fontSize =
                    9.sp
            )

            Spacer(
                modifier =
                    Modifier.height(5.dp)
            )

            Text(
                text =
                    value,

                color =
                    White,

                fontSize =
                    13.sp,

                fontWeight =
                    FontWeight.Bold
            )

            Spacer(
                modifier =
                    Modifier.height(4.dp)
            )

            Text(
                text =
                    if (warning)
                        "HIGH"
                    else
                        "NORMAL",

                color =
                    statusColor,

                fontSize =
                    8.sp,

                fontWeight =
                    FontWeight.Bold
            )
        }
    }
}