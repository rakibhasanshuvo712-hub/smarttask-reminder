# SmartTask Android Application

This directory contains the complete native Android application generated via Capacitor for **SmartTask**.

## Package Information
- **App Name**: SmartTask
- **Package ID**: `com.smarttask.app`
- **Main Activity**: `com.smarttask.app.MainActivity`
- **Config**: `capacitor.config.ts`

## 🛠️ How to Build & Run

### 1. Open in Android Studio
From the root of `smart-task`, run:
```bash
npx cap open android
```
Or open the `android` directory directly in Android Studio.

### 2. Build APK via Command Line
With JDK 17+ installed:
```bash
cd android
./gradlew assembleDebug
```
The compiled APK will be created at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Run directly on an Android Device or Emulator
```bash
npx cap run android
```

---

## 📱 Progressive Web App (PWA) Direct Installation
SmartTask is also deployed as a full PWA. Any Android device can visit:
👉 **https://smart-task-rust.vercel.app**

And tap **"Install App"** in the header or Chrome's **"Add to Home screen"** to install it immediately with no APK download needed!
