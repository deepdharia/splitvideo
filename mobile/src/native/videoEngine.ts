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

/**
 * Stable UI-facing contract for the native processing engine.
 *
 * Phase 1 intentionally fails safely. Phase 2 will implement this contract
 * with Android Media3 Transformer and iOS AVFoundation native modules.
 */
export async function splitVideo(_job: SplitJob): Promise<string[]> {
  throw new Error('Native video engine is not connected yet.');
}
