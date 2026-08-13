package com.theblackbox.widget

import android.content.Context
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.flow.collectLatest

class BatterySyncWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val WORK_NAME = "BatterySyncWorker"

        val KEY_CELL1 = doublePreferencesKey("cell1")
        val KEY_CELL2 = doublePreferencesKey("cell2")
        val KEY_CELL3 = doublePreferencesKey("cell3")
        val KEY_TOTAL = doublePreferencesKey("total")
        val KEY_TEMP = doublePreferencesKey("temp")
        val KEY_AMBIENT = doublePreferencesKey("ambient")
        val KEY_GAS = doublePreferencesKey("gas")
        val KEY_TIMESTAMP = stringPreferencesKey("timestamp")
        val KEY_SOH = doublePreferencesKey("soh")
        val KEY_CURRENT_CYCLE = doublePreferencesKey("current_cycle")
        val KEY_PREDICTED_RUL = doublePreferencesKey("predicted_rul")
        val KEY_AVG_CYCLES_PER_DAY = doublePreferencesKey("avg_cycles_per_day")
        val KEY_ESTIMATED_DAYS = doublePreferencesKey("estimated_days")

        fun start(context: Context) {
            val request = OneTimeWorkRequestBuilder<BatterySyncWorker>().build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                request
            )
        }
    }

    override suspend fun doWork(): Result {
        try {
            val latest = BatteryRepository.fetchLatestOnce()
            latest?.let { updateWidgetState(it) }

            BatteryRepository.batteryFlow().collectLatest { state ->
                updateWidgetState(state)
            }
        } catch (_: Exception) {
            return Result.retry()
        }
        return Result.success()
    }

    private suspend fun updateWidgetState(state: BatteryState) {
        val manager = GlanceAppWidgetManager(context)
        val glanceIds = manager.getGlanceIds(BmsWidget::class.java)

        glanceIds.forEach { glanceId ->
            updateAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId) { prefs ->
                prefs.toMutablePreferences().apply {
                    this[KEY_CELL1] = state.cell1Voltage
                    this[KEY_CELL2] = state.cell2Voltage
                    this[KEY_CELL3] = state.cell3Voltage
                    this[KEY_TOTAL] = state.totalVoltage
                    this[KEY_TEMP] = state.temperature
                    this[KEY_AMBIENT] = state.ambientTemperature
                    this[KEY_GAS] = state.gas
                    this[KEY_TIMESTAMP] = state.timestamp
                    state.soh?.let { this[KEY_SOH] = it } ?: remove(KEY_SOH)
                    state.currentCycle?.let { this[KEY_CURRENT_CYCLE] = it } ?: remove(KEY_CURRENT_CYCLE)
                    state.predictedRulCycles?.let { this[KEY_PREDICTED_RUL] = it } ?: remove(KEY_PREDICTED_RUL)
                    state.averageCyclesPerDay?.let { this[KEY_AVG_CYCLES_PER_DAY] = it } ?: remove(KEY_AVG_CYCLES_PER_DAY)
                    state.estimatedRemainingDays?.let { this[KEY_ESTIMATED_DAYS] = it } ?: remove(KEY_ESTIMATED_DAYS)
                }
            }
            BmsWidget().update(context, glanceId)
        }
    }
}
