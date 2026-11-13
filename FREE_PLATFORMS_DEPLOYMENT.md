# 🆓 Deploying SmartTask on Free Android Platforms (F-Droid, itch.io & GitHub)

This guide explains how to deploy and distribute **SmartTask** on free, open alternative Android platforms where users can install the application without requiring Google Play Console paid developer accounts.

---

## 🟢 Platform 1: F-Droid (The Free & Open Source Android App Store)

**F-Droid** is the largest and most respected free/open-source alternative to the Google Play Store.

### How F-Droid Works:
- F-Droid builds apps directly from source code hosted on GitHub (`https://github.com/rakibhasanshuvo712-hub/smarttask-reminder`).
- There are **no registration fees** ($0 forever).
- Any Android user with the F-Droid app installed can search for "SmartTask" and install it with automatic updates!

### Submission Steps:
1. We have already prepared the official F-Droid build recipe at:
   [fdroid/com.smarttask.app.yml](file:///C:/Users/Rakib/.gemini/antigravity/scratch/smart-task/fdroid/com.smarttask.app.yml)
2. Fork the official F-Droid data repository on GitLab:
   👉 [https://gitlab.com/fdroid/fdroiddata](https://gitlab.com/fdroid/fdroiddata)
3. Add `metadata/com.smarttask.app.yml` into your fork with the contents of our recipe file.
4. Create a **Merge Request** to `fdroid/fdroiddata`.
5. Once merged, F-Droid's automated build bot compiles the APK and lists SmartTask in the F-Droid client worldwide!

---

## 🔴 Platform 2: itch.io (Free App & Game Distribution Platform)

**itch.io** allows independent creators to publish Android apps, tools, and HTML5 web apps completely free of charge.

### How to Publish SmartTask on itch.io:

1. **Sign In**: Go to [https://itch.io](https://itch.io) and register or sign in.
2. **Create a New Project**:
   - Go to **Dashboard > Create new project**.
   - **Title**: `SmartTask – Smart Task Reminder & Deadline System`
   - **Project URL**: `smarttask` (e.g. `https://your-username.itch.io/smarttask`)
   - **Short Description**: `Smart task reminder and deadline manager in Bangladesh Standard Time (BST, UTC+6) with native phone alarms.`
   - **Classification**: Select **Tool** (or Game).
   - **Kind of Project**: Select **HTML** (You have an executable that will be played in the browser) and **Downloadable**.
3. **Upload the Web & Android Files**:
   - **HTML5 Web App**: Upload the bundled zip file:
     📁 `smarttask-itch-web.zip` (Check: *"This file will be played in the browser"*).
   - **Android APK**: Under **Uploads**, upload `SmartTask.apk` and check the **Android** platform icon.
4. **Pricing**:
   - Select **$0 or donate** (Free to download).
5. **Tags**:
   - Add tags: `productivity`, `android`, `tools`, `task-manager`, `bangladesh`, `pwa`.
6. **Visibility**:
   - Change from *Draft* to **Public** and click **Save & View Page**!

Your app is now live on itch.io with both an in-browser runnable version and a downloadable Android package!

---

## 🐙 Platform 3: GitHub Releases (Direct Free APK Download)

You can distribute Android APKs directly from your GitHub repository with zero third-party platform approval delays:

1. Go to your repository:
   👉 [https://github.com/rakibhasanshuvo712-hub/smarttask-reminder/releases](https://github.com/rakibhasanshuvo712-hub/smarttask-reminder/releases)
2. Click **Draft a new release**.
3. Tag version: `v1.0.0`
4. Release title: `SmartTask Android Release v1.0.0`
5. Attach your built `SmartTask.apk`.
6. Click **Publish release**.

Android users can download and install the `.apk` directly onto their phones!

---

## ⚡ Summary of All Deployment Channels

| Channel | Platform Type | Cost | User Experience |
|---|---|---|---|
| **Vercel PWA** | Web & Android PWA | Free | Instant 1-click install from browser to home screen |
| **itch.io** | Indie App Store | Free | Direct APK download + web emulator |
| **F-Droid** | Open Source Android App Store | Free | Native updates through F-Droid client |
| **GitHub Releases** | Developer Hub | Free | Direct APK download link |
| **Google Play** | Official Android Store | $25 1-time | Global Play Store listing & automatic updates |
