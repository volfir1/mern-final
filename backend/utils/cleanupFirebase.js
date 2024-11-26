// utils/cleanupFirebase.js
import { auth } from '../config/firebase-admin.js'; // Ensure Firestore is imported

// Delete single user with retry mechanism
export const deleteFirebaseUser = async (email, retryAttempts = 3) => {
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const user = await auth.getUserByEmail(email);
      if (user) {
        await auth.deleteUser(user.uid);
        console.log(`Successfully deleted Firebase user: ${email}`);
        return { success: true, uid: user.uid };
      }
      return { success: false, reason: 'user-not-found' };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return { success: false, reason: 'user-not-found' };
      }
      if (attempt === retryAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Delete all users with batch processing and progress tracking
export const deleteAllFirebaseUsers = async (batchSize = 100) => {
  try {
    // Delete from Firestore first
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    const firestoreDeletions = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(firestoreDeletions);

    // Then delete from Authentication
    let nextPageToken;
    let deletedCount = 0;
    
    do {
      const listUsersResult = await auth.listUsers(batchSize, nextPageToken);
      const users = listUsersResult.users;
      nextPageToken = listUsersResult.pageToken;

      if (users.length === 0) break;

      for (const user of users) {
        try {
          await auth.deleteUser(user.uid);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete user ${user.email}:`, error);
        }
      }
    } while (nextPageToken);

    return {
      success: true,
      totalProcessed: deletedCount,
      deletedCount,
      message: deletedCount > 0 ? `Deleted ${deletedCount} users` : 'No users found to delete',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Fatal error in deleteAllFirebaseUsers:', error);
    throw error;
  }
};

// Utility to check remaining users after cleanup
export const verifyCleanup = async () => {
  try {
    const { users } = await auth.listUsers();
    return {
      success: true,
      remainingUsers: users.length,
      details: users.map(u => ({ email: u.email, uid: u.uid }))
    };
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
};