import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null
let loadingPromise: Promise<FFmpeg> | null = null

export async function getFFmpeg(onProgress?: (p: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg()
    ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) onProgress(Math.min(99, Math.round(progress * 100)))
    })

    // Load from jsDelivr CDN
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm'
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
    } catch (e) {
      // Fallback without SharedArrayBuffer if needed
      console.warn('FFmpeg load with SAB failed, retrying...', e)
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
    }

    ffmpegInstance = ffmpeg
    return ffmpeg
  })()

  return loadingPromise
}

function getExt(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx).toLowerCase() : '.mp4'
}

export async function trimVideo(
  file: File,
  start: number,
  end: number,
  onProgress?: (p: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress)
  const inputName = 'input' + getExt(file.name)
  const outputName = 'output.mp4'

  await ffmpeg.writeFile(inputName, await fetchFile(file))
  const duration = Math.max(0.1, end - start)

  // Prefer stream copy for speed/quality; fall back to re-encode if needed
  try {
    await ffmpeg.exec([
      '-ss', start.toFixed(3),
      '-i', inputName,
      '-t', duration.toFixed(3),
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-y',
      outputName,
    ])
  } catch {
    await ffmpeg.exec([
      '-ss', start.toFixed(3),
      '-i', inputName,
      '-t', duration.toFixed(3),
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
      '-y',
      outputName,
    ])
  }

  const data = await ffmpeg.readFile(outputName)
  try { await ffmpeg.deleteFile(inputName) } catch {}
  try { await ffmpeg.deleteFile(outputName) } catch {}

  // @ts-expect-error Uint8Array from ffmpeg
  return new Blob([data.buffer], { type: 'video/mp4' })
}

export async function splitVideo(
  file: File,
  points: number[],
  onProgress?: (p: number) => void
): Promise<Blob[]> {
  const ffmpeg = await getFFmpeg(onProgress)
  const inputName = 'input' + getExt(file.name)
  await ffmpeg.writeFile(inputName, await fetchFile(file))

  const blobs: Blob[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    const outputName = `clip_${i}.mp4`
    const duration = Math.max(0.1, end - start)

    await ffmpeg.exec([
      '-ss', start.toFixed(3),
      '-i', inputName,
      '-t', duration.toFixed(3),
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-y',
      outputName,
    ])

    const data = await ffmpeg.readFile(outputName)
    // @ts-expect-error Uint8Array
    blobs.push(new Blob([data.buffer], { type: 'video/mp4' }))
    try { await ffmpeg.deleteFile(outputName) } catch {}
    if (onProgress) onProgress(Math.round(((i + 1) / (points.length - 1)) * 100))
  }

  try { await ffmpeg.deleteFile(inputName) } catch {}
  return blobs
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
  const inputName = 'input' + getExt(file.name)
  const outputName = 'output.mp4'

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  const x = Math.max(0, Math.round(crop.x * videoWidth))
  const y = Math.max(0, Math.round(crop.y * videoHeight))
  const w = Math.max(2, Math.round(crop.w * videoWidth))
  const h = Math.max(2, Math.round(crop.h * videoHeight))
  const duration = Math.max(0.1, end - start)

  await ffmpeg.exec([
    '-ss', start.toFixed(3),
    '-i', inputName,
    '-t', duration.toFixed(3),
    '-vf', `crop=${w}:${h}:${x}:${y}`,
    '-c:a', 'copy',
    '-y',
    outputName,
  ])

  const data = await ffmpeg.readFile(outputName)
  try { await ffmpeg.deleteFile(inputName) } catch {}
  try { await ffmpeg.deleteFile(outputName) } catch {}
  // @ts-expect-error Uint8Array
  return new Blob([data.buffer], { type: 'video/mp4' })
}
