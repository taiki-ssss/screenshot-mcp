import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import debug from 'debug';
import { screenshotToolWrapper } from '../screenshot/index.js';

const log = debug('mcp:screenshot');




export function createStdioServer(): McpServer {
  log('Creating MCP Server instance');

  const server = new McpServer({
    name: "screenshot-mcp-server",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Register the "screenshot" tool with error handling wrapper
  server.tool(
    "screenshot",
    "Capture screenshots of web pages using Puppeteer with lazy loading support",
    {
      url: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
      fullPage: z.boolean().optional(),
      outputPath: z.string().optional(),
    },
    screenshotToolWrapper
  );

  log('MCP Server created with screenshot tool');
  return server;
};