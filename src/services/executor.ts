import { exec } from 'child_process';
import { promisify } from 'util';
import type { ServiceConfig } from '../config/schema.js';

const execAsync = promisify(exec);

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Build command arguments array
 */
function buildCommandArgs(
  service: ServiceConfig,
  prompt: string,
  model?: string,
  workingDir?: string
): string[] {
  const args: string[] = [];
  const options = service.options;

  // Add model flag
  const modelToUse = model || service.model;
  if (options.modelFlag && modelToUse) {
    args.push(options.modelFlag, modelToUse);
  }

  // Add working directory flag
  if (options.dirFlag && workingDir) {
    args.push(options.dirFlag, workingDir);
  }

  // Add input format flag if needed and configured
  if (options.inputFormat === 'stream-json' && options.inputFormatFlag) {
    args.push(options.inputFormatFlag, 'stream-json');
  }

  // Add output format flag if needed and configured
  if (options.outputFormat === 'json' && options.outputFormatFlag) {
    args.push(options.outputFormatFlag, 'json');
  }

  // Add prompt
  if (options.promptFlag === 'positional') {
    args.push(prompt);
  } else {
    args.push(options.promptFlag, prompt);
  }

  return args;
}

/**
 * Build environment variables object
 */
function buildEnv(service: ServiceConfig): Record<string, string> {
  const env: Record<string, string> = {};
  
  // Copy existing environment variables, filtering out undefined values
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }

  if (service.env) {
    for (const [key, value] of Object.entries(service.env)) {
      // Support environment variable substitution: ${VAR_NAME}
      const substituted = value.replace(/\$\{(\w+)\}/g, (_, varName) => {
        return process.env[varName] || '';
      });
      env[key] = substituted;
    }
  }

  return env;
}

/**
 * Execute shell command for a service
 */
export async function executeService(
  service: ServiceConfig,
  prompt: string,
  model?: string,
  customWorkingDir?: string
): Promise<ExecutionResult> {
  // Determine working directory
  const workingDir = customWorkingDir || service.workingDir || process.cwd();

  // Build command
  const args = buildCommandArgs(service, prompt, model, workingDir);
  const command = [service.command, ...args].join(' ');

  // Build environment variables
  const env = buildEnv(service);

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workingDir,
      env,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    return {
      stdout,
      stderr,
      exitCode: 0,
    };
  } catch (error: any) {
    // execAsync throws on non-zero exit codes
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code || 1,
    };
  }
}

