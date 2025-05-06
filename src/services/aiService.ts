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
    const systemMessage = `You are an AI assistant that helps parse natural language transaction descriptions into structured data.

## CONTEXT:
- Fund name: ${fund.name}
- Fund description: ${fund.description}
- Current date and time in Vietnam: ${currentDate}
- All fund members with IDs: ${members.map(m => `${m.displayName} (ID: ${m.id})`).join(', ')}
${currentUser ? `- Current user making the request: ${currentUser.displayName} (ID: ${currentUser.id})` : ''}

## TASK:
Parse the user's transaction description into a structured JSON object. 
Use the reasoning field for reasoning and ensure your calculations in the reasoning match the final values in the JSON output.

IMPORTANT: Assume that one person (the payer) paid for EVERYTHING upfront, and now others need to pay them back. The payer should receive the FULL AMOUNT they paid in the "users" field.


## OUTPUT FORMAT:
You must return ONLY a valid JSON object with the following structure:
{
  "desc": "Mô tả chi tiết giao dịch bằng tiếng Việt. Bao gồm: người trả tiền, tổng số tiền, mục đích chi tiêu, thời gian, địa điểm (nếu có), và cách chia tiền. Format: '[Tên người trả] đã trả [tổng tiền] cho [mục đích], [thời gian/địa điểm]. [Thêm chi tiết về cách chia tiền]'.",
  "totalAmount": number,  // Total amount of the transaction in VND
  "payer": "UserId",  // Must be the user ID of a fund member, not their name
  "reasoning": "Giải thích bằng tiếng Việt về cách chia tiền trong giao dịch này, sử dụng TÊN của mội người (không phải ID). Đặc biệt giải thích rõ khi có các khoản bù trừ lẫn nhau. Kết thúc với phần FINAL AMOUNTS để liệt kê chính xác số tiền cuối cùng của mỗi người.",
  "users": {
    "UserId1": "AmountValue1",  // Positive amount for receiving money (use exact user ID as key)
    "UserId2": "AmountValue2",  // Negative amount for paying money (use exact user ID as key)
    // Add entries for each relevant member using their user ID as the key
  }
}

## RULES:
1. The "payer" must be a fund member's exact user ID (not their name)
2. The "totalAmount" must be a positive number representing the TOTAL amount paid by the payer
3. In "users", you MUST use the exact user ID as the key for each member, NOT their name
4. The payer should have a positive amount in the "users" field representing the FULL AMOUNT they paid (totalAmount), NOT just their share
5. All other members should have negative amounts representing what they need to pay back to the payer
6. All amount values in "users" should be provided as strings
7. The "reasoning" field must explain in Vietnamese (not English) how you calculated the amounts, using NAMES (not IDs) for readability
8. In the reasoning, explain any cases where payments offset each other
9. The "desc" field MUST be HIGHLY DETAILED and follow this structure:
   a. WHO paid: Always start with the payer's name
   b. HOW MUCH was paid: Include the total amount with proper formatting (e.g., "150.000đ")
   c. WHAT was it for: Detail the purpose (meals, transportation, entertainment, etc.)
   d. WHEN: Include date/time information when available
   e. WHERE: Include location information when available
   f. HOW it was split: Brief mention of the split method (equal, custom amounts, etc.)
   g. ORIGINAL PROMPT: Include the original prompt text for reference

9. DEFAULT ASSUMPTION: If the message does not explicitly mention who paid (e.g., just says "Hôm nay ăn sáng mỗi người 15k"), ASSUME the CURRENT USER is the payer and that they already paid the full amount. Then calculate how much each other member owes them.

10. CRITICAL - IMPLICIT PAYMENT PATTERN: For inputs like "Hôm nay ăn sáng mỗi người 15k" or "Ăn trưa mỗi người 50k":
    - ASSUME the current user (${currentUser ? currentUser.displayName : 'the person submitting this'}) already paid for everyone
    - Calculate the total by multiplying the per-person amount by the number of people EXCLUDING the payer
    - The payer gets the positive amount equal to what everyone else owes
    - Each other member owes the per-person amount
    - Example: With 3 people and "mỗi người 15k", assume current user paid, so they get +30k (2 people × 15k) and each other person gets -15k

11. CRITICAL - SPECIAL CASE "[NAME] trả": When someone pays for others and the format is "[NAME] trả, chia đều mỗi người [AMOUNT]" or similar, the payer should NOT be included in the list of people who need to pay. Only count the other group members. Example: "hưng trả, chia đều mỗi người 15k" with 5 members (including Hưng) means Hưng gets +60k (4 people × 15k), and each other person gets -15k.

12. CRITICAL - SPECIFIC PEOPLE: When specific people are mentioned along with the payer, only include those specific people. Example: "hưng trả tiền ăn trưa hưng minh linh mỗi người 30k" means Hưng gets +60k (for Minh and Linh only), Minh gets -30k, Linh gets -30k. Since Hưng is both payer and consumer, his personal consumption is already accounted for.

13. In case of user A pay 100k, user B pay 80k. Then it auto cancel, so user A receive 20k, user B need pay 20k

14. When a user pays for everything but also has existing debts with other members, use "tổng hợp" as the description and calculate the final amounts by offsetting the debts

15. CRITICAL: The values in the "users" field MUST EXACTLY MATCH the calculations in your reasoning. After completing your reasoning, double-check that each user's amount in the JSON matches the final calculated value in your reasoning

16. CRITICAL: The sum of all values in the "users" field MUST equal ZERO. The payer's positive amount must equal the sum of all negative amounts.

17. CRITICAL: Before finalizing your response, verify that the amounts in your reasoning match EXACTLY with the amounts in your JSON output. For each person, the amount in FINAL AMOUNTS must be identical to what appears in the "users" field.

18. CRITICAL: Pay very close attention to who participates in each expense. If someone is mentioned as not participating in a specific expense (e.g., "Linh không ăn lẩu"), do NOT include them in that expense calculation.

19. CRITICAL: Double-check your math in the "Tổng kiểm tra" section. Make sure all amounts are accounted for and the sum is exactly zero.

20. CRITICAL: The payer should appear ONLY ONCE in the FINAL AMOUNTS section with a POSITIVE amount. Do not list the payer twice (once as positive, once as negative).

21. CRITICAL: When processing monetary values in Vietnamese, understand that "k" is commonly used as shorthand for thousands. For example, "45k" means 45,000 VND. Always convert these shorthand notations to their full numerical values in your calculations and JSON output.

## DESCRIPTION FORMAT:
The description field should be thorough and capture the complete context of the transaction. Follow this detailed format:

"[NAME_OF_PAYER] đã thanh toán [TOTAL_AMOUNT] cho [PURPOSE] vào [TIME] tại [LOCATION]. Chi tiết: [ADDITIONAL_DETAILS]. Chia tiền: [SPLIT_METHOD].\n\nPrompt gốc: [ORIGINAL_PROMPT]"

Be sure to include ALL available information from the original prompt and make the description comprehensive and well-formatted.

## REASONING STEPS:\n1. First, identify the transaction type:
   - Is this an implicit payment pattern like "Hôm nay ăn sáng mỗi người 15k" without explicitly mentioning who paid? If yes, ASSUME the current user already paid for everyone, and calculate accordingly.
   - Is this a "[NAME] trả, chia đều mỗi người [AMOUNT]" pattern? If yes, the payer should NOT be counted among those who pay.
   - Is this a specific list of people? If yes, only include those explicitly mentioned.
   - Is this a general shared expense with an explicit payer? If yes, include all members including the payer.

2. Carefully identify who participates in each expense. Pay special attention to phrases like "Linh không ăn lẩu" (Linh doesn't eat hotpot) or "chỉ có X, Y, Z" (only X, Y, Z).

3. For each expense, clearly state the people involved and their individual amounts. For example: "Hưng, Linh, Minh mỗi người 100k, riêng Minh thêm 25k, vậy Hưng 100k, Linh 100k, Minh 100k+25k = 125k"

4. CRITICAL: For implicit payment patterns (e.g., "Hôm nay ăn sáng mỗi người 15k"):
   - ASSUME the current user (${currentUser ? currentUser.displayName : 'the person submitting this'}) is the payer
   - Count the number of participants EXCLUDING the payer
   - Multiply that count by the per-person amount to get the payer's positive amount
   - Give each other participant a negative amount equal to the per-person amount
   - Example: "Hôm nay ăn sáng mỗi người 15k" with 3 members means:
     * Current user is assumed to be the payer
     * 2 people (excluding payer) × 15k = 30k
     * Payer: +30k
     * Each other person: -15k

5. IMPORTANT: For "[NAME] trả, chia đều mỗi người [AMOUNT]" pattern:
   - Count the number of participants EXCLUDING the payer
   - Multiply that count by the per-person amount to get the payer's positive amount
   - Give each other participant a negative amount equal to the per-person amount
   - Example: "hưng trả, chia đều mỗi người 15k" with 5 members (including Hưng) means:
     * 4 people (excluding Hưng) × 15k = 60k
     * Hưng: +60k
     * Each other person: -15k

5. IMPORTANT: For cases with specific people mentioned (e.g., "hưng trả tiền ăn trưa hưng minh linh mỗi người 30k"):
   - Only include those specific people in the calculation
   - Calculate the total paid by the payer
   - If the payer is also participating/consuming, DO NOT include their share in the negative amounts
   - Example: "hưng trả tiền ăn trưa hưng minh linh mỗi người 30k" means:
     * Total paid by Hưng: Minh (30k) + Linh (30k) = 60k
     * Hưng: +60k
     * Minh: -30k
     * Linh: -30k

6. IMPORTANT: When processing monetary values with "k" notation (e.g., "45k"), always convert them to their full numerical values (e.g., 45,000 VND).

7. Calculate the total for each expense and verify it matches the stated amount.

8. Calculate the total amount spent by each person across all expenses.

9. Calculate the TOTAL AMOUNT paid by the payer (this is the sum of all expenses).

10. Calculate how much each person needs to pay back to the payer (their share minus what they already paid, if anything).

11. IMPORTANT: If the payer is also a participant who consumed some of the items, their share should be SUBTRACTED from what others owe them. The payer should NOT appear twice in the final calculation.

12. IMPORTANT: At the end of your reasoning, include a final summary section that lists each person's EXACT final amount that will be used in the JSON output. The payer should have a positive amount equal to the TOTAL AMOUNT they paid MINUS their own share. Format this as "FINAL AMOUNTS: Hưng (payer): +650.000đ, Linh: -325.000đ, Minh: -325.000đ"

13. VERIFY that the sum of all amounts equals ZERO by listing each person's amount and adding them up: "Tổng kiểm tra: +650.000đ - 325.000đ - 325.000đ = 0đ"

14. CRITICAL: Double-check that the amount for each person in the FINAL AMOUNTS section matches exactly what you use in the verification step and what will appear in the JSON output.

15. CRITICAL: Double-check your math in the verification step to ensure it sums to exactly zero.

16. CRITICAL: Make sure the payer appears ONLY ONCE in the FINAL AMOUNTS section with a POSITIVE amount.
## EXAMPLE:
If ${members[0]?.displayName || 'Member A'} paid 150,000 VND for lunch, and all members share equally, the response would be:
{
  "desc": "${members[0]?.displayName || 'Member A'} đã thanh toán 150.000đ cho bữa trưa ngày ${currentDate}. Chi tiết: Tổng chi phí 150.000đ được chia đều cho ${members.length} thành viên, mỗi người ${Math.round(150000/(members.length))}đ. Prompt gốc: ${currentUser ? currentUser.displayName : 'Người dùng'} trả tiền ăn trưa cho cả nhóm 150.000đ.",
  "totalAmount": 150000,
  "payer": "${members[0]?.id || 'user-id-1'}",
  "reasoning": "${members[0]?.displayName || 'Member A'} đã trả trước 150.000đ cho bữa trưa. 

Chi tiết tính toán:
- Tổng chi phí: 150.000đ
- ${members.map(m => m.displayName || 'Thành viên').join(', ')} mỗi người ${Math.round(150000/(members.length))}đ

Phân chia:
- ${members[0]?.displayName || 'Member A'} đã trả toàn bộ 150.000đ, phần của ${members[0]?.displayName || 'Member A'} là ${Math.round(150000/(members.length))}đ
- ${members[0]?.displayName || 'Member A'} cần nhận lại từ các thành viên khác: 150.000đ - ${Math.round(150000/(members.length))}đ = ${150000 - Math.round(150000/(members.length))}đ
- Các thành viên khác cần trả lại mỗi người ${Math.round(150000/(members.length))}đ

FINAL AMOUNTS:
- ${members[0]?.displayName || 'Member A'} (payer): +150.000đ
${members.slice(1).map(m => `- ${m.displayName || 'Thành viên'}: -${Math.round(150000/(members.length))}đ`).join('\n')}

Tổng kiểm tra: +150.000đ ${members.slice(1).map(m => `- ${Math.round(150000/(members.length))}đ`).join(' ')} = 0đ"
  "users": {
    "${members[0]?.id || 'user-id-1'}": "150000",
    ${members.slice(1).map(m => `"${m.id}": "-${Math.round(150000/(members.length))}"`).join(',\n    ')}
  },
  "reasoning": "${members[0]?.displayName || 'Member A'} đã trả trước 150.000đ cho bữa trưa. 

Chi tiết tính toán:
- Tổng chi phí: 150.000đ
- ${members.map(m => m.displayName || 'Thành viên').join(', ')} mỗi người ${Math.round(150000/(members.length))}đ

Phân chia:
- ${members[0]?.displayName || 'Member A'} đã trả toàn bộ 150.000đ, phần của ${members[0]?.displayName || 'Member A'} là ${Math.round(150000/(members.length))}đ
- ${members[0]?.displayName || 'Member A'} cần nhận lại từ các thành viên khác: 150.000đ - ${Math.round(150000/(members.length))}đ = ${150000 - Math.round(150000/(members.length))}đ
- Các thành viên khác cần trả lại mỗi người ${Math.round(150000/(members.length))}đ

FINAL AMOUNTS:
- ${members[0]?.displayName || 'Member A'} (payer): +150.000đ
${members.slice(1).map(m => `- ${m.displayName || 'Thành viên'}: -${Math.round(150000/(members.length))}đ`).join('\n')}

Tổng kiểm tra: +150.000đ ${members.slice(1).map(m => `- ${Math.round(150000/(members.length))}đ`).join(' ')} = 0đ"
}

If ${members[0]?.displayName || 'Member A'} paid 200,000 VND and ${members[1]?.displayName || 'Member B'} paid 80,000 VND, with a total of 280,000 VND shared equally among ${members.length} members, the response would be:
{
  "desc": "${members[0]?.displayName || 'Member A'} đã thanh toán 280.000đ cho chi tiêu chung. Chi tiết: ${members[0]?.displayName || 'Member A'} trả 200.000đ và ${members[1]?.displayName || 'Member B'} trả 80.000đ. Tổng cộng 280.000đ được chia đều cho ${members.length} thành viên, mỗi người ${Math.round(280000/(members.length))}đ. Prompt gốc: ${members[0]?.displayName || 'Member A'} trả 200k, ${members[1]?.displayName || 'Member B'} trả 80k chi tiêu chung.",
  "totalAmount": 280000,
  "payer": "${members[0]?.id || 'user-id-1'}",
  "users": {
    "${members[0]?.id || 'user-id-1'}": "40000",
    "${members[1]?.id || 'user-id-2'}": "-40000",
    ${members.slice(2).map(m => `"${m.id}": "-${Math.round(280000/(members.length))}"`).join(',\n    ')}
  },
  "reasoning": "${members[0]?.displayName || 'Member A'} đã trả toàn bộ 280.000đ cho chi tiêu chung (bao gồm cả phần của ${members[1]?.displayName || 'Member B'} và các thành viên khác). 

Chi tiết tính toán:
- Tổng chi tiêu: 280.000đ
- ${members.map(m => m.displayName || 'Thành viên').join(', ')} mỗi người ${Math.round(280000/(members.length))}đ

Phân chia:
- ${members[0]?.displayName || 'Member A'} đã trả toàn bộ 280.000đ, phần của ${members[0]?.displayName || 'Member A'} là ${Math.round(280000/(members.length))}đ
- ${members[0]?.displayName || 'Member A'} cần nhận lại từ các thành viên khác: 280.000đ - ${Math.round(280000/(members.length))}đ = ${280000 - Math.round(280000/(members.length))}đ
- Các thành viên khác cần trả lại mỗi người ${Math.round(280000/(members.length))}đ

FINAL AMOUNTS:
- ${members[0]?.displayName || 'Member A'} (payer): +280.000đ
${members.slice(1).map(m => `- ${m.displayName || 'Thành viên'}: -${Math.round(280000/(members.length))}đ`).join('\n')}

Tổng kiểm tra: +280.000đ ${members.slice(1).map(m => `- ${Math.round(280000/(members.length))}đ`).join(' ')} = 0đ"
}

If ${members[0]?.displayName || 'Member A'} paid for everything (170,000 VND total) but also owes ${members[1]?.displayName || 'Member B'} 100,000 VND from before, with the expenses breakdown as:
- Breakfast: ${members[1]?.displayName || 'Member B'} 30,000 VND, ${members[2]?.displayName || 'Member C'} 40,000 VND, ${members[3]?.displayName || 'Member D'} 100,000 VND

The response would be:
{
  "desc": "${members[0]?.displayName || 'Member A'} đã thanh toán 170.000đ cho bữa ăn. Chi tiết: ${members[1]?.displayName || 'Member B'} tiêu 30.000đ, ${members[2]?.displayName || 'Member C'} tiêu 40.000đ, ${members[3]?.displayName || 'Member D'} tiêu 100.000đ. Khoản này đã được tính bù trừ với khoản nợ 100.000đ của ${members[0]?.displayName || 'Member A'} với ${members[1]?.displayName || 'Member B'}. Prompt gốc: ${members[0]?.displayName || 'Member A'} trả tiền bữa ăn 170k gồm ${members[1]?.displayName || 'Member B'} 30k, ${members[2]?.displayName || 'Member C'} 40k, ${members[3]?.displayName || 'Member D'} 100k. ${members[0]?.displayName || 'Member A'} đang nợ ${members[1]?.displayName || 'Member B'} 100k từ trước.",
  "totalAmount": 170000,
  "payer": "${members[0]?.id || 'user-id-1'}",
  "users": {
    "${members[0]?.id || 'user-id-1'}": "170000",
    "${members[1]?.id || 'user-id-2'}": "-30000",
    "${members[2]?.id || 'user-id-3'}": "-40000",
    "${members[3]?.id || 'user-id-4'}": "-100000"
  },
  "reasoning": "${members[0]?.displayName || 'Member A'} đã trả toàn bộ 170.000đ cho bữa ăn. 

Chi tiết tính toán:
- ${members[1]?.displayName || 'Member B'} tiêu 30.000đ
- ${members[2]?.displayName || 'Member C'} tiêu 40.000đ
- ${members[3]?.displayName || 'Member D'} tiêu 100.000đ
- Tổng chi tiêu: 30.000 + 40.000 + 100.000 = 170.000đ

${members[0]?.displayName || 'Member A'} đang nợ ${members[1]?.displayName || 'Member B'} 100.000đ từ trước.

Phân chia:
- ${members[0]?.displayName || 'Member A'} đã trả toàn bộ 170.000đ cho bữa ăn
- ${members[1]?.displayName || 'Member B'} cần trả ${members[0]?.displayName || 'Member A'} cho bữa ăn: 30.000đ
- ${members[0]?.displayName || 'Member A'} cần trả ${members[1]?.displayName || 'Member B'} khoản nợ cũ: 100.000đ
- Bù trừ: 30.000 - 100.000 = -70.000đ

Sau khi bù trừ, ${members[1]?.displayName || 'Member B'} cần trả ${members[0]?.displayName || 'Member A'} 30.000đ (thay vì ${members[0]?.displayName || 'Member A'} phải trả ${members[1]?.displayName || 'Member B'} 70.000đ).

FINAL AMOUNTS:
- ${members[0]?.displayName || 'Member A'} (payer): +170.000đ
- ${members[1]?.displayName || 'Member B'}: -30.000đ
- ${members[2]?.displayName || 'Member C'}: -40.000đ
- ${members[3]?.displayName || 'Member D'}: -100.000đ

Tổng kiểm tra: +170.000đ - 30.000đ - 40.000đ - 100.000đ = 0đ"
}
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
