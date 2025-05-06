import { db, auth } from './config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp,
  writeBatch,
  DocumentReference
} from 'firebase/firestore';
import { User } from '@/types';
import { User as FirebaseUser } from 'firebase/auth';

// Collection references
const USERS_COLLECTION = 'users';
const usersRef = collection(db, USERS_COLLECTION);

// Cache for user data to minimize Firestore reads
const userCache = new Map<string, { user: User; timestamp: number }>();

// Cache for search results to minimize Firestore reads
const searchCache = new Map<string, { results: User[]; timestamp: number }>();

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

// Search cache expiration time (5 minutes)
const SEARCH_CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Find a user by email
 * @param email Email to search for
 * @returns User object if found, null otherwise
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    if (!email) return null;
    
    // Security check: Ensure current user is authenticated
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      console.warn('Security warning: User must be authenticated to search for users');
      return null;
    }
    
    // Normalize email by converting to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      // Query users collection
      const q = query(usersRef, where('email', '==', normalizedEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      // Return the first matching user
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      const user = {
        id: userDoc.id,
        displayName: userData.displayName || 'Unknown User',
        email: userData.email,
        photoURL: userData.photoURL || '',
      };
      
      // Update cache
      userCache.set(user.id, {
        user,
        timestamp: Date.now()
      });
      
      return user;
    } catch (permissionError) {
      console.warn('Permission error when finding user by email:', permissionError);
      
      // If the current user's email matches the search, return the current user
      // This is a fallback when security rules prevent querying other users
      if (currentAuthUser.email?.toLowerCase() === normalizedEmail) {
        return {
          id: currentAuthUser.uid,
          displayName: currentAuthUser.displayName || 'User',
          email: currentAuthUser.email,
          photoURL: currentAuthUser.photoURL || '',
        };
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null; // Return null instead of throwing to prevent app crashes
  }
};

/**
 * Get a user by ID
 * @param userId User ID
 * @returns User object if found, null otherwise
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    if (!userId) return null;
    
    // Check cache first
    const cachedData = userCache.get(userId);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION) {
      return cachedData.user;
    }
    
    // If not in cache or expired, fetch from Firestore
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    
    const user = {
      id: userDoc.id,
      displayName: userData.displayName || 'Unknown User',
      email: userData.email,
      photoURL: userData.photoURL || '',
    };
    
    // Update cache
    userCache.set(userId, {
      user,
      timestamp: Date.now()
    });
    
    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

/**
 * Create or update a user record in Firestore
 * @param user User data
 * @returns The created/updated user
 */
export const saveUser = async (user: User): Promise<User> => {
  try {
    if (!user || !user.id) {
      throw new Error('Invalid user data');
    }
    
    // Security check: Only allow saving the current user's data
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser || currentAuthUser.uid !== user.id) {
      console.warn('Security warning: Attempting to save data for a user other than the current user');
      // Return the user without saving to avoid permission errors
      return user;
    }
    
    const userRef = doc(db, USERS_COLLECTION, user.id);
    
    try {
      // Check if user exists
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing user, but preserve certain fields
        const existingData = userDoc.data();
        
        await updateDoc(userRef, {
          // Update basic profile info
          displayName: user.displayName || existingData.displayName,
          email: user.email || existingData.email,
          photoURL: user.photoURL || existingData.photoURL,
          // Add timestamp
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new user
        await setDoc(userRef, {
          ...user,
          // Add additional fields for new users
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      }
    } catch (permissionError) {
      console.warn('Permission error when saving user data. This may be due to security rules:', permissionError);
      // Continue without throwing, as we still want to return the user object
    }
    
    // Update cache regardless of Firestore success
    userCache.set(user.id, {
      user,
      timestamp: Date.now()
    });
    
    return user;
  } catch (error) {
    console.error('Error saving user:', error);
    // Return the user object even if there was an error to prevent app crashes
    return user;
  }
};

/**
 * Get the current authenticated user from Firestore
 * If the user doesn't exist in Firestore yet, create a record
 * @returns Current user or null if not authenticated
 */
export const getCurrentFirestoreUser = async (): Promise<User | null> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return null;
    }
    
    // Try to get user from Firestore
    const user = await getUserById(currentUser.uid);
    
    if (user) {
      // User exists, update login timestamp
      await updateDoc(doc(db, USERS_COLLECTION, currentUser.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // If Firebase Auth has newer info, update Firestore
      if (currentUser.displayName !== user.displayName ||
          currentUser.email !== user.email ||
          currentUser.photoURL !== user.photoURL) {
        
        const updatedUser: User = {
          ...user,
          displayName: currentUser.displayName || user.displayName,
          email: currentUser.email || user.email,
          photoURL: currentUser.photoURL || user.photoURL
        };
        
        await saveUser(updatedUser);
        return updatedUser;
      }
      
      return user;
    }
    
    // If user doesn't exist in Firestore, create a new record
    const newUser: User = {
      id: currentUser.uid,
      displayName: currentUser.displayName || 'User',
      email: currentUser.email || '',
      photoURL: currentUser.photoURL || '',
    };
    
    return await saveUser(newUser);
  } catch (error) {
    console.error('Error getting current Firestore user:', error);
    throw error;
  }
};

/**
 * Sync a Firebase Auth user with Firestore
 * This should be called when a user signs in
 * @param firebaseUser Firebase Auth user
 * @returns Synced user from Firestore
 */
export const syncUserWithFirestore = async (firebaseUser: FirebaseUser): Promise<User> => {
  try {
    if (!firebaseUser) {
      throw new Error('No Firebase user provided');
    }
    
    // Convert Firebase user to our User type
    const userToSync: User = {
      id: firebaseUser.uid,
      displayName: firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || '',
    };
    
    try {
      // Save to Firestore (this will create or update as needed)
      await saveUser(userToSync);
      
      // Try to update login timestamp, but don't fail if it doesn't work
      await updateDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
      }).catch(err => {
        console.warn('Could not update lastLoginAt timestamp:', err);
        // Continue without throwing
      });
    } catch (permissionError) {
      console.warn('Permission error when syncing user. Using local data instead:', permissionError);
      // Continue without throwing, as we still want to return the user object
    }
    
    // Update cache
    userCache.set(userToSync.id, {
      user: userToSync,
      timestamp: Date.now()
    });
    
    return userToSync;
  } catch (error) {
    console.error('Error syncing user with Firestore:', error);
    // If we can't sync, still return a user object based on Firebase Auth
    if (firebaseUser) {
      return {
        id: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
      };
    }
    throw error;
  }
};

