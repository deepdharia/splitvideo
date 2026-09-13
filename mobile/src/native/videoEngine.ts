import { requireOptionalNativeModule } from 'expo-modules-core';

export type CropMode =
  | { type: 'original' }
  | { type: '9:16' }
  | { type: '1:1' }
  | { type: 'custom'; x: number; y: number; width: number; height: number };

export type SplitJob = {
  inputUri: string;
  mode: 'duration' | 'parts';
  secondsPerClip?: number;
  parts?: number;
  crop: CropMode;
  preserveAudio: boolean;
};

export type VideoInfo = {
  durationMs: number;
  width: number;
  height: number;
};

export type SplitResult = {
  outputs: string[];
};

type NativeVideoEngine = {
  getVideoInfo(uri: string): Promise<VideoInfo>;
  exportClip(options: {
    inputUri: string;
    startMs: number;
    endMs: number;
    crop: CropMode;
    preserveAudio: boolean;
    outputName: string;
  }): Promise<string>;
};

const native = requireOptionalNativeModule<NativeVideoEngine>('SplitVideoEngine');

function requireEngine(): NativeVideoEngine {
  if (!native) {
    throw new Error('SplitVideo native engine is not included in this build. Install/run an EAS development build.');
  }
  return native;
}

export async function getVideoInfo(uri: string): Promise<VideoInfo> {
  return requireEngine().getVideoInfo(uri);
}

export async function splitVideo(job: SplitJob): Promise<SplitResult> {
  const engine = requireEngine();
  const info = await engine.getVideoInfo(job.inputUri);
  const durationMs = info.durationMs;
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error('Could not determine video duration.');
  }

  let boundaries: number[] = [0, durationMs];
  if (job.mode === 'duration') {
    const seconds = job.secondsPerClip ?? 60;
    if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('Invalid split duration.');
    const step = seconds * 1000;
    boundaries = [];
    for (let t = 0; t < durationMs; t += step) boundaries.push(t);
    boundaries.push(durationMs);
  } else {
    const parts = Math.floor(job.parts ?? 2);
    if (parts < 2 || parts > 100) throw new Error('Parts must be between 2 and 100.');
    boundaries = Array.from({ length: parts + 1 }, (_, index) => (durationMs * index) / parts);
  }

  const outputs: string[] = [];
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const startMs = boundaries[index];
    const endMs = boundaries[index + 1];
    if (endMs - startMs < 10) continue;
    const output = await engine.exportClip({
      inputUri: job.inputUri,
      startMs,
      endMs,
      crop: job.crop,
      preserveAudio: job.preserveAudio,
      outputName: `splitvideo-${String(index + 1).padStart(3, '0')}.mp4`,
    });
    outputs.push(output);
  }

  return { outputs };
}
