import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Upload, Play, Pause, Scissors, Crop, Download, RotateCcw, Plus, X, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { cn, formatTime, formatFileSize, isSupportedVideo } from '../lib/utils'
import { trimVideo, splitVideo, cropAndTrimVideo } from '../lib/ffmpeg'

type Mode = 'trim' | 'split' | 'crop'
type Status = 'idle' | 'ready' | 'processing' | 'done' | 'error'

interface Clip {
  id: string
  start: number
  end: number
  name: string
  blob?: Blob
}

const ASPECT_RATIOS = [
  { label: 'Original', value: 'original' },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '4:3', value: 4 / 3 },
]

export default function VideoTool({ initialMode = 'trim' }: { initialMode?: Mode }) {
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [clips, setClips] = useState<Clip[]>([])
  const [splitPoints, setSplitPoints] = useState<number[]>([])
  const [crop, setCrop] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
  const [aspect, setAspect] = useState<string | number>('original')
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 })
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => { if (videoUrl) URL.revokeObjectURL(videoUrl) }
  }, [videoUrl])

  const handleFile = useCallback((f: File) => {
    if (!isSupportedVideo(f)) {
      setError('Unsupported format. Please use MP4, WebM, MOV, AVI or MKV.')
      return
    }
    if (f.size > 500 * 1024 * 1024) {
      setError('File is too large (max ~500 MB recommended).')
      return
    }
    setError(null)
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    const url = URL.createObjectURL(f)
    setFile(f)
    setVideoUrl(url)
    setStatus('ready')
    setClips([])
    setSplitPoints([])
    setStart(0)
    setEnd(0)
    setProgress(0)
  }, [videoUrl])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const onLoadedMetadata = () => {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration)
    setEnd(v.duration)
    setVideoSize({ w: v.videoWidth, h: v.videoHeight })
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (playing) v.pause()
    else v.play()
    setPlaying(!playing)
  }

  const onTimelinePointerDown = (e: React.PointerEvent, type: 'start' | 'end') => {
    e.preventDefault()
    setDragging(type)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onTimelinePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !timelineRef.current || !duration) return
    const rect = timelineRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const t = pct * duration
    if (dragging === 'start') setStart(Math.min(t, end - 0.1))
    else setEnd(Math.max(t, start + 0.1))
  }

  const onTimelinePointerUp = () => setDragging(null)

  const setStartManual = (val: string) => {
    const parts = val.split(':').map(Number)
    let secs = 0
    if (parts.length === 2) secs = parts[0] * 60 + parts[1]
    else if (parts.length === 3) secs = parts[0] * 3600 + parts[1] * 60 + parts[2]
    else secs = Number(val) || 0
    setStart(Math.max(0, Math.min(secs, end - 0.1)))
  }

  const setEndManual = (val: string) => {
    const parts = val.split(':').map(Number)
    let secs = 0
    if (parts.length === 2) secs = parts[0] * 60 + parts[1]
    else if (parts.length === 3) secs = parts[0] * 3600 + parts[1] * 60 + parts[2]
    else secs = Number(val) || 0
    setEnd(Math.min(duration, Math.max(secs, start + 0.1)))
  }

  const addSplitPoint = () => {
    const t = currentTime
    if (t <= start || t >= end) return
    setSplitPoints((prev) => [...prev, t].sort((a, b) => a - b))
  }

  const removeSplitPoint = (t: number) => {
    setSplitPoints((prev) => prev.filter((p) => p !== t))
  }

  const process = async () => {
    if (!file) return
    setStatus('processing')
    setProgress(0)
    setError(null)
    try {
      if (mode === 'trim') {
        const blob = await trimVideo(file, start, end, setProgress)
        setClips([{ id: '1', start, end, name: `${file.name.replace(/\.[^/.]+$/, '')}_trimmed.mp4`, blob }])
      } else if (mode === 'split') {
        const points = [start, ...splitPoints, end]
        const blobs = await splitVideo(file, points, setProgress)
        setClips(blobs.map((blob, i) => ({
          id: String(i + 1), start: points[i], end: points[i + 1], name: `clip_${i + 1}.mp4`, blob,
        })))
      } else if (mode === 'crop') {
        const blob = await cropAndTrimVideo(file, start, end, crop, videoSize.w, videoSize.h, setProgress)
        setClips([{ id: '1', start, end, name: `${file.name.replace(/\.[^/.]+$/, '')}_cropped.mp4`, blob }])
      }
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Processing failed. Try a smaller MP4 file.')
      setStatus('error')
    }
  }

  const downloadClip = (clip: Clip) => {
    if (!clip.blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(clip.blob)
    a.download = clip.name
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const downloadAll = () => clips.forEach((c) => downloadClip(c))

  const reset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setFile(null)
    setVideoUrl(null)
    setDuration(0)
    setCurrentTime(0)
    setStart(0)
    setEnd(0)
    setClips([])
    setSplitPoints([])
    setStatus('idle')
    setProgress(0)
    setError(null)
    setPlaying(false)
  }

  useEffect(() => {
    if (aspect === 'original' || !videoSize.w) return
    const ratio = aspect as number
    let w = crop.w
    let h = w / ratio
    if (h > 1) { h = 1; w = h * ratio }
    setCrop((c) => ({ ...c, w: Math.min(w, 1), h: Math.min(h, 1) }))
  }, [aspect])

  return (
    <div className="w-full max-w-5xl mx-auto">
      {status === 'idle' && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="card p-10 sm:p-16 text-center border-2 border-dashed border-slate-300 hover:border-teal-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto text-teal-600 mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Drop your video here or click to upload</h2>
          <p className="text-slate-500 mb-4">MP4, WebM, MOV, AVI, MKV · Processing happens in your browser</p>
          <button className="btn-primary" type="button">Select Video</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mp4,.webm,.mov,.avi,.mkv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Something went wrong</p>
            <p className="text-sm mt-1">{error}</p>
            <button className="btn-secondary mt-3 text-sm" onClick={() => setError(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {(status === 'ready' || status === 'processing' || status === 'done' || status === 'error') && videoUrl && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {(['trim', 'split', 'crop'] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={cn('btn text-sm capitalize', mode === m ? 'btn-primary' : 'btn-secondary')}>
                {m === 'trim' && <Scissors className="w-4 h-4" />}
                {m === 'split' && <Plus className="w-4 h-4" />}
                {m === 'crop' && <Crop className="w-4 h-4" />}
                {m}
              </button>
            ))}
            <button className="btn-secondary ml-auto" onClick={reset}><RotateCcw className="w-4 h-4" /> New video</button>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[60vh] mx-auto">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onLoadedMetadata={onLoadedMetadata}
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              playsInline
            />
            {mode === 'crop' && (
              <div className="absolute border-2 border-teal-400 bg-teal-400/10 pointer-events-none"
                style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }} />
            )}
          </div>

          <div className="card p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-4">
              <button className="btn-primary p-3 rounded-full" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <span className="text-sm font-mono text-slate-600">{formatTime(currentTime)} / {formatTime(duration)}</span>
              {file && <span className="text-sm text-slate-500 ml-auto">{file.name} · {formatFileSize(file.size)}</span>}
            </div>

            <div
              ref={timelineRef}
              className="relative h-12 bg-slate-100 rounded-xl cursor-pointer select-none"
              onPointerMove={onTimelinePointerMove}
              onPointerUp={onTimelinePointerUp}
              onPointerLeave={onTimelinePointerUp}
            >
              <div className="absolute top-0 bottom-0 bg-teal-200/60 rounded-lg"
                style={{ left: `${(start / duration) * 100}%`, width: `${((end - start) / duration) * 100}%` }} />
              {splitPoints.map((p) => (
                <div key={p} className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" style={{ left: `${(p / duration) * 100}%` }}>
                  <button className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-500 rounded-full text-white flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); removeSplitPoint(p) }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="absolute top-0 bottom-0 w-3 bg-teal-600 rounded-l-lg cursor-ew-resize z-20 flex items-center justify-center"
                style={{ left: `${(start / duration) * 100}%`, transform: 'translateX(-50%)' }}
                onPointerDown={(e) => onTimelinePointerDown(e, 'start')}>
                <div className="w-1 h-6 bg-white rounded" />
              </div>
              <div className="absolute top-0 bottom-0 w-3 bg-teal-600 rounded-r-lg cursor-ew-resize z-20 flex items-center justify-center"
                style={{ left: `${(end / duration) * 100}%`, transform: 'translateX(-50%)' }}
                onPointerDown={(e) => onTimelinePointerDown(e, 'end')}>
                <div className="w-1 h-6 bg-white rounded" />
              </div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10" style={{ left: `${(currentTime / duration) * 100}%` }} />
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 text-sm">Start
                <input type="text" className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-sm"
                  value={formatTime(start)} onChange={(e) => setStartManual(e.target.value)} />
              </label>
              <label className="flex items-center gap-2 text-sm">End
                <input type="text" className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-sm"
                  value={formatTime(end)} onChange={(e) => setEndManual(e.target.value)} />
              </label>
              {mode === 'split' && (
                <button className="btn-secondary text-sm" onClick={addSplitPoint}><Plus className="w-4 h-4" /> Add split at playhead</button>
              )}
            </div>

            {mode === 'crop' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-700">Aspect ratio</p>
                <div className="flex flex-wrap gap-2">
                  {ASPECT_RATIOS.map((r) => (
                    <button key={String(r.value)} onClick={() => setAspect(r.value)}
                      className={cn('btn text-xs', aspect === r.value ? 'btn-primary' : 'btn-secondary')}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button className="btn-primary" onClick={process} disabled={status === 'processing' || start >= end}>
                {status === 'processing' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing {progress}%</>
                ) : (
                  <><Scissors className="w-4 h-4" />
                    {mode === 'trim' && 'Trim video'}
                    {mode === 'split' && 'Split into clips'}
                    {mode === 'crop' && 'Crop & export'}
                  </>
                )}
              </button>
              {status === 'processing' && <p className="text-sm text-slate-500 self-center">Keep this tab open.</p>}
            </div>
          </div>

          {status === 'done' && clips.length > 0 && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-2 text-teal-700">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-semibold">Ready to download</h3>
              </div>
              <ul className="space-y-3">
                {clips.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-slate-500">{formatTime(c.start)} → {formatTime(c.end)}</p>
                    </div>
                    <button className="btn-primary text-sm" onClick={() => downloadClip(c)}>
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </li>
                ))}
              </ul>
              {clips.length > 1 && (
                <button className="btn-secondary" onClick={downloadAll}>
                  <Download className="w-4 h-4" /> Download all
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
