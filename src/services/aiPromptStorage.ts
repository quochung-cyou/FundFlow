import { Fund } from "@/types";

// Interface for storing AI prompts
export interface StoredAIPrompt {
  id: string;
  prompt: string;
  fundId: string;
  timestamp: number;
  description?: string;
}

const STORAGE_KEY = 'fund-flow-ai-prompts';
const MAX_STORED_PROMPTS = 10;

/**
 * Save an AI prompt to local storage
 * @param prompt The prompt text used for the AI
 * @param fund The fund context for the prompt
 * @param description Optional description of the transaction
 * @returns The stored prompt object
 */
export const saveAIPrompt = (prompt: string, fund: Fund, description?: string): StoredAIPrompt => {
  // Create a new prompt object
  const newPrompt: StoredAIPrompt = {
    id: generateId(),
    prompt,
    fundId: fund.id,
    timestamp: Date.now(),
    description
  };
  
  // Get existing prompts
  const existingPrompts = getAIPrompts();
  
  // Add new prompt to the beginning of the array
  const updatedPrompts = [newPrompt, ...existingPrompts];
  
  // Limit to max number of prompts
  const limitedPrompts = updatedPrompts.slice(0, MAX_STORED_PROMPTS);
  
  // Save to local storage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedPrompts));
  
  return newPrompt;
};

/**
 * Get all stored AI prompts
 * @returns Array of stored prompts
 */
export const getAIPrompts = (): StoredAIPrompt[] => {
  try {
    const storedPrompts = localStorage.getItem(STORAGE_KEY);
    if (!storedPrompts) return [];
    
    return JSON.parse(storedPrompts);
  } catch (error) {
    console.error('Error retrieving AI prompts from storage:', error);
    return [];
  }
};

/**
 * Get AI prompts for a specific fund
 * @param fundId The fund ID to filter prompts by
 * @returns Array of stored prompts for the specified fund
 */
export const getAIPromptsForFund = (fundId: string): StoredAIPrompt[] => {
  const allPrompts = getAIPrompts();
  return allPrompts.filter(prompt => prompt.fundId === fundId);
};

/**
 * Delete a stored AI prompt
 * @param promptId The ID of the prompt to delete
 * @returns True if deletion was successful
 */
export const deleteAIPrompt = (promptId: string): boolean => {
  const existingPrompts = getAIPrompts();
  const updatedPrompts = existingPrompts.filter(prompt => prompt.id !== promptId);
  
  if (updatedPrompts.length === existingPrompts.length) {
    return false; // No prompt was deleted
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrompts));
  return true;
};

/**
 * Clear all stored AI prompts
 */
export const clearAllAIPrompts = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Generate a simple ID for prompts
 * @returns A unique ID string
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};
