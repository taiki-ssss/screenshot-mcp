export type ScreenshotError = {
  type: 'INVALID_URL' | 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'PERMISSION_ERROR' | 'PUPPETEER_ERROR';
  message: string;
};

export type ScreenshotOptions = {
  url: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  outputPath?: string;
};

export type ScreenshotMetadata = {
  url: string;
  filePath: string;
  timestamp: string;
  viewport: { width: number; height: number };
  fullPage: boolean;
};