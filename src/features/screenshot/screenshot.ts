import { Result, ok, err } from 'neverthrow';
import debug from 'debug';
import puppeteer from 'puppeteer';
import * as path from 'path';
import { ScreenshotError, ScreenshotOptions, ScreenshotMetadata } from './types.js';

const screenshotLog = debug('mcp:screenshot');

export async function screenshotTool(
  options: ScreenshotOptions,
  testOptions: {
    logger?: (message: string, ...args: unknown[]) => void;
    browserLauncher?: () => Promise<puppeteer.Browser>;
    disableAutoScroll?: boolean;
  } = {}
): Promise<Result<{ content: Array<{ type: 'text'; text: string }>; metadata: ScreenshotMetadata }, ScreenshotError>> {
  const logger = testOptions.logger || screenshotLog;
  
  logger('screenshotTool called with options: %O', options);

  try {
    // URL妥当性チェック
    if (!options.url || typeof options.url !== 'string') {
      logger('Invalid URL provided: %s', options.url);
      return err({
        type: 'INVALID_URL',
        message: `Invalid URL provided: ${options.url}. URL must be a non-empty string.`
      });
    }

    // URLの形式チェック
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(options.url);
    } catch (urlError) {
      logger('URL parsing failed: %s', options.url);
      return err({
        type: 'INVALID_URL',
        message: `Invalid URL format: ${options.url}`
      });
    }

    // HTTPSのみ許可
    if (parsedUrl.protocol !== 'https:') {
      logger('Non-HTTPS URL rejected: %s', options.url);
      return err({
        type: 'INVALID_URL',
        message: `Only HTTPS URLs are allowed. Got: ${parsedUrl.protocol}`
      });
    }

    // フルページ優先ロジック: width/height指定時はフルページ無効
    const hasCustomViewport = options.width !== undefined || options.height !== undefined;
    const width = options.width || 1280;
    const height = options.height || 720;
    const fullPage = hasCustomViewport ? false : (options.fullPage !== undefined ? options.fullPage : true);

    // 出力パスの生成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFileName = `screenshot-${timestamp}.png`;
    const outputPath = options.outputPath || path.join(process.cwd(), defaultFileName);

    logger('Screenshot configuration: url=%s, width=%d, height=%d, fullPage=%s (hasCustomViewport=%s), outputPath=%s', 
      options.url, width, height, fullPage, hasCustomViewport, outputPath);

    // Puppeteerブラウザの起動
    const browser = testOptions.browserLauncher ? 
      await testOptions.browserLauncher() : 
      await puppeteer.launch({ headless: true });

    try {
      const page = await browser.newPage();
      
      // ビューポートの設定
      await page.setViewport({ width, height });
      
      // ページの読み込み
      await page.goto(options.url, { 
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // 画像遅延読み込み対応: フルページの場合は自動スクロール実行
      if (fullPage && !testOptions.disableAutoScroll) {
        logger('Starting auto-scroll for lazy loading images');
        const module = await import('puppeteer-autoscroll-down') as { scrollPageToBottom: (page: unknown, options: unknown) => Promise<number> };
        const { scrollPageToBottom } = module;
        const scrollCount = await scrollPageToBottom(page, {
          scrollDelay: 300,  // スクロール間隔（ミリ秒）
          elementDelay: 100  // 要素待機時間（ミリ秒）
        });
        logger('Auto-scroll completed, scrolled %d times', scrollCount);
      }

      // スクリーンショット取得
      await page.screenshot({
        path: outputPath as `${string}.png`,
        fullPage
      });

      await page.close();

      const metadata: ScreenshotMetadata = {
        url: options.url,
        filePath: outputPath,
        timestamp: new Date().toISOString(),
        viewport: { width, height },
        fullPage
      };

      logger('Screenshot captured successfully: %s', outputPath);

      return ok({
        content: [
          {
            type: "text" as const,
            text: `Screenshot saved successfully at: ${outputPath}`,
          }
        ],
        metadata
      });

    } finally {
      await browser.close();
    }

  } catch (error) {
    logger('Screenshot error: %O', error);
    
    if (error && typeof error === 'object' && 'name' in error) {
      const errorObj = error as { name: string; message?: string };
      // Puppeteerのタイムアウトエラー
      if (errorObj.name === 'TimeoutError') {
        return err({
          type: 'TIMEOUT_ERROR',
          message: `Screenshot timed out after 60000ms`
        });
      }
      
      // ネットワークエラー
      if (errorObj.message && (errorObj.message.includes('net::') || errorObj.message.includes('ERR_NAME_NOT_RESOLVED'))) {
        return err({
          type: 'NETWORK_ERROR',
          message: `Network error: ${errorObj.message}`
        });
      }
    }

    // ファイルシステムエラー
    if (error && typeof error === 'object' && 'code' in error) {
      const fsError = error as { code: string };
      if (fsError.code === 'EACCES' || fsError.code === 'EPERM') {
        return err({
          type: 'PERMISSION_ERROR',
          message: `Permission denied: Cannot write to file`
        });
      }
    }

    // その他のPuppeteerエラー
    return err({
      type: 'PUPPETEER_ERROR',
      message: `Puppeteer error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

export async function screenshotToolWrapper(args: ScreenshotOptions) {
  const result = await screenshotTool(args);

  return result.match(
    (success) => success,
    (error) => {
      screenshotLog('Screenshot tool error: %O', error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error.message}`,
          }
        ],
        isError: true
      };
    }
  );
}

// Test-specific wrapper that accepts test options
export async function screenshotToolWrapperForTest(
  args: ScreenshotOptions,
  testOptions?: {
    logger?: (message: string, ...args: unknown[]) => void;
    browserLauncher?: () => Promise<puppeteer.Browser>;
    disableAutoScroll?: boolean;
  }
) {
  const result = await screenshotTool(args, testOptions);

  return result.match(
    (success) => success,
    (error) => {
      screenshotLog('Screenshot tool error: %O', error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error.message}`,
          }
        ],
        isError: true
      };
    }
  );
}