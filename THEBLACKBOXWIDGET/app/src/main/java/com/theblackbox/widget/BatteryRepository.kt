package com.theblackbox.widget

import android.util.Log
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

object BatteryRepository {

    private const val TAG = "BatteryRepository"

    private const val DATABASE_URL = "https://battery-health-life-default-rtdb.asia-southeast1.firebasedatabase.app"
    private val database = FirebaseDatabase.getInstance(DATABASE_URL)

    private val _discoveredKeys = MutableStateFlow<List<String>>(emptyList())
    val discoveredKeys: StateFlow<List<String>> = _discoveredKeys.asStateFlow()

    private val _subKeys = MutableStateFlow<List<String>>(emptyList())
    val subKeys: StateFlow<List<String>> = _subKeys.asStateFlow()

    fun batteryFlow(): Flow<BatteryState> = callbackFlow {
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val roots = snapshot.children.mapNotNull { it.key }
                _discoveredKeys.value = roots

                val state = findAndParseBatteryState(snapshot)
                if (state != null) {
                    trySend(state)
                } else {
                    trySend(BatteryState(dataPath = "PATH MISMATCH"))
                }
            }

            override fun onCancelled(error: DatabaseError) {
                Log.e(TAG, "Firebase Error: ${error.message}")
                close(error.toException())
            }
        }

        val rootRef = database.reference
        rootRef.addValueEventListener(listener)

        awaitClose {
            rootRef.removeEventListener(listener)
        }
    }

    suspend fun fetchLatestOnce(): BatteryState? {
        return try {
            val snapshot = database.reference.get().await()
            findAndParseBatteryState(snapshot)
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching latest data: ${e.message}")
            null
        }
    }

    private fun findAndParseBatteryState(snapshot: DataSnapshot): BatteryState? {
        if (snapshot.hasChild("totalVoltage") || snapshot.hasChild("cell1 voltage")) {
            val state = parseBatteryState(snapshot, snapshot)
            val path = snapshot.ref.toString().removePrefix(DATABASE_URL)
            _subKeys.value = snapshot.children.mapNotNull { it.key }
            return state.copy(dataPath = path)
        }

        if (snapshot.hasChildren()) {
            val children = snapshot.children.toList()

            val telemetryChildren = children.filter { 
                it.hasChild("totalVoltage") || it.hasChild("cell1 voltage") 
            }

            if (telemetryChildren.isNotEmpty()) {
                val latestChild = telemetryChildren.maxByOrNull { 
                    it.child("timestamp").getValue(String::class.java) ?: it.key ?: "" 
                }
                if (latestChild != null) {
                    val state = parseBatteryState(latestChild, snapshot)
                    val path = latestChild.ref.toString().removePrefix(DATABASE_URL)
                    _subKeys.value = latestChild.children.mapNotNull { it.key }
                    return state.copy(dataPath = path)
                }
            }

            for (child in children) {
                val found = findAndParseBatteryState(child)
                if (found != null) return found
            }
        }

        return null
    }

    private fun parseBatteryState(snapshot: DataSnapshot, parentSnapshot: DataSnapshot? = null): BatteryState {
        fun getDoubleOpt(key: String): Double? {
            val child = snapshot.child(key)
            if (!child.exists()) return null
            return when (val value = child.value) {
                is Number -> value.toDouble()
                is String -> value.toDoubleOrNull()
                else -> null
            }
        }

        fun getDouble(key: String): Double = getDoubleOpt(key) ?: 0.0

        val currentCycle = getDoubleOpt("currentCycle")
            ?: getDoubleOpt("current_cycle")
            ?: getDoubleOpt("cycleCount")
            ?: getDoubleOpt("cycle_count")
            ?: getDoubleOpt("cycle")

        val predictedRulCycles = getDoubleOpt("predictedRulCycles")
            ?: getDoubleOpt("predicted_rul_cycles")
            ?: getDoubleOpt("rulCycles")
            ?: getDoubleOpt("rul_cycles")
            ?: getDoubleOpt("rul")

        val predictedEOLCycle = getDoubleOpt("predictedEOLCycle")
            ?: getDoubleOpt("predicted_eol_cycle")
            ?: getDoubleOpt("eol_cycle")

        var avgCyclesPerDay = getDoubleOpt("averageCyclesPerDay")
            ?: getDoubleOpt("avg_cycles_per_day")
            ?: getDoubleOpt("cycles_per_day")

        if (avgCyclesPerDay == null && parentSnapshot != null) {
            avgCyclesPerDay = calculateAvgCyclesFromHistory(parentSnapshot)
        }

        val remainingCycles: Double? = when {
            predictedRulCycles != null -> predictedRulCycles
            predictedEOLCycle != null && currentCycle != null -> predictedEOLCycle - currentCycle
            else -> null
        }

        val estimatedDays = if (remainingCycles != null && remainingCycles > 0.0 && avgCyclesPerDay != null && avgCyclesPerDay > 0.0) {
            remainingCycles / avgCyclesPerDay
        } else {
            null
        }

        return BatteryState(
            cell1Voltage = getDouble("cell1 voltage"),
            cell2Voltage = getDouble("cell2 voltage"),
            cell3Voltage = getDouble("cell3 voltage"),
            totalVoltage = getDouble("totalVoltage"),
            temperature = getDouble("temperature"),
            ambientTemperature = getDouble("ambientTemperature"),
            gas = getDouble("gas"),
            timestamp = snapshot.child("timestamp").getValue(String::class.java) ?: "",
            soh = getDoubleOpt("soh"),
            currentCycle = currentCycle,
            predictedRulCycles = predictedRulCycles,
            predictedEOLCycle = predictedEOLCycle,
            averageCyclesPerDay = avgCyclesPerDay,
            estimatedRemainingDays = estimatedDays
        )
    }

    private fun calculateAvgCyclesFromHistory(parentSnapshot: DataSnapshot?): Double? {
        if (parentSnapshot == null || !parentSnapshot.hasChildren()) return null
        return try {
            val items = parentSnapshot.children.mapNotNull { child ->
                val tsStr = child.child("timestamp").getValue(String::class.java)
                val c = child.child("currentCycle").getValue(Double::class.java)
                    ?: child.child("cycleCount").getValue(Double::class.java)
                    ?: child.child("cycle").getValue(Double::class.java)
                if (tsStr != null && c != null) {
                    Pair(tsStr, c)
                } else null
            }

            if (items.size < 2) return null

            val formatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME
            val parsedItems = items.mapNotNull { (tsStr, c) ->
                try {
                    val dt = OffsetDateTime.parse(tsStr, formatter)
                    Pair(dt, c)
                } catch (_: Exception) { null }
            }.sortedBy { it.first }

            if (parsedItems.size < 2) return null

            val oldest = parsedItems.first()
            val newest = parsedItems.last()

            val minutes = ChronoUnit.MINUTES.between(oldest.first, newest.first)
            val days = minutes / (60.0 * 24.0)

            if (days < 0.04) return null

            val cycleDelta = newest.second - oldest.second
            if (cycleDelta < 0) return null

            cycleDelta / days
        } catch (_: Exception) {
            null
        }
    }
}
