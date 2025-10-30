import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chatWithService } from './tools/chat.js';
import { chatWithNaturalInput } from './tools/natural-chat.js';
import {
  listServices,
  getServiceConfig,
  addNewService,
  updateExistingService,
  removeExistingService,
} from './tools/services.js';
import type { ServiceConfig } from './config/schema.js';

/**
 * Create and configure MCP server
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: 'collaboration-mcp',
      version: '0.1.0',
      description: 'MCP server for chatting with AI services. When users mention service names like "제니" or "jenny" followed by a message, automatically use chat_natural tool to route to that service.',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'chat_with_service',
          description: 'Chat with a configured AI service by name or alias',
          inputSchema: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                description: 'Service name or alias',
              },
              prompt: {
                type: 'string',
                description: 'Prompt to send to the service',
              },
              useInference: {
                type: 'boolean',
                description: 'Use inference model instead of default model',
                default: false,
              },
              model: {
                type: 'string',
                description: 'Override model (optional)',
              },
            },
            required: ['service', 'prompt'],
          },
        },
        {
          name: 'chat_natural',
          description: 'Immediately execute chat with AI service when user mentions service name. DO NOT ask for confirmation. When user says "제니 안녕" or "jenny hello", IMMEDIATELY call this tool with the full user input. This tool automatically detects service name and routes the message. Services: 제니/jenny, 제나/jenna. Execute automatically without asking.',
          inputSchema: {
            type: 'object',
            properties: {
              input: {
                type: 'string',
                description: 'EXACT user input when they mention a service name. DO NOT modify. Pass as-is. Examples: "제니 안녕?", "jenny hello", "제나 질문해도 될까요?". Execute immediately.',
              },
              useInference: {
                type: 'boolean',
                description: 'Use inference model instead of default model',
                default: false,
              },
              model: {
                type: 'string',
                description: 'Override model (optional)',
              },
            },
            required: ['input'],
          },
        },
        {
          name: 'list_services',
          description: 'List all configured services',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_service_config',
          description: 'Get configuration for a specific service by name or alias',
          inputSchema: {
            type: 'object',
            properties: {
              nameOrAlias: {
                type: 'string',
                description: 'Service name or alias',
              },
            },
            required: ['nameOrAlias'],
          },
        },
        {
          name: 'add_service',
          description: 'Add a new service configuration',
          inputSchema: {
            type: 'object',
            properties: {
              serviceConfig: {
                type: 'object',
                description: 'Service configuration object',
              },
            },
            required: ['serviceConfig'],
          },
        },
        {
          name: 'update_service',
          description: 'Update an existing service configuration',
          inputSchema: {
            type: 'object',
            properties: {
              nameOrAlias: {
                type: 'string',
                description: 'Service name or alias to update',
              },
              updates: {
                type: 'object',
                description: 'Partial service configuration to update',
              },
            },
            required: ['nameOrAlias', 'updates'],
          },
        },
        {
          name: 'remove_service',
          description: 'Remove a service configuration',
          inputSchema: {
            type: 'object',
            properties: {
              nameOrAlias: {
                type: 'string',
                description: 'Service name or alias to remove',
              },
            },
            required: ['nameOrAlias'],
          },
        },
      ],
    };
  });

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'chat_with_service': {
          const { service, prompt, useInference, model } = args as {
            service: string;
            prompt: string;
            useInference?: boolean;
            model?: string;
          };
          return await chatWithService(service, prompt, useInference, model);
        }

        case 'chat_natural': {
          const { input, useInference, model } = args as {
            input: string;
            useInference?: boolean;
            model?: string;
          };
          return await chatWithNaturalInput(input, useInference, model);
        }

        case 'list_services':
          return listServices();

        case 'get_service_config': {
          const { nameOrAlias } = args as { nameOrAlias: string };
          return getServiceConfig(nameOrAlias);
        }

        case 'add_service': {
          const { serviceConfig } = args as { serviceConfig: ServiceConfig };
          return addNewService(serviceConfig);
        }

        case 'update_service': {
          const { nameOrAlias, updates } = args as {
            nameOrAlias: string;
            updates: Partial<ServiceConfig>;
          };
          return updateExistingService(nameOrAlias, updates);
        }

        case 'remove_service': {
          const { nameOrAlias } = args as { nameOrAlias: string };
          return removeExistingService(nameOrAlias);
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool "${name}": ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Get handlers for HTTP transport
 */
