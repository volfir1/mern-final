// firebaseAdmin.js
import firebaseAdmin from 'firebase-admin';
import dotenv from 'dotenv';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import { sendVerificationEmail } from '../utils/emailVerification.js';

dotenv.config();

class FirebaseAdmin {
  static instance = null;
  initialized = false;

  constructor() {
    if (!FirebaseAdmin.instance) {
      this.initialize();
      FirebaseAdmin.instance = this;
    }
    return FirebaseAdmin.instance;
  }

  initialize() {
    if (this.initialized) {
      console.log('Firebase Admin already initialized. Skipping initialization.');
      return;
    }

    try {
      const serviceAccount = this.getServiceAccountConfig();
      this.validateServiceAccountConfig(serviceAccount);
      const app = this.initializeFirebaseApp(serviceAccount);
      this.initializeServices(app);
      this.initialized = true;
    } catch (error) {
      console.error('Firebase Admin initialization error:', error.message);
      throw new Error('Failed to initialize Firebase Admin');
    }
  }

  getServiceAccountConfig() {
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('Firebase configuration missing. Check your environment variables.');
    }

    const config = {
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };

    if (!config.private_key || !config.client_email) {
      throw new Error('Essential Firebase configuration missing (private_key or client_email)');
    }

    return config;
  }

  validateServiceAccountConfig(config) {
    const requiredFields = [
      'type',
      'project_id',
      'private_key_id',
      'private_key',
      'client_email',
      'client_id',
      'auth_uri',
      'token_uri',
      'auth_provider_x509_cert_url',
      'client_x509_cert_url',
    ];
    
    const missingFields = requiredFields.filter(field => !config[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing Firebase service account fields: ${missingFields.join(', ')}`);
    }
  }

  initializeFirebaseApp(serviceAccount) {
    try {
      if (firebaseAdmin.apps.length) {
        console.log('Firebase Admin already initialized. Reusing existing app.');
        return firebaseAdmin.apps[0];
      }

      const app = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
        projectId: serviceAccount.project_id,
      });

      console.log('Firebase Admin initialized successfully.');
      return app;
    } catch (error) {
      console.error('Error initializing Firebase app:', error);
      throw new Error(`Failed to initialize Firebase app: ${error.message}`);
    }
  }

  initializeServices(app) {
    try {
      if (!app) {
        throw new Error('Firebase app instance is required to initialize services');
      }

      this.auth = getAuth(app);
      this.db = getFirestore(app);
      
      if (process.env.FIREBASE_DATABASE_URL) {
        this.realtimeDb = getDatabase(app);
      }
      
      if (process.env.FIREBASE_STORAGE_BUCKET) {
        this.storage = getStorage(app);
      }

      this.db.settings({
        ignoreUndefinedProperties: true,
        timestampsInSnapshots: true
      });

      console.log('Firebase services initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase services:', error);
      throw new Error(`Failed to initialize Firebase services: ${error.message}`);
    }
  }

  // User Management Methods
  async createUser(userData) {
    try {
      const userRecord = await this.auth.createUser(userData);
      console.log('Successfully created new user:', userRecord.uid);
      return userRecord;
    } catch (error) {
      console.error('Error creating new user:', error);
      throw new Error('Failed to create user');
    }
  }

  async getUserById(uid) {
    try {
      const userRecord = await this.auth.getUser(uid);
      return userRecord;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user data');
    }
  }

  async updateUser(uid, updateData) {
    try {
      const userRecord = await this.auth.updateUser(uid, updateData);
      console.log('Successfully updated user:', userRecord.uid);
      return userRecord;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(uid) {
    try {
      await this.auth.deleteUser(uid);
      console.log('Successfully deleted user:', uid);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async syncUserRole(uid, role) {
    try {
        if (!this.auth) {
            throw new Error('Auth service not initialized');
        }

        // Update Firebase custom claims
        await this.auth.setCustomUserClaims(uid, { role });
        
        // Update user metadata in Firestore
        await this.saveUserMetadata(uid, { role });
        
        console.log(`Successfully synced role '${role}' for user ${uid}`);
        return true;
    } catch (error) {
        console.error('Error syncing user role:', error);
        throw new Error(`Failed to sync user role: ${error.message}`);
    }
}
  // Authentication Methods
  async verifyIdToken(idToken) {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw new Error('Failed to verify ID token');
    }
  }

  async createCustomToken(uid, additionalClaims) {
    try {
      const customToken = await this.auth.createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error) {
      console.error('Error creating custom token:', error);
      throw new Error('Failed to create custom token');
    }
  }

  async revokeRefreshTokens(uid) {
    try {
      await this.auth.revokeRefreshTokens(uid);
      console.log('Successfully revoked refresh tokens for user:', uid);
      return true;
    } catch (error) {
      console.error('Error revoking refresh tokens:', error);
      throw new Error('Failed to revoke refresh tokens');
    }
  }

  // Email Methods
  async sendVerificationEmail(email, data) {
    try {
      await sendVerificationEmail(email, data);
      console.log(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Database Methods
  async saveUserMetadata(uid, data) {
    try {
      const userRef = this.db.collection('users').doc(uid);
      await userRef.set(data, { merge: true });
      console.log(`User metadata saved for UID: ${uid}`);
      return true;
    } catch (error) {
      console.error('Error saving user metadata:', error);
      throw new Error('Failed to save user metadata');
    }
  }

  async getUserMetadata(uid) {
    try {
      const userRef = this.db.collection('users').doc(uid);
      const doc = await userRef.get();
      if (!doc.exists) {
        throw new Error('User metadata not found');
      }
      return doc.data();
    } catch (error) {
      console.error('Error fetching user metadata:', error);
      throw new Error('Failed to fetch user metadata');
    }
  }

  async updateRealtimeDatabase(path, data) {
    try {
      if (!this.realtimeDb) {
        throw new Error('Realtime Database not initialized');
      }
      const ref = this.realtimeDb.ref(path);
      await ref.set(data);
      console.log(`Realtime Database updated at path: ${path}`);
      return true;
    } catch (error) {
      console.error('Error updating Realtime Database:', error);
      throw new Error('Failed to update Realtime Database');
    }
  }

  // Storage Methods
  async uploadFile(bucketPath, fileBuffer, metadata) {
    try {
      if (!this.storage) {
        throw new Error('Storage not initialized');
      }
      const bucket = this.storage.bucket();
      const file = bucket.file(bucketPath);
      await file.save(fileBuffer, {
        metadata: metadata
      });
      console.log(`File uploaded successfully to: ${bucketPath}`);
      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getFileDownloadUrl(bucketPath) {
    try {
      if (!this.storage) {
        throw new Error('Storage not initialized');
      }
      const bucket = this.storage.bucket();
      const file = bucket.file(bucketPath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000 // URL expires in 15 minutes
      });
      return url;
    } catch (error) {
      console.error('Error getting file download URL:', error);
      throw new Error('Failed to get file download URL');
    }
  }

  // Utility Methods
  isInitialized() {
    return this.initialized && firebaseAdmin.apps.length > 0;
  }

  getServices() {
    if (!this.isInitialized()) {
      throw new Error('Firebase Admin not properly initialized');
    }

    return {
      auth: this.auth,
      db: this.db,
      realtimeDb: this.realtimeDb,
      storage: this.storage
    };
  }
  async getUserCustomClaims(uid) {
    try {
        if (!this.auth) {
            throw new Error('Auth service not initialized');
        }

        const user = await this.auth.getUser(uid);
        return user.customClaims || {};
    } catch (error) {
        console.error('Error getting user custom claims:', error);
        throw new Error(`Failed to get user custom claims: ${error.message}`);
    }
}
}

// Create singleton instance
let firebaseAdminInstance;
try {
  if (!firebaseAdminInstance) {
    firebaseAdminInstance = new FirebaseAdmin();
    if (!firebaseAdminInstance.isInitialized()) {
      throw new Error('Firebase Admin failed to initialize properly');
    }
  }
} catch (error) {
  console.error('Critical: Failed to initialize Firebase Admin:', error);
  throw error;
}


// Export services with safety checks
export const { auth, db, realtimeDb, storage } = firebaseAdminInstance.getServices();

// Export all operations
export const firebaseOperations = {
  // User Management
  createUser: (userData) => firebaseAdminInstance.createUser(userData),
  getUserById: (uid) => firebaseAdminInstance.getUserById(uid),
  updateUser: (uid, updateData) => firebaseAdminInstance.updateUser(uid, updateData),
  deleteUser: (uid) => firebaseAdminInstance.deleteUser(uid),
  
  // Authentication
  verifyIdToken: (idToken) => firebaseAdminInstance.verifyIdToken(idToken),
  createCustomToken: (uid, claims) => firebaseAdminInstance.createCustomToken(uid, claims),
  revokeRefreshTokens: (uid) => firebaseAdminInstance.revokeRefreshTokens(uid),
  
  // Email
  sendVerificationEmail: (email, data) => firebaseAdminInstance.sendVerificationEmail(email, data),
  
  // Database
  saveUserMetadata: (uid, data) => firebaseAdminInstance.saveUserMetadata(uid, data),
  getUserMetadata: (uid) => firebaseAdminInstance.getUserMetadata(uid),
  updateRealtimeDatabase: (path, data) => firebaseAdminInstance.updateRealtimeDatabase(path, data),
  
  // Storage
  uploadFile: (path, buffer, metadata) => firebaseAdminInstance.uploadFile(path, buffer, metadata),
  getFileDownloadUrl: (path) => firebaseAdminInstance.getFileDownloadUrl(path),
  syncUserRole: (uid, role) => firebaseAdminInstance.syncUserRole(uid, role),
  getUserCustomClaims: (uid) => firebaseAdminInstance.getUserCustomClaims(uid),
  
};

export default firebaseAdminInstance;