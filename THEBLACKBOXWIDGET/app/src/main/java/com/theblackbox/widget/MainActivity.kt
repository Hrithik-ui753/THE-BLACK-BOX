package com.theblackbox.widget

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.theblackbox.widget.ui.theme.THEBLACKBOXWIDGETTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        BatterySyncWorker.start(this)

        setContent {
            THEBLACKBOXWIDGETTheme {
                val batteryState by BatteryRepository.batteryFlow().collectAsState(initial = BatteryState())
                val rootKeys by BatteryRepository.discoveredKeys.collectAsState()
                val subKeys by BatteryRepository.subKeys.collectAsState()

                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    BatteryDetails(
                        state = batteryState,
                        rootKeys = rootKeys,
                        subKeys = subKeys,
                        modifier = Modifier
                            .padding(innerPadding)
                            .fillMaxSize()
                            .background(Color.Black)
                            .padding(16.dp)
                            .verticalScroll(rememberScrollState())
                    )
                }
            }
        }
    }
}

@Composable
fun BatteryDetails(
    state: BatteryState, 
    rootKeys: List<String>, 
    subKeys: List<String>, 
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text("THE BLACK BOX", style = MaterialTheme.typography.headlineMedium, color = Color.White)
        Text("LIVE TELEMETRY", style = MaterialTheme.typography.titleSmall, color = Color.Gray)
        
        HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp), color = Color.DarkGray)

        Text("Cell 1: ${state.cell1Voltage} V", color = Color.White)
        Text("Cell 2: ${state.cell2Voltage} V", color = Color.White)
        Text("Cell 3: ${state.cell3Voltage} V", color = Color.White)
        
        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color.DarkGray)
        
        Text("Total Pack: ${state.totalVoltage} V", color = Color.White)
        Text("Temperature: ${state.temperature} °C", color = Color.White)
        Text("Ambient: ${state.ambientTemperature} °C", color = Color.White)
        Text("Gas: ${state.gas}", color = Color.White)
        
        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color.DarkGray)
        
        Text("SOH: ${state.soh?.let { "%.0f%%".format(it) } ?: "N/A"}", color = Color.White)
        Text("Current Cycle: ${state.currentCycle?.let { "%.0f".format(it) } ?: "N/A"}", color = Color.White)
        Text("Predicted RUL: ${state.predictedRulCycles?.let { "%.0f cycles".format(it) } ?: "N/A"}", color = Color.White)
        Text("Usage Rate: ${state.averageCyclesPerDay?.let { "%.2f cycles/day".format(it) } ?: "N/A"}", color = Color.White)
        Text("Est. Remaining Life: ${state.estimatedRemainingDays?.let { "~%.0f DAYS".format(it) } ?: "N/A"}", color = if (state.estimatedRemainingDays != null && state.estimatedRemainingDays > 30) Color.Green else Color.Yellow)
        Text("Timestamp: ${state.timestamp}", color = Color.Gray)

        HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp), color = Color.DarkGray)
        
        Text("DEBUG INFO", style = MaterialTheme.typography.labelLarge, color = Color.Yellow)
        
        if (rootKeys.isEmpty()) {
            Text("Connection: SEARCHING...", color = Color.Yellow)
        } else {
            Text("Connection: CONNECTED", color = Color.Green)
            Text("Root Folders: ${rootKeys.joinToString(", ")}", color = Color.Cyan)
            
            if (state.dataPath.isNotEmpty()) {
                Text("Data Path: ${state.dataPath}", color = Color.Magenta)
            }

            if (subKeys.isNotEmpty()) {
                Text("Sub-keys Found: ${subKeys.joinToString(", ")}", color = Color.Cyan)
            }

            if (state.timestamp.isEmpty()) {
                Text("Status: ${if (state.dataPath == "PATH MISMATCH") "PATH MISMATCH" else "DATA NOT MATCHED"}", color = Color.Red)
                Text("Check if 'totalVoltage' or 'cell1 voltage' exists.", color = Color.Gray)
            } else {
                Text("Status: DATA SYNCED", color = Color.Green)
            }
        }
    }
}
