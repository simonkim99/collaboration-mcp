import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { findService } from '../config/manager.js';
import { executeService } from '../services/executor.js';
import { parseOutput } from '../services/parser.js';
import { formatPrompt, getModelToUse } from '../services/formatter.js';

/**
 * Chat with a service
 */
export async function chatWithService(
  serviceName: string,
  prompt: string,
  useInference: boolean = false,
  model?: string
): Promise<CallToolResult> {
  try {
    // Find service by name or alias
    const service = findService(serviceName);
    if (!service) {
      return {
        content: [
          {
            type: 'text',
            text: `Service "${serviceName}" not found. Use list_services to see available services.`,
          },
        ],
        isError: true,
      };
    }

    // Format prompt with role and personality
    const formattedPrompt = formatPrompt(service, prompt, useInference);

    // Determine model to use
    const modelToUse = getModelToUse(service, useInference, model);

    // Execute service command
    const result = await executeService(service, formattedPrompt, modelToUse);

    if (result.exitCode !== 0 && result.stderr) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing service "${serviceName}":\n${result.stderr}`,
          },
        ],
        isError: true,
      };
    }

    // Parse output based on format
    const parsedOutput = await parseOutput(
      result.stdout,
      service.options.outputFormat
    );

    return {
      content: [
        {
          type: 'text',
          text: parsedOutput,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

