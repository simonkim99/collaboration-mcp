import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getAllServices, findService } from '../config/manager.js';
import { chatWithService } from './chat.js';

/**
 * Parse natural language input and route to appropriate service
 * Examples:
 * - "제니 안녕" -> service: "제니", prompt: "안녕"
 * - "jenny hello" -> service: "jenny", prompt: "hello"
 * - "제나 질문" -> service: "제나", prompt: "질문"
 */
function parseNaturalInput(input: string): { serviceName: string; prompt: string } | null {
  const services = getAllServices();
  
  // Try to find service name at the start of input
  for (const service of services) {
    // Check exact name match
    if (input.startsWith(service.name + ' ') || input.startsWith(service.name + ':')) {
      const prompt = input.substring(service.name.length).trim();
      if (prompt) {
        return { serviceName: service.name, prompt };
      }
    }
    
    // Check aliases
    if (service.aliases) {
      for (const alias of service.aliases) {
        if (input.startsWith(alias + ' ') || input.startsWith(alias + ':')) {
          const prompt = input.substring(alias.length).trim();
          if (prompt) {
            return { serviceName: service.name, prompt };
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Chat with natural language input
 * Automatically detects service name and routes the message
 */
export async function chatWithNaturalInput(
  input: string,
  useInference: boolean = false,
  model?: string
): Promise<CallToolResult> {
  try {
    const parsed = parseNaturalInput(input);
    
    if (!parsed) {
      // If no service found, return error with available services
      const services = getAllServices();
      const serviceList = services
        .map((s) => {
          const aliases = s.aliases && s.aliases.length > 0
            ? ` (${s.aliases.join(', ')})`
            : '';
          return `- ${s.name}${aliases}`;
        })
        .join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `서비스 이름을 찾을 수 없습니다. 사용 가능한 서비스:\n\n${serviceList}\n\n사용 예시: "제니 안녕하세요" 또는 "jenny hello"`,
          },
        ],
        isError: true,
      };
    }
    
    // Use existing chatWithService function
    return await chatWithService(parsed.serviceName, parsed.prompt, useInference, model);
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

