import type { ServiceConfig } from '../config/schema.js';

/**
 * Format prompt with role and personality
 */
export function formatPrompt(
  service: ServiceConfig,
  prompt: string,
  useInference: boolean = false
): string {
  // Build role and personality prefix
  const rolePart = service.role ? `You are ${service.name}, a ${service.role}.` : '';
  const personalityPart = service.personality 
    ? ` Your personality: ${service.personality}.`
    : '';
  
  const prefix = rolePart + personalityPart;
  
  // If using inference model, we might want to add reasoning instructions
  // For now, just prepend the role/personality
  if (prefix) {
    return `${prefix}\n\n${prompt}`;
  }
  
  return prompt;
}

/**
 * Determine which model to use
 */
export function getModelToUse(
  service: ServiceConfig,
  useInference: boolean,
  overrideModel?: string
): string {
  if (overrideModel) {
    return overrideModel;
  }
  
  if (useInference && service.inferenceModel) {
    return service.inferenceModel;
  }
  
  return service.model;
}

