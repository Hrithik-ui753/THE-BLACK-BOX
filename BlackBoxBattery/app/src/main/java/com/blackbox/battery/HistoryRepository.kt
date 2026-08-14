package com.blackbox.battery

import com.google.firebase.database.*

class HistoryRepository {

    private val database =
        FirebaseDatabase.getInstance()

    private val historyReference =
        database.getReference("battery/history")

    fun loadHistory(
        onDataLoaded: (List<BatteryHistory>) -> Unit,
        onError: (String) -> Unit
    ) {

        historyReference
            .limitToLast(50)
            .addListenerForSingleValueEvent(
                object : ValueEventListener {

                    override fun onDataChange(
                        snapshot: DataSnapshot
                    ) {

                        try {

                            val historyList =
                                mutableListOf<BatteryHistory>()

                            for (entry in snapshot.children) {

                                val history =
                                    BatteryHistory(

                                        ambientTemperature =
                                            entry.child(
                                                "ambientTemperature"
                                            ).getValue(
                                                Double::class.java
                                            ) ?: 0.0,

                                        cell1Voltage =
                                            entry.child(
                                                "cell1 voltage"
                                            ).getValue(
                                                Double::class.java
                                            ) ?: 0.0,

                                        cell2Voltage =
                                            entry.child(
                                                "cell2 voltage"
                                            ).getValue(
                                                Double::class.java
                                            ) ?: 0.0,

                                        cell3Voltage =
                                            entry.child(
                                                "cell3 voltage"
                                            ).getValue(
                                                Double::class.java
                                            ) ?: 0.0,

                                        gas =
                                            entry.child("gas")
                                                .getValue(
                                                    Double::class.java
                                                ) ?: 0.0,

                                        temperature =
                                            entry.child("temperature")
                                                .getValue(
                                                    Double::class.java
                                                ) ?: 0.0,

                                        timestamp =
                                            entry.child("timestamp")
                                                .getValue(
                                                    String::class.java
                                                ) ?: "",

                                        totalVoltage =
                                            entry.child("totalVoltage")
                                                .getValue(
                                                    Double::class.java
                                                ) ?: 0.0
                                    )

                                historyList.add(history)
                            }

                            onDataLoaded(historyList.reversed())

                        } catch (e: Exception) {

                            onError(
                                e.message
                                    ?: "Unable to read history"
                            )
                        }
                    }

                    override fun onCancelled(
                        error: DatabaseError
                    ) {

                        onError(error.message)
                    }
                }
            )
    }
}