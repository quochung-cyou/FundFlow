import { db } from './config';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp, DocumentReference, DocumentData } from 'firebase/firestore';
import { Fund, User } from '@/types';

// Collection reference
const FUNDS_COLLECTION = 'funds';
const fundsRef = collection(db, FUNDS_COLLECTION);

/**
 * Create a new fund
 * @param fund Fund data without id, createdAt, and createdBy
 * @param userId ID of the user creating the fund
 * @returns The created fund with ID
 */
export const createFund = async (
  fund: Omit<Fund, 'id' | 'createdAt' | 'createdBy'>, 
  userId: string
): Promise<Fund> => {
  try {
    // Process members to ensure they are always string IDs
    let memberIds: string[] = [];
    
    // Extract member IDs in a type-safe way
    if (Array.isArray(fund.members)) {
      memberIds = fund.members
        .filter(member => member !== null && member !== undefined)
        .map(member => {
          // Handle different member types
          if (typeof member === 'string') {
            return member; // Already a string ID
          } else if (typeof member === 'object' && member !== null) {
            // Try to extract ID from object
            const memberId = (member as any).id;
            return memberId ? String(memberId) : '';
          } else {
            // Fallback for other types
            return String(member);
          }
        })
        .filter(id => id !== ''); // Remove any empty strings
    }
    
    // Ensure no duplicate members (including creator)
    const uniqueMemberIds = Array.from(new Set([...memberIds, userId]));
    
    // Add timestamp and creator
    const fundData = {
      ...fund,
      createdAt: serverTimestamp(),
      createdBy: userId,
      members: uniqueMemberIds,
      updatedAt: serverTimestamp(),
    };
    
    // Add to Firestore
    const docRef = await addDoc(fundsRef, fundData);
    
    // Return the created fund with ID
    return {
      ...fund,
      id: docRef.id,
      createdAt: Date.now(),
      createdBy: userId,
      members: uniqueMemberIds,
    };
  } catch (error) {
    console.error('Error creating fund:', error);
    throw error;
  }
};

/**
 * Get all funds for a user (either as creator or member)
 * @param userId User ID
 * @returns Array of funds
 */
export const getUserFunds = async (userId: string): Promise<Fund[]> => {
  try {
    // Query funds where user is a member
    const q = query(
      fundsRef, 
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore Timestamp to milliseconds
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toMillis() 
        : Date.now();
      
      return {
        ...data,
        id: doc.id,
        createdAt,
      } as Fund;
    });
  } catch (error) {
    console.error('Error getting user funds:', error);
    throw error;
  }
};

/**
 * Get a fund by ID
 * @param fundId Fund ID
 * @returns Fund data or null if not found
 */
export const getFundById = async (fundId: string): Promise<Fund | null> => {
  try {
    const docRef = doc(db, FUNDS_COLLECTION, fundId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Convert Firestore Timestamp to milliseconds
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toMillis() 
        : Date.now();
      
      return {
        ...data,
        id: docSnap.id,
        createdAt,
      } as Fund;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting fund:', error);
    throw error;
  }
};

/**
 * Update a fund
 * @param fundId Fund ID
 * @param fundData Updated fund data
 * @returns Promise that resolves when update is complete
 */
export const updateFund = async (
  fundId: string, 
  fundData: Partial<Omit<Fund, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  try {
    const docRef = doc(db, FUNDS_COLLECTION, fundId);
    
    // Add updated timestamp
    await updateDoc(docRef, {
      ...fundData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating fund:', error);
    throw error;
  }
};

/**
 * Delete a fund
 * @param fundId Fund ID
 * @returns Promise that resolves when deletion is complete
 */
export const deleteFund = async (fundId: string): Promise<void> => {
  try {
    const docRef = doc(db, FUNDS_COLLECTION, fundId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting fund:', error);
    throw error;
  }
};

/**
 * Add a member to a fund
 * @param fundId Fund ID
 * @param userId User ID to add
 * @returns Promise that resolves when update is complete
 */
export const addFundMember = async (fundId: string, userId: string): Promise<void> => {
  try {
    const fundRef = doc(db, FUNDS_COLLECTION, fundId);
    const fundDoc = await getDoc(fundRef);
    
    if (!fundDoc.exists()) {
      throw new Error('Fund not found');
    }
    
    const fundData = fundDoc.data();
    
    // Process existing members to ensure they are all string IDs
    const existingMembers = fundData.members || [];
    const memberIds: string[] = existingMembers
      .filter(member => member !== null && member !== undefined)
      .map(member => {
        // Handle different member types
        if (typeof member === 'string') {
          return member; // Already a string ID
        } else if (typeof member === 'object' && member !== null) {
          // Try to extract ID from object
          const memberId = (member as any).id;
          return memberId ? String(memberId) : '';
        } else {
          // Fallback for other types
          return String(member);
        }
      })
      .filter(id => id !== ''); // Remove any empty strings
    
    // Check if user is already a member
    if (!memberIds.includes(userId)) {
      // Add the new member and ensure no duplicates
      const updatedMembers = Array.from(new Set([...memberIds, userId]));
      
      await updateDoc(fundRef, {
        members: updatedMembers,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error adding fund member:', error);
    throw error;
  }
};

/**
 * Remove a member from a fund
 * @param fundId Fund ID
 * @param userId User ID to remove
 * @returns Promise that resolves when update is complete
 */
export const removeFundMember = async (fundId: string, userId: string): Promise<void> => {
  try {
    const fundRef = doc(db, FUNDS_COLLECTION, fundId);
    const fundDoc = await getDoc(fundRef);
    
    if (!fundDoc.exists()) {
      throw new Error('Fund not found');
    }
    
    const fundData = fundDoc.data();
    
    // Process existing members to ensure they are all string IDs
    const existingMembers = fundData.members || [];
    const memberIds: string[] = existingMembers
      .filter(member => member !== null && member !== undefined)
      .map(member => {
        // Handle different member types
        if (typeof member === 'string') {
          return member; // Already a string ID
        } else if (typeof member === 'object' && member !== null) {
          // Try to extract ID from object
          const memberId = (member as any).id;
          return memberId ? String(memberId) : '';
        } else {
          // Fallback for other types
          return String(member);
        }
      })
      .filter(id => id !== ''); // Remove any empty strings
    
    // Filter out the user to remove
    const updatedMembers = memberIds.filter(id => id !== userId);
    
    await updateDoc(fundRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing fund member:', error);
    throw error;
  }
};
