import { Fund, User, AIApiKey, AIUsageStats } from "@/types";
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

// Interface for LLM transaction response
export interface LLMTransactionResponse {
  desc: string;
  totalAmount: number;
  payer: string;
  users: Record<string, string>; // username: amount (positive for receiving, negative for paying)
  reasoning?: string; // Vietnamese reasoning explaining the transaction split logic
}

/**
 * Call the Groq LLM API to parse natural language into transaction data
 * @param message User message describing the transaction
 * @param fund Fund data containing members and other context
 * @param members List of fund members with their display names
 * @returns Structured transaction data
 */
// Available AI models mapping for UI display and API calls
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
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
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

/**
 * Update AI usage statistics for a fund
 * @param fundId Fund ID
 * @param increment Number of API calls to add (default: 1)
 */
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
): Promise<{availableModels: AIModel[], availableProviders: ('google' | 'openai' | 'groq')[]}> => {
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
    
    // Prepare the system message with rich context
    const systemMessage = `
You are an AI assistant that helps parse natural language transaction descriptions into structured data.

## CONTEXT:
- Fund name: ${fund.name}
- Fund description: ${fund.description}
- Current date and time in Vietnam: ${currentDate}
- All fund members with IDs: ${members.map(m => `${m.displayName} (ID: ${m.id})`).join(', ')}
${currentUser ? `- Current user making the request: ${currentUser.displayName} (ID: ${currentUser.id})` : ''}

## TASK:
Parse the user's transaction description into a structured JSON object. Use the reasoning field to explain your calculations in Vietnamese, ensuring that the final amounts in the JSON match the reasoning.

**Important**: Assume that one person (the payer) paid for everything upfront. The "users" field should reflect the net amounts each person needs to receive (positive) or pay (negative) to settle the transaction, with the sum equaling zero.

## OUTPUT FORMAT:
Return ONLY a valid JSON object with the following structure:
{
  "desc": "Mô tả chi tiết giao dịch bằng tiếng Việt. Bao gồm: người trả tiền, tổng số tiền, mục đích chi tiêu, thời gian, địa điểm (nếu có), và cách chia tiền. Format: '[Tên người trả] đã trả [tổng tiền] cho [mục đích], [thời gian/địa điểm]. [Thêm chi tiết về cách chia tiền]. Prompt gốc: [ORIGINAL_PROMPT]'.",
  "totalAmount": number,  // Total amount of the transaction in VND
  "payer": "UserId",  // Must be the user ID of a fund member, not their name
  "reasoning": "Giải thích bằng tiếng Việt về cách chia tiền trong giao dịch này, sử dụng TÊN của mọi người (không phải ID). Kết thúc với phần FINAL AMOUNTS liệt kê số tiền cuối cùng của mỗi người. Bao gồm 'Tổng kiểm tra' để xác nhận tổng bằng 0.",
  "users": {
    "UserId1": "AmountValue1",  // Net amount: positive for receiving, negative for paying
    "UserId2": "AmountValue2",  // Use exact user ID as key
    // ...
  }
}

## RULES:
1. The "payer" must be a fund member's exact user ID (not their name).
2. The "totalAmount" must be a positive number representing the total amount paid by the payer.
3. In "users", use the exact user ID as the key for each member, not their name.
4. The "users" field must contain net amounts:
   - For a shared expense where the payer is a participant: payer gets "totalAmount - theirShare", others get "-theirShare".
   - If the payer is not a participant: payer gets "+totalAmount", participants get "-(totalAmount / number_of_participants)".
5. The sum of all amounts in "users" must equal zero.
6. Amount values in "users" are strings representing exact VND amounts (no symbols or separators, e.g., "358333.33").
7. The "reasoning" field must use names (not IDs), explain calculations step-by-step, and end with:
   - "FINAL AMOUNTS": List each person’s net amount (e.g., "Minh: +358.333,33đ").
   - "Tổng kiểm tra": Verify the sum is zero (e.g., "+358.333,33đ -71.666,67đ * 5 = 0đ").
8. Convert shorthand like "430k" to 430,000 VND.
9. If no payer is specified (e.g., "Hôm nay ăn sáng mỗi người 15k"), assume the current user paid for everyone.

## EXAMPLES:

### Example 1: Payer is a participant
**Input**: "Tam Đảo day 1 (Phương chưa lên): 430k chia đều cho Minh, Hưng, Linh, Thiện, Quỳnh, Uyên. Minh trả tiền. Phần Minh nhận lại thì cần trừ phần Minh bị chia luôn do Minh cũng tham gia"
**Output**:
{
  "desc": "Minh đã trả 430.000đ cho chi tiêu chung tại Tam Đảo ngày 1. Chi tiết: Tổng chi phí 430.000đ được chia đều cho 6 thành viên: Minh, Hưng, Linh, Thiện, Quỳnh, Uyên, mỗi người 71.666,67đ. Prompt gốc: Tam Đảo day 1 (Phương chưa lên): 430k chia đều cho Minh, Hưng, Linh, Thiện, Quỳnh, Uyên. Minh trả tiền. Phần Minh nhận lại thì cần trừ phần Minh bị chia luôn do Minh cũng tham gia.",
  "totalAmount": 430000,
  "payer": "[Minh's user ID]",
  "reasoning": "Minh đã trả trước 430.000đ cho chi tiêu chung tại Tam Đảo ngày 1.\n\nChi tiết tính toán:\n- Tổng chi phí: 430.000đ\n- Số người chia: 6 (Minh, Hưng, Linh, Thiện, Quỳnh, Uyên)\n- Mỗi người phải trả: 430.000đ / 6 = 71.666,67đ\n\nPhân chia:\n- Minh đã trả 430.000đ, phần của Minh là 71.666,67đ\n- Minh cần nhận lại từ 5 người khác: 71.666,67đ × 5 = 358.333,33đ\n- Các thành viên khác mỗi người cần trả 71.666,67đ\n\nFINAL AMOUNTS:\n- Minh: +358.333,33đ\n- Hưng: -71.666,67đ\n- Linh: -71.666,67đ\n- Thiện: -71.666,67đ\n- Quỳnh: -71.666,67đ\n- Uyên: -71.666,67đ\n\nTổng kiểm tra: +358.333,33đ - 71.666,67đ × 5 = +358.333,33đ - 358.333,35đ ≈ 0đ (sai số do làm tròn)",
  "users": {
    "[Minh's user ID]": "358333.33",
    "[Hưng's user ID]": "-71666.67",
    "[Linh's user ID]": "-71666.67",
    "[Thiện's user ID]": "-71666.67",
    "[Quỳnh's user ID]": "-71666.67",
    "[Uyên's user ID]": "-71666.67"
  }
}

### Example 2: Payer is not a participant
**Input**: "Minh trả 430k cho Hưng, Linh, Thiện, Quỳnh, Uyên."
**Output**:
{
  "desc": "Minh đã trả 430.000đ cho chi tiêu của Hưng, Linh, Thiện, Quỳnh, Uyên ngày ${currentDate}. Chi tiết: Tổng chi phí 430.000đ được chia đều cho 5 thành viên, mỗi người 86.000đ. Prompt gốc: Minh trả 430k cho Hưng, Linh, Thiện, Quỳnh, Uyên.",
  "totalAmount": 430000,
  "payer": "[Minh's user ID]",
  "reasoning": "Minh đã trả trước 430.000đ cho chi tiêu của 5 người: Hưng, Linh, Thiện, Quỳnh, Uyên.\n\nChi tiết tính toán:\n- Tổng chi phí: 430.000đ\n- Số người chia: 5\n- Mỗi người phải trả: 430.000đ / 5 = 86.000đ\n\nPhân chia:\n- Minh không tham gia chia chi phí, đã trả 430.000đ\n- Minh cần nhận lại toàn bộ 430.000đ\n- Mỗi người trong 5 người cần trả 86.000đ\n\nFINAL AMOUNTS:\n- Minh: +430.000đ\n- Hưng: -86.000đ\n- Linh: -86.000đ\n- Thiện: -86.000đ\n- Quỳnh: -86.000đ\n- Uyên: -86.000đ\n\nTổng kiểm tra: +430.000đ - 86.000đ × 5 = +430.000đ - 430.000đ = 0đ",
  "users": {
    "[Minh's user ID]": "430000",
    "[Hưng's user ID]": "-86000",
    "[Linh's user ID]": "-86000",
    "[Thiện's user ID]": "-86000",
    "[Quỳnh's user ID]": "-86000",
    "[Uyên's user ID]": "-86000"
  }
}

## REASONING STEPS:
1. Identify the payer and total amount (e.g., "Minh trả tiền", "430k" → 430,000 VND).
2. Determine participants and whether the payer is included (e.g., "chia đều cho Minh, Hưng, ..." includes Minh).
3. Calculate each person’s share (totalAmount / number_of_participants).
4. If the payer is a participant:
   - Payer’s net amount = totalAmount - theirShare
   - Others’ net amount = -theirShare
5. If the payer is not a participant:
   - Payer’s net amount = +totalAmount
   - Participants’ net amount = -(totalAmount / number_of_participants)
6. Verify the sum in "users" equals zero.
7. Document calculations in "reasoning" with a "FINAL AMOUNTS" section.

`;

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
              role: 'user',
              parts: [{ text: systemMessage + '\n\n' + message }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: selectedModel.maxTokens,
            responseMimeType: 'application/json'
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
            temperature: 0.2,
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
    
    let parsedContent;
    try {
      // Try to sanitize the JSON string before parsing
      // This helps with potential issues in malformed responses
      const sanitizedJson = jsonContent
        .replace(/\n/g, ' ')
        .replace(/\r/g, '')
        .trim();
      
      // For debugging
      console.log('Attempting to parse JSON:', sanitizedJson.substring(0, 100) + '...');
      
      parsedContent = JSON.parse(sanitizedJson);
    } catch (e) {
      console.error('JSON parse error:', e);
      
      // Special handling for truncated responses
      if (jsonContent.includes('{') && !jsonContent.includes('}')) {
        try {
          // Attempt to fix a truncated JSON by adding a closing brace
          const fixedJson = jsonContent + '}';
          parsedContent = JSON.parse(fixedJson);
          console.log('Successfully parsed truncated JSON after fix');
        } catch (e2) {
          throw new Error(`Failed to parse truncated JSON response: ${e.message}`);
        }
      } else {
        throw new Error(`Failed to parse JSON response: ${e.message}. Received: ${jsonContent.substring(0, 200)}...`);
      }
    }
    
    // Update AI usage stats
    if (fund.id) {
      updateAIUsageStats(fund.id).catch(error => {
        console.error('Failed to update AI usage stats:', error);
      });
    }
    
    // Validate the response structure
    if (!parsedContent.desc) {
      throw new Error('Missing "desc" field in LLM response');
    }
    if (typeof parsedContent.totalAmount !== 'number' || parsedContent.totalAmount <= 0) {
      throw new Error('Invalid "totalAmount" in LLM response: Must be a positive number');
    }
    if (!parsedContent.payer) {
      throw new Error('Missing "payer" field in LLM response');
    }
    if (!parsedContent.users || typeof parsedContent.users !== 'object') {
      throw new Error('Missing or invalid "users" field in LLM response');
    }
    
    // Validate that the reasoning and users field are consistent
    if (parsedContent.reasoning) {
      // Check if the reasoning contains a FINAL AMOUNTS section
      const finalAmountsMatch = parsedContent.reasoning.match(/FINAL AMOUNTS:[\s\S]*?(?=\n\n|$)/i);
      if (finalAmountsMatch) {
        const finalAmountsSection = finalAmountsMatch[0];
        
        // Extract amounts from the FINAL AMOUNTS section
        const amountPattern = /[-\w\s]+:\s*([+-]?[\d,.]+)đ/g;
        let match;
        const reasoningAmounts = {};
        
        while ((match = amountPattern.exec(finalAmountsSection)) !== null) {
          const amountText = match[1].replace(/\./g, '').replace(/,/g, '');
          const amount = parseInt(amountText, 10);
          
          // Find which user this amount belongs to
          const userLine = match[0];
          for (const member of members) {
            if (userLine.includes(member.displayName)) {
              reasoningAmounts[member.id] = amount;
              break;
            }
          }
        }
        
        // Compare with users field
        for (const userId in parsedContent.users) {
          const userAmount = parseInt(parsedContent.users[userId], 10);
          if (reasoningAmounts[userId] !== undefined && 
              Math.abs(reasoningAmounts[userId] - userAmount) > 10) { // Allow small rounding differences
            console.warn(`Inconsistency detected: User ${userId} has amount ${userAmount} in JSON but ${reasoningAmounts[userId]} in reasoning`);
          }
        }
      }
    }
    
    // Check if payer ID is in members list
    const payerExists = members.some(m => m.id === parsedContent.payer);
    
    if (!payerExists) {
      throw new Error(`Payer with ID "${parsedContent.payer}" not found in fund members list`);
    }
    
    // Instead of validating that splits balance to zero, just log a warning if they don't
    const totalSplits = Object.values(parsedContent.users).reduce(
      (sum, amountStr) => {
        // Ensure we're working with strings and safely parse them
        const amount = typeof amountStr === 'string' 
          ? parseInt(amountStr, 10) 
          : typeof amountStr === 'number' 
            ? amountStr 
            : 0;
            
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0
    );
    
    if (Math.abs(totalSplits) > 10) { // Allow for minor rounding errors
      console.warn(`Transaction splits don't perfectly balance: ${totalSplits}. User can adjust manually.`);
    }
    
    return parsedContent;
  } catch (error) {
    // Log detailed error information
    console.error('Error calling Groq LLM API:', error);
    
    // Rethrow with a user-friendly message that includes the technical details
    throw new Error(
      `Failed to process your request through the AI: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      'Please try again with more specific details or contact support.'
    );
  }
};
