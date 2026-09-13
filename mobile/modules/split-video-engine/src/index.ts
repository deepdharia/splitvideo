export type CropMode =
  | { type: 'original' }
  | { type: '9:16' }
  | { type: '1:1' }
  | { type: 'custom'; x: number; y: number; width: number; height: number };

export type VideoInfo = {
  durationMs: number;
  width: number;
  height: number;
};

export type ExportClipOptions = {
  inputUri: string;
  startMs: number;
  endMs: number;
  crop: CropMode;
  preserveAudio: boolean;
  outputName: string;
};

export type SplitVideoEngine = {
  getVideoInfo(uri: string): Promise<VideoInfo>;
  exportClip(options: ExportClipOptions): Promise<string>;
};
