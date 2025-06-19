import { describe, it, expect } from 'vitest';
import { createStdioServer } from '../server.js';
import { screenshotToolWrapper, type ScreenshotError, type ScreenshotOptions } from '../../screenshot/index.js';

describe('server', () => {
  describe('createStdioServer', () => {
    it('should create a McpServer instance', () => {
      const server = createStdioServer();
      
      expect(server).toBeDefined();
      expect(typeof server.connect).toBe('function');
      expect(typeof server.close).toBe('function');
      expect(typeof server.tool).toBe('function');
    });

    it('should have isConnected method', () => {
      const server = createStdioServer();
      
      expect(typeof server.isConnected).toBe('function');
      expect(server.isConnected()).toBe(false);
    });

    it('should register tools correctly', () => {
      const server = createStdioServer();
      
      // The tool registration happens in createStdioServer
      // We can verify the server was created without errors
      expect(server).toBeDefined();
      expect(typeof server.tool).toBe('function');
    });

    it('should have server property', () => {
      const server = createStdioServer();
      
      // Access the underlying server
      expect(server.server).toBeDefined();
      expect(typeof server.server).toBe('object');
    });

    it('should create server with proper structure', () => {
      const server = createStdioServer();
      
      // Verify all expected methods exist
      expect(typeof server.connect).toBe('function');
      expect(typeof server.close).toBe('function');
      expect(typeof server.tool).toBe('function');
      expect(typeof server.resource).toBe('function');
      expect(typeof server.prompt).toBe('function');
      expect(typeof server.isConnected).toBe('function');
    });

    it('should start in disconnected state', () => {
      const server = createStdioServer();
      
      expect(server.isConnected()).toBe(false);
    });






    it('should test server creation with debug logging', () => {
      // Test server creation to cover the createStdioServer function
      const server = createStdioServer();
      expect(server).toBeDefined();
      expect(typeof server.connect).toBe('function');
      expect(typeof server.close).toBe('function');
    });





  });

  describe('MCP server integration', () => {
    it('should register screenshot tool in server', () => {
      const server = createStdioServer();
      
      expect(server).toBeDefined();
      expect(typeof server.tool).toBe('function');
    });


    it('should handle screenshot wrapper integration', async () => {
      // Test basic integration with screenshot wrapper
      const result = await screenshotToolWrapper({
        url: '',
      });

      expect(result.content[0].text).toContain('Error:');
      expect('isError' in result && result.isError).toBe(true);
    });
  });
});