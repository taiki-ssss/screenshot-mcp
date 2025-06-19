import { describe, it, expect } from 'vitest';
import { screenshotTool, screenshotToolWrapper, screenshotToolWrapperForTest, type ScreenshotError, type ScreenshotOptions, type ScreenshotMetadata } from '../index.js';
import type { Browser } from 'puppeteer';

// Mock types for Puppeteer
interface MockPage {
  setViewport: (viewport: { width: number; height: number }) => Promise<void>;
  goto: (url: string, options?: { waitUntil?: string; timeout?: number }) => Promise<void>;
  screenshot: (options: { path?: string; fullPage?: boolean }) => Promise<void>;
  close: () => Promise<void>;
}

interface MockBrowser {
  newPage: () => MockPage | Promise<MockPage>;
  close: () => Promise<void>;
}


describe('screenshot', () => {
  describe('screenshot types', () => {
    it('should have proper ScreenshotError type', () => {
      const error: ScreenshotError = {
        type: 'INVALID_URL',
        message: 'Invalid URL provided'
      };
      
      expect(error.type).toBe('INVALID_URL');
      expect(error.message).toBe('Invalid URL provided');
    });

    it('should have proper ScreenshotOptions type', () => {
      const options: ScreenshotOptions = {
        url: 'https://example.com',
        width: 1280,
        height: 720,
        fullPage: false,
        outputPath: '/tmp/screenshot.png'
      };
      
      expect(options.url).toBe('https://example.com');
      expect(options.width).toBe(1280);
      expect(options.height).toBe(720);
      expect(options.fullPage).toBe(false);
      expect(options.outputPath).toBe('/tmp/screenshot.png');
    });

    it('should have proper ScreenshotMetadata type', () => {
      const metadata: ScreenshotMetadata = {
        url: 'https://example.com',
        filePath: '/tmp/screenshot.png',
        timestamp: '2025-06-19T15:17:30Z',
        viewport: { width: 1280, height: 720 },
        fullPage: false
      };
      
      expect(metadata.url).toBe('https://example.com');
      expect(metadata.filePath).toBe('/tmp/screenshot.png');
      expect(metadata.timestamp).toBe('2025-06-19T15:17:30Z');
      expect(metadata.viewport).toEqual({ width: 1280, height: 720 });
      expect(metadata.fullPage).toBe(false);
    });

    it('should handle all ScreenshotError types', () => {
      const errorTypes: ScreenshotError['type'][] = [
        'INVALID_URL',
        'NETWORK_ERROR', 
        'TIMEOUT_ERROR',
        'PERMISSION_ERROR',
        'PUPPETEER_ERROR'
      ];
      
      errorTypes.forEach(type => {
        const error: ScreenshotError = {
          type,
          message: `Test error for ${type}`
        };
        
        expect(error.type).toBe(type);
        expect(error.message).toBe(`Test error for ${type}`);
      });
    });

    it('should handle optional properties', () => {
      const minimalOptions: ScreenshotOptions = {
        url: 'https://example.com'
      };
      
      expect(minimalOptions.url).toBe('https://example.com');
      expect(minimalOptions.width).toBeUndefined();
      expect(minimalOptions.height).toBeUndefined();
      expect(minimalOptions.fullPage).toBeUndefined();
      expect(minimalOptions.outputPath).toBeUndefined();
    });
  });

  describe('screenshotTool', () => {
    it('should validate URL parameter', async () => {
      const result = await screenshotTool({ url: '' });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_URL');
        expect(result.error.message).toContain('Invalid URL provided');
      }
    });

    it('should handle missing URL parameter', async () => {
      const result = await screenshotTool({ url: undefined as unknown as string });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_URL');
        expect(result.error.message).toContain('Invalid URL provided');
      }
    });

    it('should reject invalid URL format', async () => {
      const result = await screenshotTool({ url: 'invalid-url' });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_URL');
        expect(result.error.message).toContain('Invalid URL format');
      }
    });

    it('should reject HTTP URLs (HTTPS only)', async () => {
      const result = await screenshotTool({ url: 'http://example.com' });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_URL');
        expect(result.error.message).toContain('Only HTTPS URLs are allowed');
      }
    });

    it('should default to fullPage=true when no viewport specified', async () => {
      const mockBrowser: MockBrowser = {
        newPage: (): MockPage => ({
          setViewport: (viewport: { width: number; height: number }) => {
            expect(viewport.width).toBe(1280);
            expect(viewport.height).toBe(720);
            return Promise.resolve();
          },
          goto: (url: string, options?: { waitUntil?: string; timeout?: number }) => {
            expect(url).toBe('https://example.com');
            expect(options?.waitUntil).toBe('networkidle2');
            expect(options?.timeout).toBe(30000);
            return Promise.resolve();
          },
          screenshot: (options: { path?: string; fullPage?: boolean }) => {
            expect(options.fullPage).toBe(true);
            expect(options.path).toMatch(/screenshot-.*\.png$/);
            return Promise.resolve();
          },
          close: () => Promise.resolve()
        }),
        close: () => Promise.resolve()
      };

      const result = await screenshotTool(
        { url: 'https://example.com' },
        { browserLauncher: () => Promise.resolve(mockBrowser as unknown as Browser) }
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.content[0].type).toBe('text');
        expect(result.value.content[0].text).toContain('Screenshot saved successfully');
        expect(result.value.metadata).toBeDefined();
        expect(result.value.metadata.url).toBe('https://example.com');
        expect(result.value.metadata.viewport).toEqual({ width: 1280, height: 720 });
        expect(result.value.metadata.fullPage).toBe(true);
      }
    });

    it('should disable fullPage when width/height specified (priority logic)', async () => {
      const mockBrowser: MockBrowser = {
        newPage: (): MockPage => ({
          setViewport: (viewport: { width: number; height: number }) => {
            expect(viewport.width).toBe(800);
            expect(viewport.height).toBe(600);
            return Promise.resolve();
          },
          goto: () => Promise.resolve(),
          screenshot: (options: { path?: string; fullPage?: boolean }) => {
            expect(options.fullPage).toBe(false); // フルページ優先ロジック：width/height指定時は無効
            return Promise.resolve();
          },
          close: () => Promise.resolve()
        }),
        close: () => Promise.resolve()
      };

      const result = await screenshotTool(
        { 
          url: 'https://example.com', 
          width: 800, 
          height: 600, 
          fullPage: true // この指定は無視される
        },
        { browserLauncher: () => Promise.resolve(mockBrowser as unknown as Browser) }
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.metadata.viewport).toEqual({ width: 800, height: 600 });
        expect(result.value.metadata.fullPage).toBe(false); // 縦横指定時はフルページ無効
      }
    });

    it('should respect explicit fullPage=false when no viewport specified', async () => {
      const mockBrowser: MockBrowser = {
        newPage: (): MockPage => ({
          setViewport: (viewport: { width: number; height: number }) => {
            expect(viewport.width).toBe(1280);
            expect(viewport.height).toBe(720);
            return Promise.resolve();
          },
          goto: () => Promise.resolve(),
          screenshot: (options: { path?: string; fullPage?: boolean }) => {
            expect(options.fullPage).toBe(false);
            return Promise.resolve();
          },
          close: () => Promise.resolve()
        }),
        close: () => Promise.resolve()
      };

      const result = await screenshotTool(
        { url: 'https://example.com', fullPage: false },
        { browserLauncher: () => Promise.resolve(mockBrowser as unknown as Browser) }
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.metadata.fullPage).toBe(false);
      }
    });

    it('should handle custom output path', async () => {
      const customPath = '/custom/path/test.png';
      const mockBrowser: MockBrowser = {
        newPage: (): MockPage => ({
          setViewport: () => Promise.resolve(),
          goto: () => Promise.resolve(),
          screenshot: (options: { path?: string; fullPage?: boolean }) => {
            expect(options.path).toBe(customPath);
            return Promise.resolve();
          },
          close: () => Promise.resolve()
        }),
        close: () => Promise.resolve()
      };

      const result = await screenshotTool(
        { url: 'https://example.com', outputPath: customPath },
        { browserLauncher: () => Promise.resolve(mockBrowser as unknown as Browser) }
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.metadata.filePath).toBe(customPath);
        expect(result.value.content[0].text).toContain(customPath);
      }
    });

    it('should handle timeout errors', async () => {
      const mockBrowser: MockBrowser = {
        newPage: (): MockPage => ({
          setViewport: () => Promise.resolve(),
          goto: () => Promise.reject({ name: 'TimeoutError' }),
          screenshot: () => Promise.resolve(),
          close: () => Promise.resolve()
        }),
        close: () => Promise.resolve()
      };

      const result = await screenshotTool(
        { url: 'https://example.com' },
        { browserLauncher: () => Promise.resolve(mockBrowser as unknown as Browser) }
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('TIMEOUT_ERROR');
        expect(result.error.message).toContain('timed out after 30000ms');
      }
    });

    it('should handle network errors', async () => {
      const mockBrowser: MockBrowser = {
        newPage: (): MockPage => ({
          setViewport: () => Promise.resolve(),
          goto: () => Promise.reject({ message: 'net::ERR_NAME_NOT_RESOLVED', name: 'NetworkError' }),
          screenshot: () => Promise.resolve(),
          close: () => Promise.resolve()
        }),
        close: () => Promise.resolve()
      };

      const result = await screenshotTool(
        { url: 'https://example.com' },
        { browserLauncher: () => Promise.resolve(mockBrowser as unknown as Browser) }
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NETWORK_ERROR');
        expect(result.error.message).toContain('Network error');
      }
    });

    it('should handle permission errors', async () => {
      const mockBrowser: MockBrowser = {
        newPage: (): MockPage => ({
          setViewport: () => Promise.resolve(),
          goto: () => Promise.resolve(),
          screenshot: () => Promise.reject({ code: 'EACCES' }),
          close: () => Promise.resolve()
        }),
        close: () => Promise.resolve()
      };

      const result = await screenshotTool(
        { url: 'https://example.com' },
        { browserLauncher: () => Promise.resolve(mockBrowser as unknown as Browser) }
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PERMISSION_ERROR');
        expect(result.error.message).toContain('Permission denied');
      }
    });

    it('should handle EPERM permission errors', async () => {
      const mockBrowser: MockBrowser = {
        newPage: (): MockPage => ({
          setViewport: () => Promise.resolve(),
          goto: () => Promise.resolve(),
          screenshot: () => Promise.reject({ code: 'EPERM' }),
          close: () => Promise.resolve()
        }),
        close: () => Promise.resolve()
      };

      const result = await screenshotTool(
        { url: 'https://example.com' },
        { browserLauncher: () => Promise.resolve(mockBrowser as unknown as Browser) }
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PERMISSION_ERROR');
        expect(result.error.message).toContain('Permission denied');
      }
    });

    it('should handle puppeteer errors', async () => {
      const mockBrowser: MockBrowser = {
        newPage: (): never => {
          throw new Error('Puppeteer launch failed');
        },
        close: () => Promise.resolve()
      };

      const result = await screenshotTool(
        { url: 'https://example.com' },
        { browserLauncher: () => Promise.resolve(mockBrowser as unknown as Browser) }
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PUPPETEER_ERROR');
        expect(result.error.message).toContain('Puppeteer launch failed');
      }
    });

    it('should handle unknown errors', async () => {
      const mockBrowser: MockBrowser = {
        newPage: (): never => {
          throw 'Unknown error';
        },
        close: () => Promise.resolve()
      };

      const result = await screenshotTool(
        { url: 'https://example.com' },
        { browserLauncher: () => Promise.resolve(mockBrowser as unknown as Browser) }
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PUPPETEER_ERROR');
        expect(result.error.message).toContain('Unknown error');
      }
    });
  });

  describe('screenshotToolWrapper', () => {
    it('should handle successful screenshot', async () => {
      const mockBrowser: MockBrowser = {
        newPage: (): MockPage => ({
          setViewport: () => Promise.resolve(),
          goto: () => Promise.resolve(),
          screenshot: () => Promise.resolve(),
          close: () => Promise.resolve()
        }),
        close: () => Promise.resolve()
      };

      const result = await screenshotToolWrapperForTest(
        { url: 'https://example.com' },
        { browserLauncher: () => Promise.resolve(mockBrowser as unknown as Browser) }
      );

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Screenshot saved successfully');
      if ('metadata' in result) {
        expect(result.metadata).toBeDefined();
      }
      expect('isError' in result).toBe(false);
    });

    it('should handle screenshot errors in wrapper', async () => {
      const result = await screenshotToolWrapper({
        url: '',
      });

      expect(result.content[0].text).toContain('Error:');
      expect('isError' in result && result.isError).toBe(true);
    });

    it('should handle screenshot errors in test wrapper', async () => {
      const result = await screenshotToolWrapperForTest({
        url: '', // 無効なURL
      });

      expect(result.content[0].text).toContain('Error:');
      expect('isError' in result && result.isError).toBe(true);
    });

    it('should test real puppeteer launch path without browserLauncher', async () => {
      // browserLauncherが提供されない場合のテスト（実際のpuppeteer.launch()パス）
      // ただし、エラーを強制的に発生させて短時間でテストを完了
      const result = await screenshotTool({
        url: 'https://localhost:1' // 存在しないポートに接続してエラーを発生
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        // ネットワークエラーまたはタイムアウトエラーが期待される
        expect(['NETWORK_ERROR', 'TIMEOUT_ERROR', 'PUPPETEER_ERROR']).toContain(result.error.type);
      }
    });
  });
});