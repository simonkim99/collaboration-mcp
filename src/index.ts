#!/usr/bin/env node

import { createServer } from './server.js';
import { startStdioTransport } from './transport/stdio.js';
import { startHttpTransport } from './transport/http.js';

const TRANSPORT = process.env.MCP_TRANSPORT || 'stdio';
const HTTP_PORT = parseInt(process.env.MCP_HTTP_PORT || '3000', 10);

async function main() {
  const server = createServer();

  if (TRANSPORT === 'http') {
    await startHttpTransport(server, HTTP_PORT);
  } else {
    await startStdioTransport(server);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

