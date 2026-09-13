# SplitVideo Mobile

Native mobile companion app for SplitVideo.in.

## Architecture
- React Native + Expo
- Local-first video processing
- Android: Media3 Transformer (native module, Phase 2)
- iOS: AVFoundation (native module, Phase 2)
- Vercel remains the web/backend layer

## V1 goals
- Select a local video
- Display metadata and preview
- Choose split mode: duration or equal parts
- Choose crop: Original, 9:16, 1:1, Custom
- Validate jobs before native processing
- Keep processing local on-device

The native processing bridge is intentionally isolated behind `src/native/videoEngine.ts` so the UI does not depend on a specific implementation.
