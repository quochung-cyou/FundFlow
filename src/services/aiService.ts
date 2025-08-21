
import { Fund, User, AIApiKey, AIUsageStats } from "@/types";
import { doc, getDoc, updateDoc, Timestamp, setDoc, increment } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { v4 as uuidv4 } from 'uuid';
import { TransactionFormValidator, ValidationError } from './TransactionFormValidator';
import { generateTransactionParserPrompt } from '@/prompts/transactionParser';

export interface LLMTransactionResponse {
  desc: string;
  totalAmount: number;
  payer: string;
  users: Record<string, string>; // username: amount (positive for receiving, negative for paying)
  reasoning?: string; // Vietnamese reasoning explaining the transaction split logic
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'groq';
  apiEndpoint: string;
  maxTokens: number;
  isAvailable: boolean;
  description: string;
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    maxTokens: 8192,
    isAvailable: true,
    description: 'Next generation, speed and thinking'
  },
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    maxTokens: 4096,
    isAvailable: true,
    description: 'High quality open source model'
  }
];

/**
 * Get active API key for a fund
 * @param fund Fund data containing potential API keys
 * @param preferredProvider Optional preferred provider
 * @returns Active API key or null if none found
 */
export const getActiveApiKey = async (
  fund: Fund,
  preferredProvider: 'google' | 'openai' | 'groq' = 'google'
): Promise<AIApiKey | null> => {
  try {
    // First check for API keys in the fund data
    if (fund.aiApiKeys && fund.aiApiKeys.length > 0) {
      // Try to find an active key with the preferred provider
      const preferredKey = fund.aiApiKeys.find(
        key => key.isActive && key.provider === preferredProvider
      );

      if (preferredKey) {
        return preferredKey;
      }

      // If no preferred provider key found, return any active key
      const anyActiveKey = fund.aiApiKeys.find(key => key.isActive);
      if (anyActiveKey) {
        return anyActiveKey;
      }
    }

    // If we couldn't find an appropriate key in the fund, 
    // fetch the latest fund data to ensure we have the most up-to-date keys
    if (fund.id) {
      const fundRef = doc(db, 'funds', fund.id);
      const fundDoc = await getDoc(fundRef);

      if (fundDoc.exists()) {
        const latestFund = fundDoc.data() as Fund;
        if (latestFund.aiApiKeys && latestFund.aiApiKeys.length > 0) {
          // Try again with the latest data
          const freshPreferredKey = latestFund.aiApiKeys.find(
            key => key.isActive && key.provider === preferredProvider
          );

          if (freshPreferredKey) {
            return freshPreferredKey;
          }

          const freshAnyKey = latestFund.aiApiKeys.find(key => key.isActive);
          if (freshAnyKey) {
            return freshAnyKey;
          }
        }
      }
    }

    // If still no keys found, return null
    return null;
  } catch (error) {
    console.error('Error getting active API key:', error);
    return null;
  }
};


