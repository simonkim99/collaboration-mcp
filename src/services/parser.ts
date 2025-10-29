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
 */
export async function parseStreamJson(output: string): Promise<string> {
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
        
        resolve(formatted || 'No output');
      } catch (error) {
        reject(new Error(`Failed to parse stream-json: ${error instanceof Error ? error.message : String(error)}`));
      }
    });

    pipeline.on('error', (error: Error) => {
      reject(error);
    });
  });
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

