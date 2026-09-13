# SplitVideo Mobile

Native-first SplitVideo app for iOS and Android.

## Architecture

- React Native + Expo Router for UI/navigation.
- Expo development builds for native dependencies.
- Android: Jetpack Media3 Transformer 1.11.0.
- iOS: AVFoundation.
- Processing is local-first. V1 does not upload source videos to SplitVideo.
- The JavaScript layer never loads the whole video into memory.

## V1 capabilities

- Local video picker
- Large-file-safe URI flow (target up to 1 GB; actual limits depend on device storage and codec)
- Split by duration: 15 / 30 / 60 / 90 / 120 / custom
- Split into equal parts: 2 / 4 / 6 / 10 / custom
- Crop: Original / 9:16 / 1:1 / custom
- Audio preservation
- Native export

## Native engine

The React Native UI calls `src/native/videoEngine.ts`. That stable interface is implemented by the local Expo module in `modules/split-video-engine`.

- Android uses Media3 Transformer for clipping and crop effects.
- iOS uses AVFoundation for clipping, composition and crop.
- No fake processing path is used: if the native module is missing, the app reports that a development build is required.

## Cloud build

EAS is configured in `eas.json` with development, preview and production profiles.

From the `mobile` directory:

```bash
npm install
npx expo install --fix
npx expo-doctor
npx eas build --profile development --platform ios
npx eas build --profile development --platform android
```

A development build is required because SplitVideo uses custom native modules. Expo Go is not sufficient for the native video engine.

## Quality rule

Simple splitting should use the platform's most efficient path when possible. Crop and other pixel transformations require re-encoding. The app must never claim lossless output when a transformation requires encoding.

## Branch

`mobile-v1`

The existing web application remains separate and the Shopify theme is not touched by this mobile work.
