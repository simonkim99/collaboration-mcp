import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { ServiceConfig, ServicesConfig } from './schema.js';

const CONFIG_DIR = join(process.cwd(), 'config');
const CONFIG_FILE = join(CONFIG_DIR, 'services.json');

/**
 * Load services configuration from file
 */
export function loadConfig(): ServicesConfig {
  if (!existsSync(CONFIG_FILE)) {
    return { services: [] };
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content) as ServicesConfig;
    validateConfig(config);
    return config;
  } catch (error) {
    throw new Error(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Save services configuration to file
 */
export function saveConfig(config: ServicesConfig): void {
  validateConfig(config);
  
  // Ensure config directory exists
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Validate configuration structure
 */
function validateConfig(config: ServicesConfig): void {
  if (!config || typeof config !== 'object') {
    throw new Error('Config must be an object');
  }

  if (!Array.isArray(config.services)) {
    throw new Error('Config must have a services array');
  }

  const names = new Set<string>();
  const aliasesSet = new Set<string>();

  for (const service of config.services) {
    // Validate required fields
    if (!service.name || typeof service.name !== 'string') {
      throw new Error('Service must have a name (string)');
    }

    // Check for duplicate names
    if (names.has(service.name)) {
      throw new Error(`Duplicate service name: ${service.name}`);
    }
    names.add(service.name);

    // Check for duplicate aliases
    if (service.aliases) {
      for (const alias of service.aliases) {
        if (names.has(alias)) {
          throw new Error(`Alias conflicts with service name: ${alias}`);
        }
        if (aliasesSet.has(alias)) {
          throw new Error(`Duplicate alias: ${alias}`);
        }
        aliasesSet.add(alias);
      }
    }

    // Validate options
    if (!service.options || typeof service.options !== 'object') {
      throw new Error(`Service ${service.name} must have options`);
    }

    if (!service.command || typeof service.command !== 'string') {
      throw new Error(`Service ${service.name} must have a command`);
    }

    if (!service.model || typeof service.model !== 'string') {
      throw new Error(`Service ${service.name} must have a model`);
    }
  }
}

/**
 * Find service by name or alias
 */
export function findService(nameOrAlias: string): ServiceConfig | undefined {
  const config = loadConfig();
  return config.services.find(
    (service) =>
      service.name === nameOrAlias ||
      service.aliases?.includes(nameOrAlias)
  );
}

/**
 * Get all services
 */
export function getAllServices(): ServiceConfig[] {
  return loadConfig().services;
}

/**
 * Add a new service
 */
export function addService(service: ServiceConfig): void {
  const config = loadConfig();
  
  // Check for conflicts
  if (findService(service.name)) {
    throw new Error(`Service with name or alias "${service.name}" already exists`);
  }

  config.services.push(service);
  saveConfig(config);
}

/**
 * Update an existing service
 */
export function updateService(nameOrAlias: string, updates: Partial<ServiceConfig>): void {
  const config = loadConfig();
  const index = config.services.findIndex(
    (service) =>
      service.name === nameOrAlias ||
      service.aliases?.includes(nameOrAlias)
  );

  if (index === -1) {
    throw new Error(`Service "${nameOrAlias}" not found`);
  }

  // Prevent name conflicts if updating name
  if (updates.name && updates.name !== config.services[index].name) {
    if (findService(updates.name)) {
      throw new Error(`Service with name "${updates.name}" already exists`);
    }
  }

  config.services[index] = { ...config.services[index], ...updates };
  saveConfig(config);
}

/**
 * Remove a service
 */
export function removeService(nameOrAlias: string): void {
  const config = loadConfig();
  const index = config.services.findIndex(
    (service) =>
      service.name === nameOrAlias ||
      service.aliases?.includes(nameOrAlias)
  );

  if (index === -1) {
    throw new Error(`Service "${nameOrAlias}" not found`);
  }

  config.services.splice(index, 1);
  saveConfig(config);
}

