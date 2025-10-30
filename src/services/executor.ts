import { exec, execFile, spawn } from 'child_process';
import { promisify } from 'util';
import type { ServiceConfig } from '../config/schema.js';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

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

  // Add default flags first (e.g., '-y')
  if (options.defaultFlags && options.defaultFlags.length > 0) {
    args.push(...options.defaultFlags);
  }

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
    // For positional arguments, add the prompt as-is
    // The shell will handle proper quoting
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

  // Build command arguments
  const args = buildCommandArgs(service, prompt, model, workingDir);

  // Build environment variables
  const env = buildEnv(service);

  try {
    // Check if stdin should be used based on configuration
    const needsStdin = service.options.useStdin === true;
    
    if (needsStdin) {
      // Use spawn for commands that need stdin input
      return await new Promise<ExecutionResult>((resolve) => {
        const child = spawn(service.command, args, {
          cwd: workingDir,
          env,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';
        let exitCode = 0;

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          exitCode = code || 0;
          resolve({ stdout, stderr, exitCode });
        });

        child.on('error', (error) => {
          stderr += error.message;
          exitCode = 1;
          resolve({ stdout, stderr, exitCode });
        });

        // Send formatted prompt via stdin
        // Note: prompt is already formatted with role/personality in chat.ts
        // For grok CLI, we need to send the prompt and wait for response
        child.stdin.write(prompt + '\n');
        
        // For interactive CLIs like grok, we may need to send exit command after response
        // But let's wait for stdout first
        
        // Set timeout (30 seconds for AI responses)
        const timeout = setTimeout(() => {
          if (!child.killed) {
            child.kill();
            resolve({ stdout, stderr: stderr + '\nTimeout after 30 seconds', exitCode: 1 });
          }
        }, 30000);
        
        // Clear timeout when process closes
        child.on('close', () => {
          clearTimeout(timeout);
        });
        
        // Close stdin after writing (some CLIs need this)
        child.stdin.end();
      });
    } else {
      // Use execFile for commands that don't need stdin
      const { stdout, stderr } = await execFileAsync(service.command, args, {
        cwd: workingDir,
        env,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      return {
        stdout,
        stderr,
        exitCode: 0,
      };
    }
  } catch (error: any) {
    // execFileAsync throws on non-zero exit codes
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code || 1,
    };
  }
}