/**
 * Add a user to a fund by email
 * @param fundId Fund ID
 * @param email Email of the user to add
 * @returns True if successful, false if user not found
 */
export const addUserToFundByEmail = async (fundId: string, email: string): Promise<boolean> => {
  try {
    if (!fundId || !email) {
      throw new Error('Fund ID and email are required');
    }
    
    // Security check: Ensure current user is authenticated
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      console.warn('Security warning: User must be authenticated to add members');
      return false;
    }
    
    // Find user by email
    const user = await findUserByEmail(email);
    
    if (!user) {
      // If user doesn't exist in our system yet, we could implement an invitation system here
      // For now, just return false
      return false;
    }
    
    try {
      // Get fund reference
      const fundRef = doc(db, 'funds', fundId);
      const fundDoc = await getDoc(fundRef);
      
      if (!fundDoc.exists()) {
        throw new Error('Fund not found');
      }
      
      const fundData = fundDoc.data();
      const members = fundData.members || [];
      
      // Security check: Ensure current user is a member of the fund
      if (!members.includes(currentAuthUser.uid)) {
        console.warn('Security warning: Current user is not a member of this fund');
        return false;
      }
      
      // Check if user is already a member
      if (members.includes(user.id)) {
        return true; // Already a member, consider it success
      }
      
      // Add user to fund members
      await updateDoc(fundRef, {
        members: [...members, user.id],
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (permissionError) {
      console.warn('Permission error when adding user to fund:', permissionError);
      return false;
    }
  } catch (error) {
    console.error('Error adding user to fund by email:', error);
    return false; // Return false instead of throwing to prevent app crashes
  }
};

/**
 * Batch get multiple users by IDs
 * @param userIds Array of user IDs
 * @returns Map of user IDs to User objects
 */
export const batchGetUsers = async (userIds: string[]): Promise<Map<string, User>> => {
  try {
    if (!userIds || userIds.length === 0) {
      return new Map();
    }
    
    // Deduplicate IDs
    const uniqueIds = [...new Set(userIds)];
    const result = new Map<string, User>();
    const idsToFetch: string[] = [];
    
    // Check cache first
    uniqueIds.forEach(id => {
      const cachedData = userCache.get(id);
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION) {
        result.set(id, cachedData.user);
      } else {
        idsToFetch.push(id);
      }
    });
    
    if (idsToFetch.length === 0) {
      return result;
    }
    
    // Firestore only allows batches of 10 in 'in' queries
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < idsToFetch.length; i += batchSize) {
      const batch = idsToFetch.slice(i, i + batchSize);
      batches.push(batch);
    }
    
    // Execute all batches in parallel
    const batchResults = await Promise.all(
      batches.map(async (batchIds) => {
        const q = query(usersRef, where('__name__', 'in', batchIds));
        return getDocs(q);
      })
    );
    
    // Process results
    batchResults.forEach(querySnapshot => {
      querySnapshot.docs.forEach(doc => {
        const userData = doc.data();
        const user: User = {
          id: doc.id,
          displayName: userData.displayName || 'Unknown User',
          email: userData.email || '',
          photoURL: userData.photoURL || '',
        };
        
        result.set(user.id, user);
        
        // Update cache
        userCache.set(user.id, {
          user,
          timestamp: Date.now()
        });
      });
    });
    
    return result;
  } catch (error) {
    console.error('Error batch getting users:', error);
    return new Map(); // Return empty map instead of throwing to prevent app crashes
  }
};

