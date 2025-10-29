import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'http';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

const MCP_ENDPOINT = '/mcp';

/**
 * Handle HTTP request and route to MCP server
 */
async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  mcpServer: Server
): Promise<void> {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== MCP_ENDPOINT) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk.toString();
    }

    const request = JSON.parse(body);

    // Handle MCP request through server
    // Note: This is a simplified HTTP adapter
    // In a production system, you'd need to properly bridge HTTP to MCP protocol
    const response = await handleMcpRequest(mcpServer, request);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

/**
 * Handle MCP request (simplified for HTTP)
 */
async function handleMcpRequest(
  server: Server,
  request: any
): Promise<any> {
  // This is a simplified implementation
  // Full MCP protocol bridging would require more sophisticated handling
  if (request.method === 'tools/list') {
    // Return tools list
    return {
      tools: [
        {
          name: 'chat_with_service',
          description: 'Chat with a configured AI service',
        },
        {
          name: 'list_services',
          description: 'List all configured services',
        },
        {
          name: 'get_service_config',
          description: 'Get service configuration',
        },
        {
          name: 'add_service',
          description: 'Add a new service',
        },
        {
          name: 'update_service',
          description: 'Update a service',
        },
        {
          name: 'remove_service',
          description: 'Remove a service',
        },
      ],
    };
  }

  // For actual tool calls, you'd need to integrate with the server's request handlers
  // This is a placeholder implementation
  return { error: 'Not implemented in HTTP mode' };
}

/**
 * Start HTTP transport server
 */
export async function startHttpTransport(
  server: Server,
  port: number = 3000
): Promise<void> {
  return new Promise((resolve) => {
    const httpServer = createHttpServer((req, res) => {
      handleRequest(req, res, server).catch((error) => {
        console.error('HTTP request error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(error) }));
      });
    });

    httpServer.listen(port, () => {
      console.log(`MCP HTTP server listening on port ${port}`);
      console.log(`Endpoint: http://localhost:${port}${MCP_ENDPOINT}`);
      resolve();
    });
  });
}

