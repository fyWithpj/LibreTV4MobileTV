# LibreTV Android mobile source

This branch contains the mobile Android wrapper and its bundled LibreTV web assets.

The baked-in provider list is empty. Add playback providers locally after building. APKs, generated build outputs, signing keys, playlists, and credentials are excluded.

The PowerShell build script reads the Android SDK and signing configuration from environment variables. Keep the signing keystore and its credentials outside this repository.
