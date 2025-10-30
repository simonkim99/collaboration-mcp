import { Readable } from 'stream';
// @ts-ignore - stream-json doesn't have types (CommonJS)
import streamJson from 'stream-json';
const { parser: jsonParser } = streamJson;
// @ts-ignore - stream-json doesn't have types (CommonJS)
import StreamValuesModule from 'stream-json/streamers/StreamValues.js';
const StreamValues = StreamValuesModule.default || StreamValuesModule;
// @ts-ignore - stream-chain doesn't have types (CommonJS)
import streamChain from 'stream-chain';
const { chain } = streamChain;

/**
 * Parse stream-json output into readable format
 * Handles both JSON Lines format (one JSON object per line) and regular JSON
 */
export async function parseStreamJson(output: string): Promise<string> {
  try {
    // Check if output is JSON Lines format (one JSON object per line)
    const lines = output.trim().split('\n').filter(line => line.trim());
    
    if (lines.length > 0) {
      // Try parsing as JSON Lines first
      const parsedObjects: any[] = [];
      let hasValidJson = false;
      
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line.trim());
          parsedObjects.push(parsed);
          hasValidJson = true;
        } catch {
          // Not a valid JSON line, continue
        }
      }
      
      if (hasValidJson && parsedObjects.length > 0) {
        // Format JSON Lines as readable text
        // Extract assistant content if available
        const assistantMessages = parsedObjects
          .filter((obj: any) => obj.role === 'assistant' && obj.content)
          .map((obj: any) => obj.content);
        
        if (assistantMessages.length > 0) {
          return assistantMessages.join('\n\n');
        }
        
        // Otherwise format all objects
        return parsedObjects
          .map((item, index) => {
            if (typeof item === 'object') {
              return `[${index + 1}] ${JSON.stringify(item, null, 2)}`;
            }
            return `[${index + 1}] ${String(item)}`;
          })
          .join('\n\n');
      }
    }
    
    // Fallback to stream-json parser for regular JSON streams
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      
      // Create readable stream from string
      const inputStream = Readable.from([output]);
      
      const pipeline = chain([
        inputStream,
        jsonParser(),
        StreamValues.withParser()
      ]);

      pipeline.on('data', (data: any) => {
        if (data.value !== undefined) {
          results.push(data.value);
        }
      });

      pipeline.on('end', () => {
        try {
          // Format results as readable text
          const formatted = results
            .map((item, index) => {
              if (typeof item === 'object') {
                return `[${index + 1}] ${JSON.stringify(item, null, 2)}`;
              }
              return `[${index + 1}] ${String(item)}`;
            })
            .join('\n\n');
          
          resolve(formatted || output);
        } catch (error) {
          resolve(output); // Return original output if parsing fails
        }
      });

      pipeline.on('error', () => {
        resolve(output); // Return original output on error
      });
    });
  } catch (error) {
    // If all parsing fails, return original output
    return output;
  }
}

/**
 * Parse output based on format
 */
export async function parseOutput(output: string, format: 'text' | 'json'): Promise<string> {
  if (format === 'json') {
    return parseStreamJson(output);
  }
  return output;
}

