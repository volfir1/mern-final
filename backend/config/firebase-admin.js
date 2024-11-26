// config/firebase-admin.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Debug logging function
const debugConfig = () => {
    console.log('==== Firebase Configuration Debug ====');
    console.log('Database URL:', process.env.FIREBASE_DATABASE_URL);
    console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('====================================');
};

debugConfig();

// Create the service account credentials object from environment variables
const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

class FirebaseAdmin {
    constructor() {
        if (FirebaseAdmin.instance) {
            return FirebaseAdmin.instance;
        }

        this.initialize();
        FirebaseAdmin.instance = this;
    }

    initialize() {
        try {
            if (!admin.apps.length) {
                // Create the service account credentials object
                const serviceAccount = {
                    type: process.env.FIREBASE_TYPE,
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    client_id: process.env.FIREBASE_CLIENT_ID,
                    auth_uri: process.env.FIREBASE_AUTH_URI,
                    token_uri: process.env.FIREBASE_TOKEN_URI,
                    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
                    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
                };

                // Initialize app with explicit configuration
                const app = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: process.env.FIREBASE_DATABASE_URL,
                    projectId: process.env.FIREBASE_PROJECT_ID
                });

                // Initialize services
                this.auth = app.auth();
                this.db = app.database();
                this.admin = admin;

                console.log('Firebase Admin initialized successfully with database URL:', process.env.FIREBASE_DATABASE_URL);
            } else {
                const app = admin.app();
                this.auth = app.auth();
                this.db = app.database();
                this.admin = admin;
            }
        } catch (error) {
            console.error('Firebase Admin initialization error:', {
                message: error.message,
                code: error?.code,
                stack: error.stack,
                config: {
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    databaseURL: process.env.FIREBASE_DATABASE_URL
                }
            });
            throw error;
        }
    }

    getAuth() {
        if (!this.auth) {
            throw new Error('Firebase Auth not initialized');
        }
        return this.auth;
    }

    getDatabase() {
        if (!this.db) {
            throw new Error('Firebase Database not initialized');
        }
        return this.db;
    }

    async verifyEmail(email, oobCode) {
        if (!email || !oobCode) {
            throw new Error('Email and verification code are required');
        }

        const auth = this.getAuth();
        try {
            console.log('Starting email verification for:', email);

            const actionCodeInfo = await auth.checkActionCode(oobCode);

            if (actionCodeInfo.data.email.toLowerCase() !== email.toLowerCase()) {
                throw new Error('Email mismatch in verification');
            }

            await auth.applyActionCode(oobCode);

            const firebaseUser = await auth.getUserByEmail(email);
            await auth.updateUser(firebaseUser.uid, { emailVerified: true });

            const UserAuth = (await import('../models/userAuth.js')).default;
            const mongoose = (await import('mongoose')).default;
            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    const updatedUser = await UserAuth.findOneAndUpdate(
                        { email: email.toLowerCase() },
                        { 
                            isEmailVerified: true,
                            verifiedAt: new Date(),
                            status: 'active',
                            lastUpdateTimestamp: new Date()
                        },
                        { session, new: true }
                    );

                    if (!updatedUser) throw new Error('User not found in database');

                    if (this.db) {
                        await this.updateVerificationStatus(firebaseUser.uid, email, true);
                    }

                    return updatedUser;
                });
            } finally {
                await session.endSession();
            }

            return {
                success: true,
                message: 'Email verified successfully',
                isVerified: true
            };

        } catch (error) {
            console.error('Email verification error:', error);
            throw error;
        }
    }

    async sendVerificationEmail(email) {
        if (!email) throw new Error('Email is required');
        
        const auth = this.getAuth();
        try {
            const normalizedEmail = email.toLowerCase().trim();
            const actionCodeSettings = {
                url: `${process.env.FRONTEND_URL}/verify-email/complete?email=${encodeURIComponent(normalizedEmail)}`,
                handleCodeInApp: true
            };

            const verificationLink = await auth.generateEmailVerificationLink(normalizedEmail, actionCodeSettings);

            const { sendVerificationEmail } = await import('../utils/email.js');
            await sendVerificationEmail(normalizedEmail, verificationLink);

            return {
                success: true,
                message: 'Verification email sent successfully',
                ...(process.env.NODE_ENV === 'development' && { verificationLink })
            };

        } catch (error) {
            console.error('Send verification error:', error);
            throw error;
        }
    }

    async updateVerificationStatus(uid, email, isVerified) {
        if (!this.db) return false;

        try {
            await this.db.ref(`users/${uid}`).update({
                email,
                emailVerified: isVerified,
                updatedAt: this.admin.database.ServerValue.TIMESTAMP
            });
            return true;
        } catch (error) {
            console.error('Update verification status error:', error);
            return false;
        }
    }

    async deleteUser(uid) {
        if (!uid) throw new Error('User ID is required');
        
        const auth = this.getAuth();
        try {
            await auth.deleteUser(uid);

            if (this.db) {
                try {
                    await this.db.ref(`users/${uid}`).remove();
                } catch (dbError) {
                    console.error('Database deletion error:', dbError);
                }
            }

            return true;
        } catch (error) {
            console.error(`Error deleting user ${uid}:`, error);
            throw error;
        }
    }
}

// Export singleton instance
const instance = new FirebaseAdmin();

export const auth = instance.auth;
export const db = instance.db;
export const adminSDK = instance.admin;

// Export methods
export const sendVerificationEmail = (email) => instance.sendVerificationEmail(email);
export const verifyEmail = (email, code) => instance.verifyEmail(email, code);
export const deleteUser = (uid) => instance.deleteUser(uid);
export const updateVerificationStatus = (uid, email, isVerified) => 
    instance.updateVerificationStatus(uid, email, isVerified);

export default instance;