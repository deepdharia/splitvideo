import AVFoundation
import CoreGraphics
import ExpoModulesCore

public class SplitVideoEngineModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SplitVideoEngine")

    AsyncFunction("getVideoInfo") { (inputUri: String) throws -> [String: Any] in
      let asset = try Self.asset(from: inputUri)
      guard let track = asset.tracks(withMediaType: .video).first else {
        throw NSError(domain: "SplitVideoEngine", code: 1, userInfo: [NSLocalizedDescriptionKey: "No video track found."])
      }
      let durationMs = Int(CMTimeGetSeconds(asset.duration) * 1000.0)
      let size = Self.orientedSize(for: track)
      return ["durationMs": durationMs, "width": Int(size.width), "height": Int(size.height)]
    }

    AsyncFunction("exportClip") { (
      inputUri: String,
      startMs: Double,
      endMs: Double,
      cropType: String,
      cropX: Double?,
      cropY: Double?,
      cropWidth: Double?,
      cropHeight: Double?,
      preserveAudio: Bool,
      outputName: String
    ) async throws -> String in
      let sourceAsset = try Self.asset(from: inputUri)
      guard let sourceVideo = sourceAsset.tracks(withMediaType: .video).first else {
        throw NSError(domain: "SplitVideoEngine", code: 2, userInfo: [NSLocalizedDescriptionKey: "No video track found."])
      }

      let sourceDuration = CMTimeGetSeconds(sourceAsset.duration)
      let start = max(0, min(startMs / 1000.0, sourceDuration))
      let end = max(start, min(endMs / 1000.0, sourceDuration))
      let sourceRange = CMTimeRange(
        start: CMTime(seconds: start, preferredTimescale: 600),
        end: CMTime(seconds: end, preferredTimescale: 600)
      )

      let outputURL = FileManager.default.temporaryDirectory.appendingPathComponent(outputName)
      try? FileManager.default.removeItem(at: outputURL)

      let needsComposition = cropType != "original" || !preserveAudio
      let exportAsset: AVAsset
      let videoComposition: AVVideoComposition?
      let exportRange: CMTimeRange

      if needsComposition {
        let composition = AVMutableComposition()
        guard let destinationVideo = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
          throw NSError(domain: "SplitVideoEngine", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not create video composition."])
        }
        try destinationVideo.insertTimeRange(sourceRange, of: sourceVideo, at: .zero)

        if preserveAudio, let sourceAudio = sourceAsset.tracks(withMediaType: .audio).first {
          let destinationAudio = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)
          try destinationAudio?.insertTimeRange(sourceRange, of: sourceAudio, at: .zero)
        }

        let compositionVideo = AVMutableVideoComposition(propertiesOf: composition)
        let oriented = Self.orientedSize(for: sourceVideo)
        let cropRect = Self.cropRect(type: cropType, normalizedX: cropX, normalizedY: cropY, normalizedWidth: cropWidth, normalizedHeight: cropHeight, size: oriented)
        compositionVideo.renderSize = cropType == "original" ? oriented : cropRect.size
        let fps = max(1, Int32(sourceVideo.nominalFrameRate.rounded()))
        compositionVideo.frameDuration = CMTime(value: 1, timescale: fps)

        let instruction = AVMutableVideoCompositionInstruction()
        instruction.timeRange = CMTimeRange(start: .zero, duration: composition.duration)
        let layer = AVMutableVideoCompositionLayerInstruction(assetTrack: destinationVideo)
        layer.setTransform(sourceVideo.preferredTransform, at: .zero)
        if cropType != "original" {
          layer.setCropRectangle(cropRect, at: .zero)
        }
        instruction.layerInstructions = [layer]
        compositionVideo.instructions = [instruction]

        exportAsset = composition
        videoComposition = compositionVideo
        exportRange = CMTimeRange(start: .zero, duration: composition.duration)
      } else {
        exportAsset = sourceAsset
        videoComposition = nil
        exportRange = sourceRange
      }

      guard let exporter = AVAssetExportSession(asset: exportAsset, presetName: AVAssetExportPresetHighestQuality) else {
        throw NSError(domain: "SplitVideoEngine", code: 4, userInfo: [NSLocalizedDescriptionKey: "This video cannot be exported on this device."])
      }

      exporter.outputURL = outputURL
      exporter.outputFileType = .mp4
      exporter.shouldOptimizeForNetworkUse = false
      exporter.timeRange = exportRange
      exporter.videoComposition = videoComposition

      try await exporter.export(to: outputURL, as: .mp4)
      return outputURL.path
    }
  }

  private static func asset(from inputUri: String) throws -> AVAsset {
    guard let url = URL(string: inputUri) else {
      throw NSError(domain: "SplitVideoEngine", code: 10, userInfo: [NSLocalizedDescriptionKey: "Invalid video URI."])
    }
    return AVURLAsset(url: url)
  }

  private static func orientedSize(for track: AVAssetTrack) -> CGSize {
    let rect = CGRect(origin: .zero, size: track.naturalSize).applying(track.preferredTransform)
    return CGSize(width: abs(rect.width), height: abs(rect.height))
  }

  private static func cropRect(type: String, normalizedX: Double?, normalizedY: Double?, normalizedWidth: Double?, normalizedHeight: Double?, size: CGSize) -> CGRect {
    let sourceAspect = size.width / max(size.height, 1)
    let targetAspect: CGFloat
    switch type {
    case "9:16": targetAspect = 9.0 / 16.0
    case "1:1": targetAspect = 1.0
    case "custom": targetAspect = CGFloat((normalizedWidth ?? 1) / max(normalizedHeight ?? 1, 0.0001))
    default: return CGRect(origin: .zero, size: size)
    }

    if type == "custom" {
      return CGRect(
        x: CGFloat(normalizedX ?? 0) * size.width,
        y: CGFloat(normalizedY ?? 0) * size.height,
        width: CGFloat(normalizedWidth ?? 1) * size.width,
        height: CGFloat(normalizedHeight ?? 1) * size.height
      )
    }

    if sourceAspect > targetAspect {
      let width = size.height * targetAspect
      return CGRect(x: (size.width - width) / 2, y: 0, width: width, height: size.height)
    }
    let height = size.width / targetAspect
    return CGRect(x: 0, y: (size.height - height) / 2, width: size.width, height: height)
  }
}
