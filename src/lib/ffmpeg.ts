import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null
let loadingPromise: Promise<FFmpeg> | null = null

const CORE_BASE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm'

export async function getFFmpeg(onProgress?: (p: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg()
    ffmpeg.on('progress', ({ progress }) => {
      onProgress?.(Math.min(99, Math.max(0, Math.round(progress * 100))))
    })

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
    } catch (error) {
      ffmpegInstance = null
      console.error('Unable to load FFmpeg WebAssembly.', error)
      throw new Error('The video engine could not load. Check your connection, then try again.')
    }

    ffmpegInstance = ffmpeg
    return ffmpeg
  })()

  try {
    return await loadingPromise
  } finally {
    loadingPromise = null
  }
}

function getExt(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx).toLowerCase() : '.mp4'
}

async function removeFileSafe(ffmpeg: FFmpeg, name: string) {
  try { await ffmpeg.deleteFile(name) } catch { /* already removed */ }
}

function toVideoBlob(data: Uint8Array): Blob {
  return new Blob([data], { type: 'video/mp4' })
}

export async function trimVideo(
  file: File,
  start: number,
  end: number,
  onProgress?: (p: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress)
  const inputName = `input_${Date.now()}${getExt(file.name)}`
  const outputName = `output_${Date.now()}.mp4`
  const duration = Math.max(0.1, end - start)

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    await ffmpeg.exec([
      '-ss', start.toFixed(3), '-i', inputName, '-t', duration.toFixed(3),
      '-c', 'copy', '-avoid_negative_ts', 'make_zero', '-y', outputName,
    ])
    const data = await ffmpeg.readFile(outputName)
    onProgress?.(100)
    return toVideoBlob(data as Uint8Array)
  } finally {
    await removeFileSafe(ffmpeg, inputName)
    await removeFileSafe(ffmpeg, outputName)
  }
}

export async function splitVideo(
  file: File,
  points: number[],
  onProgress?: (p: number) => void
): Promise<Blob[]> {
  const ffmpeg = await getFFmpeg(onProgress)
  const inputName = `input_${Date.now()}${getExt(file.name)}`
  const blobs: Blob[] = []
  const segments = Math.max(0, points.length - 1)

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    for (let i = 0; i < segments; i++) {
      const start = points[i]
      const end = points[i + 1]
      const outputName = `clip_${Date.now()}_${i}.mp4`
      const duration = Math.max(0.1, end - start)

      try {
        await ffmpeg.exec([
          '-ss', start.toFixed(3), '-i', inputName, '-t', duration.toFixed(3),
          '-c', 'copy', '-avoid_negative_ts', 'make_zero', '-y', outputName,
        ])
        const data = await ffmpeg.readFile(outputName)
        blobs.push(toVideoBlob(data as Uint8Array))
      } finally {
        await removeFileSafe(ffmpeg, outputName)
      }

      onProgress?.(Math.round(((i + 1) / segments) * 100))
    }
    return blobs
  } finally {
    await removeFileSafe(ffmpeg, inputName)
  }
}

export async function cropAndTrimVideo(
  file: File,
  start: number,
  end: number,
  crop: { x: number; y: number; w: number; h: number },
  videoWidth: number,
  videoHeight: number,
  onProgress?: (p: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress)
  const inputName = `input_${Date.now()}${getExt(file.name)}`
  const outputName = `output_${Date.now()}.mp4`
  const x = Math.max(0, Math.round(crop.x * videoWidth))
  const y = Math.max(0, Math.round(crop.y * videoHeight))
  const w = Math.max(2, Math.round(crop.w * videoWidth))
  const h = Math.max(2, Math.round(crop.h * videoHeight))
  const duration = Math.max(0.1, end - start)

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    await ffmpeg.exec([
      '-ss', start.toFixed(3), '-i', inputName, '-t', duration.toFixed(3),
      '-vf', `crop=${w}:${h}:${x}:${y}`,
      '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac',
      '-movflags', '+faststart', '-y', outputName,
    ])
    const data = await ffmpeg.readFile(outputName)
    onProgress?.(100)
    return toVideoBlob(data as Uint8Array)
  } finally {
    await removeFileSafe(ffmpeg, inputName)
    await removeFileSafe(ffmpeg, outputName)
  }
}
