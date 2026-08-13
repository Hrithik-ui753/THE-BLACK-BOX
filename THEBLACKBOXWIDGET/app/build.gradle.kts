plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.google.services)
}

android {
    namespace = "com.theblackbox.widget"

    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "com.theblackbox.widget"
        minSdk = 26
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner =
            "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            optimization {
                enable = false
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    buildFeatures {
        compose = true
    }
}

dependencies {

    // ========================================================
    // COMPOSE
    // ========================================================

    implementation(
        platform(libs.androidx.compose.bom)
    )

    implementation(
        libs.androidx.activity.compose
    )

    implementation(
        libs.androidx.compose.material3
    )

    implementation(
        libs.androidx.compose.ui
    )

    implementation(
        libs.androidx.compose.ui.graphics
    )

    implementation(
        libs.androidx.compose.ui.tooling.preview
    )

    // ========================================================
    // ANDROID
    // ========================================================

    implementation(
        libs.androidx.core.ktx
    )

    implementation(
        libs.androidx.lifecycle.runtime.ktx
    )

    implementation(
        libs.androidx.work.runtime.ktx
    )

    implementation(
        libs.androidx.datastore.preferences
    )

    // ========================================================
    // GLANCE
    // ========================================================

    implementation(
        "androidx.glance:glance-appwidget:1.1.1"
    )

    // ========================================================
    // FIREBASE
    // ========================================================

    implementation(
        platform(
            "com.google.firebase:firebase-bom:34.5.0"
        )
    )

    implementation(
        "com.google.firebase:firebase-database"
    )

    // ========================================================
    // TESTING
    // ========================================================

    testImplementation(
        libs.junit
    )

    androidTestImplementation(
        libs.androidx.compose.ui.test.junit4
    )

    androidTestImplementation(
        libs.androidx.espresso.core
    )

    androidTestImplementation(
        libs.androidx.junit
    )

    debugImplementation(
        libs.androidx.compose.ui.test.manifest
    )

    debugImplementation(
        libs.androidx.compose.ui.tooling
    )
}