export const updateAIUsageStats = async (fundId: string, increment: number = 1): Promise<void> => {
  if (!fundId) return;

  try {
    const fundRef = doc(db, 'funds', fundId);
    const fundDoc = await getDoc(fundRef);

    if (!fundDoc.exists()) {
      console.error('Fund not found for updating AI usage stats');
      return;
    }

    const fund = fundDoc.data() as Fund;
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    let usageStats: AIUsageStats = fund.aiUsageStats || {
      lastUpdated: Date.now(),
      todayCalls: 0,
      todayDate: today,
      totalCalls: 0,
      history: []
    };

    // Reset today's count if it's a new day
    if (usageStats.todayDate !== today) {
      // Add yesterday's stats to history if we have data
      if (usageStats.todayCalls > 0) {
        usageStats.history.push({
          date: usageStats.todayDate,
          calls: usageStats.todayCalls
        });
      }

      // Only keep the last 30 days in history
      if (usageStats.history.length > 30) {
        usageStats.history = usageStats.history.slice(-30);
      }

      usageStats.todayDate = today;
      usageStats.todayCalls = 0;
    }

    // Update counters
    usageStats.todayCalls += increment;
    usageStats.totalCalls += increment;
    usageStats.lastUpdated = Date.now();

    // Update the fund document
    await updateDoc(fundRef, {
      aiUsageStats: usageStats,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating AI usage stats:', error);
  }
};

/**
 * Get an API key for a specific provider (improved version with fallback logic and error handling)
 * @param fund Fund containing the API keys
 * @param provider Provider name (google, groq, openai)
 * @returns API key string or null if not available
 */
export const getApiKeyForProvider = async (
  fund: Fund,
  provider: 'google' | 'openai' | 'groq'
): Promise<string | null> => {
  try {
    // Try to get an active API key for the requested provider
    const apiKey = await getActiveApiKey(fund, provider);

    if (apiKey) {
      return apiKey.key;
    }

    return null;
  } catch (error) {
    console.error(`Error getting ${provider} API key:`, error);
    return null;
  }
};

/**
 * Get available models based on existing API keys
 * @param fund Fund containing the API keys
 * @returns Object with model availability information
 */
export const getAvailableModels = async (
  fund: Fund
): Promise<{ availableModels: AIModel[], availableProviders: ('google' | 'openai' | 'groq')[] }> => {
  try {
    // Check which providers have active API keys
    const activeProviders: ('google' | 'openai' | 'groq')[] = [];

    // Try to get fund with latest data including API keys
    let fundWithKeys = fund;
    if (fund.id) {
      const fundRef = doc(db, 'funds', fund.id);
      const fundDoc = await getDoc(fundRef);
      if (fundDoc.exists()) {
        fundWithKeys = { ...fundDoc.data(), id: fundDoc.id } as Fund;
      }
    }

    // Only check providers that have models defined
    const modelProviders = [...new Set(AI_MODELS.map(model => model.provider))];

    // Check each provider
    for (const provider of modelProviders as ('google' | 'openai' | 'groq')[]) {
      // Look for an active API key for this provider
      if (fundWithKeys.aiApiKeys && fundWithKeys.aiApiKeys.length > 0) {
        const hasActiveKey = fundWithKeys.aiApiKeys.some(
          key => key.isActive && key.provider === provider
        );

        if (hasActiveKey) {
          activeProviders.push(provider);
        }
      }
    }

    // Filter available models to only those with active API keys
    const availableModels = AI_MODELS.filter(model =>
      activeProviders.includes(model.provider as 'google' | 'openai' | 'groq')
    );

    // If no models available, return all models but mark them as unavailable
    if (availableModels.length === 0) {
      return {
        availableModels: AI_MODELS.map(model => ({ ...model, isAvailable: false })),
        availableProviders: []
      };
    }

    return { availableModels, availableProviders: activeProviders };
  } catch (error) {
    console.error('Error getting available models:', error);
    // In case of error, return all models but mark them as unavailable
    return {
      availableModels: AI_MODELS.map(model => ({ ...model, isAvailable: false })),
      availableProviders: []
    };
  }
};

export const parseTransactionWithLLM = async (
  message: string,
  fund: Fund,
  members: User[],
  currentUserId?: string,
  modelId: string = 'gemini-2.0-flash' // Default to Gemini 2.0 Flash
): Promise<LLMTransactionResponse> => {
  // Get the current user (if provided)
  const currentUser = currentUserId
    ? members.find(m => m.id === currentUserId)
    : undefined;

  // Get the current date in Vietnam timezone
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const currentDate = dateFormatter.format(now);

  try {
    // Get the selected model configuration
    const selectedModel = AI_MODELS.find(model => model.id === modelId) || AI_MODELS[0];

    // Get API key for the selected provider
    const apiKeyString = await getApiKeyForProvider(fund, selectedModel.provider);

    if (!apiKeyString) {
      throw new Error(`No active API key found for provider: ${selectedModel.provider}. Please add an API key in the fund settings.`);
    }

    // Generate the system message using the extracted prompt function
    const systemMessage = generateTransactionParserPrompt(fund, members, currentUser, currentDate);

    // Prepare API call based on selected provider
    let response;

    if (selectedModel.provider === 'google') {
      // Google Gemini API
      const isGemini25 = selectedModel.id.includes('2.5');

      // Prepare the API endpoint URL with key
      const apiUrl = `${selectedModel.apiEndpoint}?key=${apiKeyString}`;

      // Prepare the request body based on model version
      let requestBody;

      if (isGemini25) {
        // Gemini 2.5 specific format
        requestBody = {
          contents: [
            {
              role: 'model',
              parts: [{ text: systemMessage }]
            },
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: selectedModel.maxTokens,
            responseMimeType: 'application/json',
            thinkingConfig: {
              thinkingBudget: 0
            }
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        };
      } else {
        // Gemini 2.0 and 1.x format
        requestBody = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemMessage },
                { text: message }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: selectedModel.maxTokens,
            responseMimeType: 'application/json'
          }
        };
      }

      // Make the API request
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
    } else if (selectedModel.provider === 'groq') {
      // Groq API (OpenAI-compatible)
      response = await fetch(selectedModel.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeyString}`
        },
        body: JSON.stringify({
          model: selectedModel.id,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: message }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: selectedModel.maxTokens
        })
      });
    } else {
      throw new Error(`Unsupported provider: ${selectedModel.provider}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${selectedModel.provider} API error (${response.status}): ${errorText}`);
    }

    // Parse the API response based on provider
    let jsonContent: string;

    if (selectedModel.provider === 'google') {
      const data = await response.json();
      console.log('Google API response:', data); // For debugging

      if (!data.candidates || !data.candidates[0]) {
        throw new Error('Invalid Google API response structure: missing candidates');
      }

      // Gemini 2.5 and newer response format
      if (data.candidates[0].content && data.candidates[0].content.parts) {
        // Extract the text content from the parts array
        const content = data.candidates[0].content;
        if (!content.parts || !content.parts[0] || typeof content.parts[0].text !== 'string') {
          throw new Error('Missing content in Google API response: parts structure issue');
        }

        jsonContent = content.parts[0].text;

        // Check if the response was truncated due to token limits
        if (data.candidates[0].finishReason === 'MAX_TOKENS') {
          console.warn('Google API response was truncated due to token limits');

          // Try to fix truncated JSON if possible
          if (!jsonContent.endsWith('}')) {
            jsonContent = jsonContent + '}';
          }
        }
      }
      // Legacy format (direct text property)
      else if (data.candidates[0].text) {
        jsonContent = data.candidates[0].text;
      }
      else {
        throw new Error('Unsupported Google API response format');
      }
    } else if (selectedModel.provider === 'groq') {
      const data = await response.json();

      if (!data.choices ||
        !data.choices[0] ||
        !data.choices[0].message ||
        !data.choices[0].message.content) {
        throw new Error('Invalid Groq API response structure');
      }

      jsonContent = data.choices[0].message.content;
    } else {
      throw new Error(`Unsupported provider: ${selectedModel.provider}`);
    }

    try {
      // Update AI usage stats
      if (fund.id) {
        updateAIUsageStats(fund.id).catch(error => {
          console.error('Failed to update AI usage stats:', error);
        });
      }

      // Parse the JSON content
      const parsedContent = parseJsonContent(jsonContent);

      // Create a form validator instance that shows warnings instead of throwing errors
      const validator = new TransactionFormValidator(members);

      // Validate the response structure
      if (!parsedContent.desc) {
        console.warn('Missing "desc" field in LLM response');
      }

      if (typeof parsedContent.totalAmount !== 'number' || parsedContent.totalAmount <= 0) {
        console.warn('Invalid "totalAmount" in LLM response: Must be a positive number');
      }

      if (!parsedContent.payer) {
        console.warn('Missing "payer" field in LLM response');
      }

      if (!parsedContent.users || typeof parsedContent.users !== 'object') {
        console.warn('Missing or invalid "users" field in LLM response');
      }

      // Return the parsed content even if there are warnings
      return parsedContent as LLMTransactionResponse;

    } catch (error) {
      // Log detailed error information
      console.error('Error processing LLM response:', error);

      // Rethrow with a user-friendly message
      throw new Error(
        `Failed to process transaction: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        'Please try again with more specific details.'
      );
    }
  } catch (error) {
    // Log detailed error information
    console.error('Error calling LLM API:', error);

    // Rethrow with a user-friendly message that includes the technical details
    throw new Error(
      `Failed to process your request through the AI: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      'Please try again with more specific details or contact support.'
    );
  }
}
/**
 * Sanitize and parse JSON content from LLM response
 * @param jsonContent Raw JSON string from LLM
 * @returns Parsed JSON object
 */
function parseJsonContent(jsonContent: string): any {
  try {
    // Try to sanitize the JSON string before parsing
    // This helps with potential issues in malformed responses
    const sanitizedJson = jsonContent
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .trim();

    // For debugging
    console.log('Attempting to parse JSON:', sanitizedJson.substring(0, 100) + '...');

    return JSON.parse(sanitizedJson);
  } catch (e) {
    console.error('JSON parse error:', e);

    // Special handling for truncated responses
    if (jsonContent.includes('{') && !jsonContent.includes('}')) {
      try {
        // Attempt to fix a truncated JSON by adding a closing brace
        const fixedJson = jsonContent + '}';
        const parsedContent = JSON.parse(fixedJson);
        console.log('Successfully parsed truncated JSON after fix');
        return parsedContent;
      } catch (e2) {
        console.warn(`Failed to parse truncated JSON response: ${e instanceof Error ? e.message : 'Unknown error'}`);
        return { desc: "Failed to parse AI response", totalAmount: 0, payer: "", users: {} };
      }
    } else {
      console.warn(`Failed to parse JSON response: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return { desc: "Failed to parse AI response", totalAmount: 0, payer: "", users: {} };
    }
  }
}
