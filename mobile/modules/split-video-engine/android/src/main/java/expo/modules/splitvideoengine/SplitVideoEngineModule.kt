package expo.modules.splitvideoengine

import android.content.Context
import android.media.MediaMetadataRetriever
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.effect.Crop
import androidx.media3.effect.Effects
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.Transformer
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import java.io.File

@OptIn(UnstableApi::class)
class SplitVideoEngineModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("SplitVideoEngine")

    AsyncFunction("getVideoInfo") Coroutine { inputUri: String ->
      val retriever = MediaMetadataRetriever()
      try {
        retriever.setDataSource(context, Uri.parse(inputUri))
        val duration = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
        val width = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull() ?: 0
        val height = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull() ?: 0
        mapOf("durationMs" to duration, "width" to width, "height" to height)
      } finally {
        retriever.release()
      }
    }

    AsyncFunction("exportClip") Coroutine { inputUri: String, startMs: Double, endMs: Double, cropType: String, cropX: Double?, cropY: Double?, cropWidth: Double?, cropHeight: Double?, preserveAudio: Boolean, outputName: String ->
      exportClip(inputUri, startMs.toLong(), endMs.toLong(), cropType, cropX, cropY, cropWidth, cropHeight, preserveAudio, outputName)
    }
  }

  private suspend fun exportClip(
    inputUri: String,
    startMs: Long,
    endMs: Long,
    cropType: String,
    cropX: Double?,
    cropY: Double?,
    cropWidth: Double?,
    cropHeight: Double?,
    preserveAudio: Boolean,
    outputName: String,
  ): String = suspendCancellableCoroutine { continuation ->
    val outputFile = File(context.cacheDir, outputName).apply { if (exists()) delete() }
    val mediaItem = MediaItem.Builder()
      .setUri(Uri.parse(inputUri))
      .setClippingConfiguration(
        MediaItem.ClippingConfiguration.Builder()
          .setStartPositionMs(startMs)
          .setEndPositionMs(endMs)
          .build()
      )
      .build()

    val videoEffects = mutableListOf<androidx.media3.effect.Effect>()
    if (cropType != "original") {
      val retriever = MediaMetadataRetriever()
      try {
        retriever.setDataSource(context, Uri.parse(inputUri))
        val width = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toFloatOrNull() ?: 1f
        val height = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toFloatOrNull() ?: 1f
        val sourceAspect = width / height
        val targetAspect = when (cropType) {
          "9:16" -> 9f / 16f
          "1:1" -> 1f
          "custom" -> ((cropWidth ?: 1.0) / (cropHeight ?: 1.0)).toFloat()
          else -> sourceAspect
        }
        val widthFraction: Float
        val heightFraction: Float
        if (sourceAspect > targetAspect) {
          widthFraction = targetAspect / sourceAspect
          heightFraction = 1f
        } else {
          widthFraction = 1f
          heightFraction = sourceAspect / targetAspect
        }
        val cx = if (cropType == "custom") (cropX ?: 0.0) + (cropWidth ?: 1.0) / 2.0 else 0.5
        val cy = if (cropType == "custom") (cropY ?: 0.0) + (cropHeight ?: 1.0) / 2.0 else 0.5
        val halfW = widthFraction / 2f
        val halfH = heightFraction / 2f
        val centerX = (cx * 2.0 - 1.0).toFloat()
        val centerY = (cy * 2.0 - 1.0).toFloat()
        videoEffects.add(Crop(centerX - halfW, centerX + halfW, centerY - halfH, centerY + halfH))
      } finally {
        retriever.release()
      }
    }

    val editedBuilder = EditedMediaItem.Builder(mediaItem).setRemoveAudio(!preserveAudio)
    if (videoEffects.isNotEmpty()) editedBuilder.setEffects(Effects(emptyList(), videoEffects))
    val edited = editedBuilder.build()

    val transformer = Transformer.Builder(context)
      .addListener(object : Transformer.Listener {
        override fun onCompleted(composition: androidx.media3.transformer.Composition, result: ExportResult) {
          if (continuation.isActive) continuation.resume(outputFile.toURI().toString())
        }

        override fun onError(composition: androidx.media3.transformer.Composition, result: ExportResult, exception: ExportException) {
          if (continuation.isActive) continuation.resumeWithException(exception)
        }
      })
      .build()

    continuation.invokeOnCancellation { transformer.cancel() }
    transformer.start(edited, outputFile.absolutePath)
  }
}
