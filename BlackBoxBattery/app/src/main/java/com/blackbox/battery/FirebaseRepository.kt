package com.blackbox.battery

import com.google.firebase.database.*

class FirebaseRepository {

    private val database =
        FirebaseDatabase.getInstance()

    private val liveReference =
        database.getReference("battery/live")

    fun observeBatteryData(
        onDataChanged: (BatteryData) -> Unit,
        onError: (String) -> Unit
    ) {

        liveReference.addValueEventListener(
            object : ValueEventListener {

                override fun onDataChange(snapshot: DataSnapshot) {

                    try {

                        val data = BatteryData(

                            ambientTemperature =
                                snapshot.child("ambientTemperature")
                                    .getValue(Double::class.java) ?: 0.0,

                            cell1Voltage =
                                snapshot.child("cell1 voltage")
                                    .getValue(Double::class.java) ?: 0.0,

                            cell2Voltage =
                                snapshot.child("cell2 voltage")
                                    .getValue(Double::class.java) ?: 0.0,

                            cell3Voltage =
                                snapshot.child("cell3 voltage")
                                    .getValue(Double::class.java) ?: 0.0,

                            gas =
                                snapshot.child("gas")
                                    .getValue(Double::class.java) ?: 0.0,

                            temperature =
                                snapshot.child("temperature")
                                    .getValue(Double::class.java) ?: 0.0,

                            timestamp =
                                snapshot.child("timestamp")
                                    .getValue(String::class.java) ?: "",

                            totalVoltage =
                                snapshot.child("totalVoltage")
                                    .getValue(Double::class.java) ?: 0.0
                        )

                        onDataChanged(data)

                    } catch (e: Exception) {

                        onError(
                            e.message ?: "Unknown Firebase error"
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