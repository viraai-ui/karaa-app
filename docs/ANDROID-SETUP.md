# Android local setup

## Current host prerequisite

Android SDK tooling must be installed and configured before a local Android build or emulator check can run. Karaa QA is PC-only: emulator rendering and API/runtime checks are valid evidence; no physical-device, camera, GPS, installation, or deep-link claims are in scope.

## Install and configure

1. Install **Android Studio** from the official Android developer site.
2. In Android Studio, open **SDK Manager** and install:
   - Android SDK **Platform 35**;
   - Android SDK **Build-Tools 35.0.0**;
   - Android SDK **Platform-Tools**;
   - **Android SDK Command-line Tools (latest)**;
   - Android **Emulator**.
3. Add these exports to the shell profile used to run the demo, then open a new terminal (or source the profile):

   ```bash
   export ANDROID_HOME="$HOME/Android/Sdk"
   export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
   ```

4. Accept SDK licenses and confirm the installed tools:

   ```bash
   adb version
   sdkmanager --licenses
   ```

5. Create and start an Android Emulator from Android Studio for PC-only development and rendered QA.

## PC-only evidence boundary

Use the emulator to verify the rendered app and supported API-backed flows. Do not use this setup guide to claim physical-device camera, GPS, installation, or deep-link validation; those are explicitly outside the current demo QA scope.
