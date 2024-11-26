// services/authSync.js
import firebaseAdmin, { auth, db, adminSDK } from '../config/firebase-admin.js';
import UserAuth from '../models/userAuth.js';

class AuthSyncService {
    static async verifyEmail(email, code) {
        try {
            // 1. Verify with Firebase first
            await auth.checkActionCode(code);
            await auth.applyActionCode(code);
            const userRecord = await auth.getUserByEmail(email);

            // 2. Update all databases atomically
            const updatePromises = [
                // Firebase Auth
                auth.updateUser(userRecord.uid, { emailVerified: true }),
                
                // MongoDB
                UserAuth.findOneAndUpdate(
                    { email },
                    { 
                        isEmailVerified: true,
                        verifiedAt: new Date(),
                        lastUpdateTimestamp: new Date()
                    }
                )
            ];

            // Add Realtime Database update if available
            if (db) {
                updatePromises.push(
                    db.ref(`users/${userRecord.uid}`).update({
                        email,
                        emailVerified: true,
                        updatedAt: adminSDK.database.ServerValue.TIMESTAMP
                    })
                );
            }

            await Promise.all(updatePromises);

            return {
                success: true,
                message: 'Email verified and synced across databases',
                uid: userRecord.uid
            };
        } catch (error) {
            console.error('Email verification sync error:', error);
            throw error;
        }
    }

    static async checkSyncStatus(email) {
        try {
            const [firebaseUser, mongoUser] = await Promise.all([
                auth.getUserByEmail(email),
                UserAuth.findOne({ email })
            ]);

            if (!mongoUser || !firebaseUser) {
                throw new Error('User not found in one or more databases');
            }

            let rtdbStatus = false;
            if (db) {
                const rtdbSnapshot = await db
                    .ref(`users/${firebaseUser.uid}`)
                    .once('value');
                rtdbStatus = rtdbSnapshot.exists() ? rtdbSnapshot.val().emailVerified : false;
            }

            const statuses = {
                firebaseAuth: firebaseUser.emailVerified,
                mongodb: mongoUser.isEmailVerified,
                rtdb: rtdbStatus
            };

            const needsSync = Object.values(statuses).some(status => status !== statuses.firebaseAuth);

            return {
                synced: !needsSync,
                statuses,
                uid: firebaseUser.uid
            };
        } catch (error) {
            console.error('Sync status check error:', error);
            throw error;
        }
    }

    static async forceSync(email) {
        try {
            const status = await this.checkSyncStatus(email);
            
            if (!status.synced) {
                const sourceOfTruth = status.statuses.firebaseAuth;
                
                const updatePromises = [
                    UserAuth.findOneAndUpdate(
                        { email },
                        { 
                            isEmailVerified: sourceOfTruth,
                            ...(sourceOfTruth && { verifiedAt: new Date() }),
                            lastUpdateTimestamp: new Date()
                        }
                    )
                ];

                if (db) {
                    updatePromises.push(
                        db.ref(`users/${status.uid}`).update({
                            emailVerified: sourceOfTruth,
                            updatedAt: adminSDK.database.ServerValue.TIMESTAMP
                        })
                    );
                }

                await Promise.all(updatePromises);

                return {
                    success: true,
                    message: 'Forced sync completed',
                    syncedTo: sourceOfTruth
                };
            }

            return {
                success: true,
                message: 'All databases already in sync',
                syncedTo: status.statuses.firebaseAuth
            };
        } catch (error) {
            console.error('Force sync error:', error);
            throw error;
        }
    }
}

export default AuthSyncService;