/**
 * Search for users by name or email
 * @param query Search query (name or email)
 * @param limit Maximum number of results to return
 * @returns Array of matching users
 */
export const searchUsers = async (query: string, limit: number = 5): Promise<User[]> => {
  try {
    if (!query || query.length < 2) return [];
    
    // Security check: Ensure current user is authenticated
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      console.warn('Security warning: User must be authenticated to search for users');
      return [];
    }
    
    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check cache first
    const cacheKey = `${normalizedQuery}_${limit}`;
    const cachedData = searchCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < SEARCH_CACHE_EXPIRATION) {
      return cachedData.results;
    }
    
    try {
      // We'll use a simpler approach since we don't have indexes set up for complex queries
      // Get all users and filter in memory (this is OK for small user bases)
      const usersSnapshot = await getDocs(usersRef);
      
      if (usersSnapshot.empty) {
        return [];
      }
      
      const results: User[] = [];
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        const email = (userData.email || '').toLowerCase();
        const displayName = (userData.displayName || '').toLowerCase();
        
        // Check if email or displayName contains the query
        if (email.includes(normalizedQuery) || displayName.includes(normalizedQuery)) {
          results.push({
            id: doc.id,
            displayName: userData.displayName || 'Unknown User',
            email: userData.email || '',
            photoURL: userData.photoURL || '',
          });
        }
      });
      
      // Sort results by relevance (exact matches first, then partial matches)
      results.sort((a, b) => {
        const aEmail = a.email.toLowerCase();
        const bEmail = b.email.toLowerCase();
        const aName = a.displayName.toLowerCase();
        const bName = b.displayName.toLowerCase();
        
        // Exact email match gets highest priority
        if (aEmail === normalizedQuery && bEmail !== normalizedQuery) return -1;
        if (bEmail === normalizedQuery && aEmail !== normalizedQuery) return 1;
        
        // Exact name match gets next priority
        if (aName === normalizedQuery && bName !== normalizedQuery) return -1;
        if (bName === normalizedQuery && aName !== normalizedQuery) return 1;
        
        // Email starts with query gets next priority
        if (aEmail.startsWith(normalizedQuery) && !bEmail.startsWith(normalizedQuery)) return -1;
        if (bEmail.startsWith(normalizedQuery) && !aEmail.startsWith(normalizedQuery)) return 1;
        
        // Name starts with query gets next priority
        if (aName.startsWith(normalizedQuery) && !bName.startsWith(normalizedQuery)) return -1;
        if (bName.startsWith(normalizedQuery) && !aName.startsWith(normalizedQuery)) return 1;
        
        // Alphabetical by name as fallback
        return aName.localeCompare(bName);
      });
      
      // Limit results
      const limitedResults = results.slice(0, limit);
      
      // Update cache
      searchCache.set(cacheKey, {
        results: limitedResults,
        timestamp: Date.now()
      });
      
      return limitedResults;
    } catch (permissionError) {
      console.warn('Permission error when searching users:', permissionError);
      
      // If the current user's email or name matches the search, return the current user
      if (currentAuthUser.email?.toLowerCase().includes(normalizedQuery) ||
          currentAuthUser.displayName?.toLowerCase().includes(normalizedQuery)) {
        return [{
          id: currentAuthUser.uid,
          displayName: currentAuthUser.displayName || 'User',
          email: currentAuthUser.email || '',
          photoURL: currentAuthUser.photoURL || '',
        }];
      }
      
      return [];
    }
  } catch (error) {
    console.error('Error searching users:', error);
    return []; // Return empty array instead of throwing to prevent app crashes
  }
};

/**
 * Create a user suggestion from an email
 * @param email Email to create suggestion from
 * @returns User suggestion object
 */
export const createUserSuggestionFromEmail = (email: string): User => {
  // Generate a display name from the email
  const displayName = email.split('@')[0]
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  
  // Generate a placeholder avatar URL using the first letter
  const firstLetter = displayName.charAt(0).toUpperCase();
  const photoURL = `https://ui-avatars.com/api/?name=${firstLetter}&background=random&color=fff`;
  
  return {
    id: 'suggestion_' + email,
    displayName,
    email,
    photoURL,
  };
};
