import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'http';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  InitializeRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  authenticateRequest,
  sendUnauthorized,
  isAuthenticationRequired,
} from '../auth/middleware.js';

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
  const allowedOrigins = process.env.MCP_CORS_ORIGINS?.split(',') || ['*'];
  const origin = req.headers.origin;
  const corsOrigin =
    allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))
      ? origin || '*'
      : allowedOrigins[0];

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle root path and health check
  if (req.url === '/' || req.url === '/health') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          service: 'collaboration-mcp',
          status: 'running',
          endpoint: MCP_ENDPOINT,
          transport: 'http',
          oauth2: isAuthenticationRequired() ? 'enabled' : 'disabled',
        })
      );
      return;
    }
  }

      // Handle OAuth2 callback
      if (req.url?.startsWith('/oauth2/callback')) {
        if (req.method === 'GET') {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');
          
          // Check for Implicit Flow token in fragment (need to parse manually since fragment isn't sent to server)
          // If we have hash in URL, it means client-side processing is needed
          const hasHash = req.url.includes('#');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>OAuth2 인증 오류</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .error { color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 4px; margin: 20px 0; }
              .code { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
            </style>
          </head>
          <body>
            <h1>OAuth2 인증 오류</h1>
            <div class="error">
              <strong>오류:</strong> ${error}<br>
              ${errorDescription ? `<strong>설명:</strong> ${errorDescription}` : ''}
            </div>
            <p>인증이 취소되었거나 실패했습니다.</p>
          </body>
          </html>
        `);
        return;
      }

      if (code) {
        // Extract and display the authorization code
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>OAuth2 인증 코드</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .success { color: #2e7d32; background: #e8f5e9; padding: 15px; border-radius: 4px; margin: 20px 0; }
              .code { background: #f5f5f5; padding: 15px; border-radius: 4px; font-family: monospace; word-break: break-all; margin: 10px 0; }
              .button { background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 10px 5px 10px 0; }
              .button:hover { background: #1565c0; }
              pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h1>OAuth2 인증 성공</h1>
            <div class="success">인증 코드를 받았습니다!</div>
            
            <h2>인증 코드:</h2>
            <div class="code">${code}</div>
            
            <h2>다음 단계:</h2>
            <p>터미널에서 다음 명령어를 실행하여 토큰을 교환하세요:</p>
            <pre>./get-synology-token.sh ${code}</pre>
            
            <p>또는 수동으로:</p>
            <pre>CODE="${code}"
curl -k -X POST https://backup.local:5001/webman/sso/SSOAccessToken.cgi \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d "grant_type=authorization_code" \\
  -d "code=\${CODE}" \\
  -d "client_id=96eca09f712a021c0252d9c40c866e91" \\
  -d "redirect_uri=http://ubun-ai.local:8091/oauth2/callback"</pre>
            
            <hr>
            <p><strong>⚠️ 참고:</strong> Public Client(시크릿 없음)의 경우 토큰 교환이 실패할 수 있습니다.</p>
            <p>대신 Implicit Flow를 사용하세요:</p>
            <pre>https://backup.local:5001/webman/sso/SSOOauth.cgi?client_id=96eca09f712a021c0252d9c40c866e91&response_type=token&redirect_uri=http://ubun-ai.local:8091/oauth2/callback&scope=openid+email</pre>
            <p>브라우저 주소창의 fragment(#)에서 access_token을 추출하세요.</p>
          </body>
          </html>
        `);
        return;
      }
      
      // Handle Implicit Flow - token in fragment (client-side processing needed)
      if (hasHash) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>OAuth2 토큰</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .success { color: #2e7d32; background: #e8f5e9; padding: 15px; border-radius: 4px; margin: 20px 0; }
              .code { background: #f5f5f5; padding: 15px; border-radius: 4px; font-family: monospace; word-break: break-all; margin: 10px 0; }
              pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h1>OAuth2 Implicit Flow</h1>
            <div id="result"></div>
            <script>
              const hash = window.location.hash.substring(1);
              const params = new URLSearchParams(hash);
              const accessToken = params.get('access_token');
              const error = params.get('error');
              const errorDescription = params.get('error_description');
              
              const resultDiv = document.getElementById('result');
              
              if (error) {
                resultDiv.innerHTML = '<div class="error" style="color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 4px;">' +
                  '<strong>오류:</strong> ' + error + '<br>' +
                  (errorDescription ? '<strong>설명:</strong> ' + errorDescription : '') +
                  '</div>';
              } else if (accessToken) {
                resultDiv.innerHTML = '<div class="success">토큰을 받았습니다!</div>' +
                  '<h2>Access Token:</h2>' +
                  '<div class="code">' + accessToken + '</div>' +
                  '<h2>사용 방법:</h2>' +
                  '<pre>export TOKEN="' + accessToken + '"\n' +
                  'curl -X POST http://ubun-ai.local:8091/mcp \\\n' +
                  '  -H "Content-Type: application/json" \\\n' +
                  '  -H "Authorization: Bearer $' + '{TOKEN}" \\\n' +
                  '  -d \'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}\'</pre>';
              } else {
                resultDiv.innerHTML = '<p>토큰을 찾을 수 없습니다.</p><p>URL: ' + window.location.href + '</p>';
              }
            </script>
          </body>
          </html>
        `);
        return;
      }

      // No code or error - show message
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>OAuth2 콜백</title>
        </head>
        <body>
          <h1>OAuth2 콜백</h1>
          <p>인증 코드나 오류 메시지가 없습니다.</p>
        </body>
        </html>
      `);
      return;
    }
  }

  // Only POST requests to /mcp endpoint are allowed
  if (req.method !== 'POST' || req.url !== MCP_ENDPOINT) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Not found',
        message: `Endpoint not found. Use POST ${MCP_ENDPOINT} for MCP requests.`,
        availableEndpoints: {
          mcp: `POST ${MCP_ENDPOINT}`,
          health: 'GET /health',
        },
      })
    );
    return;
  }

  // OAuth2 authentication check
  if (isAuthenticationRequired()) {
    const authContext = await authenticateRequest(req);
    if (!authContext.authenticated) {
      sendUnauthorized(res, 'OAuth2 token required');
      return;
    }
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

// Store handlers for direct access
let listToolsHandler: ((request: any) => Promise<any>) | null = null;
let callToolHandler: ((request: any) => Promise<any>) | null = null;

/**
 * Register handlers from server (called after server setup)
 */
export function registerHandlers(
  listTools: (request: any) => Promise<any>,
  callTool: (request: any) => Promise<any>
): void {
  listToolsHandler = listTools;
  callToolHandler = callTool;
}

/**
 * Handle MCP request (bridged to server handlers)
 */
async function handleMcpRequest(
  server: Server,
  request: any
): Promise<any> {
  try {
    // Handle initialize request
    if (request.method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'collaboration-mcp',
            version: '0.1.0',
          },
        },
      };
    }

    // Handle tools/list request
    if (request.method === 'tools/list') {
      if (listToolsHandler) {
        const result = await listToolsHandler({} as any);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result,
        };
      }
      // Fallback: return empty tools list
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { tools: [] },
      };
    }

    // Handle tools/call request
    if (request.method === 'tools/call') {
      if (callToolHandler) {
        const result = await callToolHandler({
          params: request.params || {},
        } as any);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result,
        };
      }
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      };
    }

    // Unknown method
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32601,
        message: `Method not found: ${request.method}`,
      },
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Start HTTP transport server
 */
export async function startHttpTransport(
  server: Server,
  port: number = 3000,
  handlers?: {
    listTools: (request: any) => Promise<any>;
    callTool: (request: any) => Promise<any>;
  }
): Promise<void> {
  // Register handlers if provided
  if (handlers) {
    registerHandlers(handlers.listTools, handlers.callTool);
  }

  return new Promise((resolve) => {
    const httpServer = createHttpServer((req, res) => {
      handleRequest(req, res, server).catch((error) => {
        console.error('HTTP request error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(error) }));
      });
    });

    httpServer.listen(port, '0.0.0.0', () => {
      const hostname = process.env.MCP_HOSTNAME || 'ubun-ai.local';
      console.log(`MCP HTTP server listening on port ${port}`);
      console.log(`Endpoint: http://${hostname}:${port}${MCP_ENDPOINT}`);
      console.log(`Health check: http://${hostname}:${port}/health`);
      resolve();
    });
  });
}

