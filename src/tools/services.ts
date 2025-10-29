import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  getAllServices,
  findService,
  addService,
  updateService,
  removeService,
} from '../config/manager.js';
import type { ServiceConfig } from '../config/schema.js';

/**
 * List all services
 */
export function listServices(): CallToolResult {
  try {
    const services = getAllServices();
    
    if (services.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No services configured.',
          },
        ],
      };
    }

    const serviceList = services
      .map((service) => {
        const aliases = service.aliases && service.aliases.length > 0
          ? ` (aliases: ${service.aliases.join(', ')})`
          : '';
        return `- ${service.name}${aliases}: ${service.command} -m ${service.model}`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Available services:\n\n${serviceList}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error listing services: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Get service configuration
 */
export function getServiceConfig(nameOrAlias: string): CallToolResult {
  try {
    const service = findService(nameOrAlias);
    
    if (!service) {
      return {
        content: [
          {
            type: 'text',
            text: `Service "${nameOrAlias}" not found.`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(service, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting service config: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Add a new service
 */
export function addNewService(serviceConfig: ServiceConfig): CallToolResult {
  try {
    addService(serviceConfig);
    return {
      content: [
        {
          type: 'text',
          text: `Service "${serviceConfig.name}" added successfully.`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error adding service: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Update a service
 */
export function updateExistingService(
  nameOrAlias: string,
  updates: Partial<ServiceConfig>
): CallToolResult {
  try {
    updateService(nameOrAlias, updates);
    return {
      content: [
        {
          type: 'text',
          text: `Service "${nameOrAlias}" updated successfully.`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error updating service: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Remove a service
 */
export function removeExistingService(nameOrAlias: string): CallToolResult {
  try {
    removeService(nameOrAlias);
    return {
      content: [
        {
          type: 'text',
          text: `Service "${nameOrAlias}" removed successfully.`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error removing service: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

