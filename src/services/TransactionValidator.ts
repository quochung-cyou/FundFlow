import { User } from "@/types";
import { LLMTransactionResponse } from "./aiService";

/**
 * Class responsible for validating LLM transaction responses
 * Handles validation of response structure, user IDs, and transaction amounts
 */
export class TransactionValidator {
  private members: User[];
  
  /**
   * Create a new transaction validator
   * @param members List of fund members to validate against
   */
  constructor(members: User[]) {
    this.members = members;
  }
  
  /**
   * Validate the entire LLM response
   * @param parsedContent The parsed JSON content from the LLM
   * @returns The validated content or throws an error if invalid
   */
  public validateResponse(parsedContent: any): LLMTransactionResponse {
    this.validateStructure(parsedContent);
    this.validateUserIds(parsedContent);
    this.validateAmounts(parsedContent);
    this.validateConsistency(parsedContent);
    
    return parsedContent as LLMTransactionResponse;
  }
  
  /**
   * Validate the basic structure of the response
   * @param parsedContent The parsed JSON content
   */
  private validateStructure(parsedContent: any): void {
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
  }
  
  /**
   * Validate that all user IDs in the response exist in the members list
   * @param parsedContent The parsed JSON content
   */
  private validateUserIds(parsedContent: any): void {
    // Check if payer ID is in members list
    const payerExists = this.members.some(m => m.id === parsedContent.payer);
    
    if (!payerExists) {
      throw new Error(`Payer with ID "${parsedContent.payer}" not found in fund members list`);
    }
    
    // Check if all user IDs in the users object exist in members list
    for (const userId in parsedContent.users) {
      const userExists = this.members.some(m => m.id === userId);
      if (!userExists) {
        throw new Error(`User with ID "${userId}" not found in fund members list`);
      }
    }
  }
  
  /**
   * Validate that transaction amounts balance to zero
   * @param parsedContent The parsed JSON content
   */
  private validateAmounts(parsedContent: any): void {
    // Calculate total of all splits
    const totalSplits = Object.values(parsedContent.users).reduce(
      (sum: number, amountStr: unknown) => {
        // Ensure we're working with strings and safely parse them
        const amount = typeof amountStr === 'string' 
          ? parseFloat(amountStr) 
          : typeof amountStr === 'number' 
            ? amountStr 
            : 0;
            
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0
    );

    // Log the total for debugging
    console.log('Total splits:', totalSplits);
    
    // Ensure totalSplits is treated as a number
    const totalSplitsNum = Number(totalSplits);
    
    // Check if the total is significantly different from zero
    if (Math.abs(totalSplitsNum) > 10) { // Allow for minor rounding errors
      console.warn(`Transaction splits don't perfectly balance: ${totalSplitsNum}. User can adjust manually.`);
      
      // If the imbalance is too large, throw an error
      if (Math.abs(totalSplitsNum) > 100) {
        throw new Error(`Số tiền không cân bằng, dư ra ${totalSplitsNum}.`);
      }
    }
  }
  
  /**
   * Validate that the reasoning and users field are consistent
   * @param parsedContent The parsed JSON content
   */
  private validateConsistency(parsedContent: any): void {
    if (!parsedContent.reasoning) {
      return; // No reasoning to validate against
    }
    
    // Check if the reasoning contains a FINAL AMOUNTS section
    const finalAmountsMatch = parsedContent.reasoning.match(/FINAL AMOUNTS:[\s\S]*?(?=\n\n|$)/i);
    if (!finalAmountsMatch) {
      return; // No FINAL AMOUNTS section to validate against
    }
    
    const finalAmountsSection = finalAmountsMatch[0];
    
    // Extract amounts from the FINAL AMOUNTS section
    const amountPattern = /[-\w\s]+:\s*([+-]?[\d,.]+)đ/g;
    let match;
    const reasoningAmounts: Record<string, number> = {};
    
    while ((match = amountPattern.exec(finalAmountsSection)) !== null) {
      const amountText = match[1].replace(/\./g, '').replace(/,/g, '.');
      const amount = parseFloat(amountText);
      
      // Find which user this amount belongs to
      const userLine = match[0];
      for (const member of this.members) {
        if (userLine.includes(member.displayName)) {
          reasoningAmounts[member.id] = amount;
          break;
        }
      }
    }
    
    // Compare with users field
    for (const userId in parsedContent.users) {
      const userAmountRaw = parsedContent.users[userId];
      const userAmount = typeof userAmountRaw === 'string' 
        ? parseFloat(userAmountRaw) 
        : typeof userAmountRaw === 'number' 
          ? userAmountRaw 
          : 0;
          
      if (reasoningAmounts[userId] !== undefined && 
          Math.abs(reasoningAmounts[userId] - userAmount) > 10) { // Allow small rounding differences
        console.warn(`Inconsistency detected: User ${userId} has amount ${userAmount} in JSON but ${reasoningAmounts[userId]} in reasoning`);
      }
    }
  }
  
  /**
   * Sanitize and parse JSON content from LLM response
   * @param jsonContent Raw JSON string from LLM
   * @returns Parsed JSON object
   */
  public static parseJsonContent(jsonContent: string): any {
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
          throw new Error(`Failed to parse truncated JSON response: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      } else {
        throw new Error(`Failed to parse JSON response: ${e instanceof Error ? e.message : 'Unknown error'}. Received: ${jsonContent.substring(0, 200)}...`);
      }
    }
  }
}
