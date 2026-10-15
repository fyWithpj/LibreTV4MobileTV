# LibreTV service + Android TV 1.0.2 source

This branch groups the LibreTV service source with an Android TV wrapper source tree for the 1.0.2 deployment.

- `service/` contains the service source.
- `tv-android/` contains the Android TV wrapper project; its version metadata is set to 1.0.2.

The exact editable snapshot used to produce the locally archived 1.0.2 APK was not present in the workspace, so the wrapper here is the clean project source baseline with the release version label aligned. The APK itself is not included.

Configured live/VOD provider lists, M3U playlists, local environment files, databases, signing keys, and passwords are excluded. Built-in VOD defaults are empty; add provider URLs privately in your deployment configuration.
