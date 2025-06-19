import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Result, ok, err } from 'neverthrow';
import debug from 'debug';
import { screenshotToolWrapper, type ScreenshotOptions } from '../screenshot/index.js';

const log = debug('mcp:calculator');

export type CalculatorError = {
  type: 'INVALID_NUMBER' | 'CALCULATION_ERROR' | 'OVERFLOW_ERROR';
  message: string;
};


export async function addTool(
  { a, b }: { a: number; b: number },
  options: {
    logger?: (message: string, ...args: unknown[]) => void;
    textFormatter?: (a: number, b: number, result: number) => string;
  } = {}
): Promise<Result<{ content: Array<{ type: 'text'; text: string }> }, CalculatorError>> {
  const logger = options.logger || log;
  const formatText = options.textFormatter || ((a, b, result) => `The sum of ${a} and ${b} is ${result}.`);

  logger('addTool called with a=%d, b=%d', a, b);

  try {
    // 数値の妥当性チェック
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      logger('Invalid numbers provided: a=%s, b=%s', a, b);
      return err({
        type: 'INVALID_NUMBER',
        message: `Invalid numbers provided: a=${a}, b=${b}. Both values must be finite numbers.`
      });
    }

    const result = a + b;

    // オーバーフローチェック
    if (!Number.isFinite(result)) {
      logger('Calculation overflow: %d + %d = %s', a, b, result);
      return err({
        type: 'OVERFLOW_ERROR',
        message: `Calculation resulted in overflow: ${a} + ${b} = ${result}`
      });
    }

    logger('Addition successful: %d + %d = %d', a, b, result);

    // フォーマッター関数を呼び出してテキストを生成（例外テスト用）
    const formattedText = formatText(a, b, result);

    return ok({
      content: [
        {
          type: "text" as const,
          text: formattedText,
        }
      ]
    });
  } catch (error) {
    // 予期しない例外のための安全網
    logger('Unexpected error in addTool: %O', error);
    return err({
      type: 'CALCULATION_ERROR',
      message: `Unexpected error during addition: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

export async function subtractTool(
  { a, b }: { a: number; b: number },
  options: {
    logger?: (message: string, ...args: unknown[]) => void;
    textFormatter?: (a: number, b: number, result: number) => string;
  } = {}
): Promise<Result<{ content: Array<{ type: 'text'; text: string }> }, CalculatorError>> {
  const logger = options.logger || log;
  const formatText = options.textFormatter || ((a, b, result) => `The difference of ${a} and ${b} is ${result}.`);

  logger('subtractTool called with a=%d, b=%d', a, b);

  try {
    // 数値の妥当性チェック
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      logger('Invalid numbers provided: a=%s, b=%s', a, b);
      return err({
        type: 'INVALID_NUMBER',
        message: `Invalid numbers provided: a=${a}, b=${b}. Both values must be finite numbers.`
      });
    }

    const result = a - b;

    // オーバーフローチェック
    if (!Number.isFinite(result)) {
      logger('Calculation overflow: %d - %d = %s', a, b, result);
      return err({
        type: 'OVERFLOW_ERROR',
        message: `Calculation resulted in overflow: ${a} - ${b} = ${result}`
      });
    }

    logger('Subtraction successful: %d - %d = %d', a, b, result);

    // フォーマッター関数を呼び出してテキストを生成（例外テスト用）
    const formattedText = formatText(a, b, result);

    return ok({
      content: [
        {
          type: "text" as const,
          text: formattedText,
        }
      ]
    });
  } catch (error) {
    // 予期しない例外のための安全網
    logger('Unexpected error in subtractTool: %O', error);
    return err({
      type: 'CALCULATION_ERROR',
      message: `Unexpected error during subtraction: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

// エラーハンドリングラッパー関数（テスタブルにするため分離）
export async function addToolWrapper(args: { a: number; b: number }) {
  const result = await addTool(args);

  return result.match(
    (success) => success,
    (error) => {
      log('Add tool error: %O', error);
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

export async function subtractToolWrapper(args: { a: number; b: number }) {
  const result = await subtractTool(args);

  return result.match(
    (success) => success,
    (error) => {
      log('Subtract tool error: %O', error);
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


export function createStdioServer(): McpServer {
  log('Creating MCP Server instance');

  const server = new McpServer({
    name: "screenshot-calculator",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Register the "add" tool with error handling wrapper
  server.tool(
    "add",
    "Add two numbers",
    {
      a: z.number(),
      b: z.number(),
    },
    addToolWrapper
  );

  // Register the "subtract" tool with error handling wrapper
  server.tool(
    "subtract",
    "Subtract two numbers",
    {
      a: z.number(),
      b: z.number(),
    },
    subtractToolWrapper
  );

  // Register the "screenshot" tool with error handling wrapper
  server.tool(
    "screenshot",
    "Capture screenshots of web pages using Puppeteer",
    {
      url: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
      fullPage: z.boolean().optional(),
      outputPath: z.string().optional(),
    },
    screenshotToolWrapper
  );

  log('MCP Server created with add, subtract and screenshot tools');
  return server;
};