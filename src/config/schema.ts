/**
 * Service configuration schema types
 */

export interface ServiceOptions {
  /** Prompt flag format: '-p' or 'positional' */
  promptFlag: string;
  /** Model flag: e.g., '-m' */
  modelFlag: string;
  /** Directory flag: e.g., '-d' */
  dirFlag: string;
  /** Input format: 'text' (default) or 'stream-json' */
  inputFormat: 'text' | 'stream-json';
  /** Output format: 'text' (default) or 'json' */
  outputFormat: 'text' | 'json';
  /** Input format flag: e.g., '--input-format' (optional) */
  inputFormatFlag?: string;
  /** Output format flag: e.g., '--output-format' (optional) */
  outputFormatFlag?: string;
  /** Default flags to always include: e.g., ['-y'] (optional) */
  defaultFlags?: string[];
}

export interface ServiceConfig {
  /** Service name (unique identifier) */
  name: string;
  /** Alternative names/aliases for the service */
  aliases?: string[];
  /** Shell command to execute */
  command: string;
  /** Default model to use */
  model: string;
  /** Inference model for reasoning mode (optional) */
  inferenceModel?: string;
  /** Command options */
  options: ServiceOptions;
  /** Environment variables to set before execution */
  env?: Record<string, string>;
  /** Default role (e.g., 'assistant') */
  role: string;
  /** Personality description */
  personality: string;
  /** Working directory (null = use process.cwd() dynamically) */
  workingDir?: string | null;
}

export interface ServicesConfig {
  services: ServiceConfig[];
}

