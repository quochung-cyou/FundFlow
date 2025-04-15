import { Fund, User } from "@/types";

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
export const parseTransactionWithLLM = async (
  message: string,
  fund: Fund,
  members: User[],
  currentUserId?: string
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
    const apiKey = "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";
    
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

## OUTPUT FORMAT:
You must return ONLY a valid JSON object with the following structure:
{
  "desc": "Giải thích giao dịch bằng tiếng Việt",
  "totalAmount": number,  // Total amount of the transaction in VND
  "payer": "UserId",  // Must be the user ID of a fund member, not their name
  "users": {
    "UserId1": "AmountValue1",  // Positive amount for receiving money (use exact user ID as key)
    "UserId2": "AmountValue2",  // Negative amount for paying money (use exact user ID as key)
    // Add entries for each relevant member using their user ID as the key
  },
  "reasoning": "Giải thích bằng tiếng Việt về cách chia tiền trong giao dịch này, sử dụng TÊN của mội người (không phải ID). Đặc biệt giải thích rõ khi có các khoản bù trừ lẫn nhau."
}

## RULES:
1. The "payer" must be a fund member's exact user ID (not their name)
2. The "totalAmount" must be a positive number
3. In "users", you MUST use the exact user ID as the key for each member, NOT their name
4. The payer should have a positive amount representing what they paid
5. All members who receive benefits should have negative amounts
6. All amount values in "users" should be provided as strings
7. The "reasoning" field must explain in Vietnamese (not English) how you calculated the amounts, using NAMES (not IDs) for readability
8. In the reasoning, explain any cases where payments offset each other
9. In case of user A pay 100, user b pay 80. Then it auto cancel, so user A receive 20, user B need pay 20
## EXAMPLE:
If ${members[0]?.displayName || 'Member A'} paid 150,000 VND for lunch, and all members share equally, the response would be:
{
  "desc": "Lunch payment",
  "totalAmount": 150000,
  "payer": "${members[0]?.id || 'user-id-1'}",
  "users": {
    "${members[0]?.id || 'user-id-1'}": "150000",
    ${members.slice(1).map(m => `"${m.id}": "-${Math.round(150000/(members.length))}"`).join(',\n    ')}
  },
  "reasoning": "${members[0]?.displayName || 'Member A'} đã trả 150.000đ cho bữa trưa. Số tiền này được chia đều cho ${members.length} thành viên, mỗi người ${Math.round(150000/(members.length))}đ. ${members[0]?.displayName || 'Member A'} nhận lại +150.000đ vì đã trả tiền trước, còn các thành viên khác cần trả lại ${Math.round(150000/(members.length))}đ."
}

If ${members[0]?.displayName || 'Member A'} paid 200,000 VND and ${members[1]?.displayName || 'Member B'} paid 80,000 VND, with a total of 280,000 VND shared equally among ${members.length} members, the response would be:
{
  "desc": "Shared payment",
  "totalAmount": 280000,
  "payer": "${members[0]?.id || 'user-id-1'}",
  "users": {
    "${members[0]?.id || 'user-id-1'}": "200000",
    "${members[1]?.id || 'user-id-2'}": "80000",
    ${members.slice(2).map(m => `"${m.id}": "-${Math.round(280000/(members.length))}"`).join(',\n    ')}
  },
  "reasoning": "${members[0]?.displayName || 'Member A'} đã trả 200.000đ và ${members[1]?.displayName || 'Member B'} đã trả 80.000đ, tổng cộng 280.000đ. Số tiền này được chia đều cho ${members.length} thành viên, mỗi người ${Math.round(280000/(members.length))}đ. Do ${members[0]?.displayName || 'Member A'} đã trả 200.000đ nên chỉ cần nhận lại ${200000 - Math.round(280000/(members.length))}đ. ${members[1]?.displayName || 'Member B'} đã trả 80.000đ nên ${80000 >= Math.round(280000/(members.length)) ? 'không cần trả thêm' : 'cần trả thêm ' + (Math.round(280000/(members.length)) - 80000) + 'đ'}."
}`;

    // Call the Groq API with the correct endpoint
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,  // Lower temperature for more deterministic results
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || 
        !data.choices[0] || 
        !data.choices[0].message || 
        !data.choices[0].message.content) {
      throw new Error('Invalid API response structure: Missing required fields in response');
    }
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      throw new Error(`Failed to parse JSON response: ${data.choices[0].message.content}`);
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
