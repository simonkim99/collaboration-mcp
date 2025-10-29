import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chatWithService } from './tools/chat.js';
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