export function getHandlers(server: Server) {
  // Create wrapper functions that call the server's handlers
  const listToolsHandler = async () => {
    // Create a mock request that will trigger the handler
    const mockRequest = {} as any;
    // The server's setRequestHandler will handle this
    // We need to call it differently for HTTP transport
    // For now, return the tools list directly
    return {
      tools: [
        {
          name: 'chat_with_service',
          description: 'Chat with a configured AI service by name or alias',
          inputSchema: {
            type: 'object',
            properties: {
              service: { type: 'string', description: 'Service name or alias' },
              prompt: { type: 'string', description: 'Prompt to send to the service' },
              useInference: { type: 'boolean', description: 'Use inference model instead of default model', default: false },
              model: { type: 'string', description: 'Override model (optional)' },
            },
            required: ['service', 'prompt'],
          },
        },
        {
          name: 'chat_natural',
          description: 'Immediately execute chat with AI service when user mentions service name',
          inputSchema: {
            type: 'object',
            properties: {
              input: { type: 'string', description: 'EXACT user input when they mention a service name' },
              useInference: { type: 'boolean', description: 'Use inference model instead of default model', default: false },
              model: { type: 'string', description: 'Override model (optional)' },
            },
            required: ['input'],
          },
        },
        {
          name: 'list_services',
          description: 'List all configured services',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'get_service_config',
          description: 'Get configuration for a specific service by name or alias',
          inputSchema: {
            type: 'object',
            properties: {
              nameOrAlias: { type: 'string', description: 'Service name or alias' },
            },
            required: ['nameOrAlias'],
          },
        },
        {
          name: 'add_service',
          description: 'Add a new service configuration',
          inputSchema: {
            type: 'object',
            properties: {
              serviceConfig: { type: 'object', description: 'Service configuration object' },
            },
            required: ['serviceConfig'],
          },
        },
        {
          name: 'update_service',
          description: 'Update an existing service configuration',
          inputSchema: {
            type: 'object',
            properties: {
              nameOrAlias: { type: 'string', description: 'Service name or alias to update' },
              updates: { type: 'object', description: 'Partial service configuration to update' },
            },
            required: ['nameOrAlias', 'updates'],
          },
        },
        {
          name: 'remove_service',
          description: 'Remove a service configuration',
          inputSchema: {
            type: 'object',
            properties: {
              nameOrAlias: { type: 'string', description: 'Service name or alias to remove' },
            },
            required: ['nameOrAlias'],
          },
        },
      ],
    };
  };

  const callToolHandler = async (request: { params: { name: string; arguments?: any } }) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'chat_with_service': {
          const { service, prompt, useInference, model } = args as {
            service: string;
            prompt: string;
            useInference?: boolean;
            model?: string;
          };
          return await chatWithService(service, prompt, useInference, model);
        }

        case 'chat_natural': {
          const { input, useInference, model } = args as {
            input: string;
            useInference?: boolean;
            model?: string;
          };
          return await chatWithNaturalInput(input, useInference, model);
        }

        case 'list_services':
          return listServices();

        case 'get_service_config': {
          const { nameOrAlias } = args as { nameOrAlias: string };
          return getServiceConfig(nameOrAlias);
        }

        case 'add_service': {
          const { serviceConfig } = args as { serviceConfig: ServiceConfig };
          return addNewService(serviceConfig);
        }

        case 'update_service': {
          const { nameOrAlias, updates } = args as {
            nameOrAlias: string;
            updates: Partial<ServiceConfig>;
          };
          return updateExistingService(nameOrAlias, updates);
        }

        case 'remove_service': {
          const { nameOrAlias } = args as { nameOrAlias: string };
          return removeExistingService(nameOrAlias);
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool "${name}": ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  };

  return { listTools: listToolsHandler, callTool: callToolHandler };
}

