import { auth as firebaseAuth } from '../config/firebase-admin.js';
import UserAuth from '../models/userAuth.js';
import UserProfile from '../models/userProfile.js';

export class AuthenticationError extends Error {
    constructor(message, code = 401) {
        super(message);
        this.code = code;
        this.name = 'AuthenticationError';
    }
}

export const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('No authentication token provided');
        }

        const idToken = authHeader.split('Bearer ')[1];
        
        const decodedToken = await firebaseAuth.verifyIdToken(idToken)
            .catch(error => {
                console.error('Token verification failed:', error);
                throw new AuthenticationError('Invalid authentication token');
            });

        // Rest of the verification function remains the same
        if (decodedToken.exp < Date.now() / 1000) {
            throw new AuthenticationError('Token has expired');
        }

        let userAuth = await UserAuth.findOne({ firebaseUid: decodedToken.uid })
            .select('+refreshToken email role isActive isEmailVerfied tokenversion provider')
            .lean();

        if (!userAuth) {
            const session = await UserAuth.startSession();
            try {
                await session.withTransaction(async () => {
                    userAuth = await UserAuth.create([{
                        email: decodedToken.email,
                        firebaseUid: decodedToken.uid,
                        provider: decodedToken.firebase?.sign_in_provider || 'firebase',
                        isEmailVerfied: decodedToken.email_verified,
                        role: 'user',
                        lastLogin: new Date(),
                        createdAt: new Date()
                    }], { session });

                    const nameParts = decodedToken.name?.split(' ') || [];
                    const firstName = nameParts[0] || 'User';
                    const lastName = nameParts.slice(1).join(' ') || decodedToken.uid.slice(0, 5);

                    await UserProfile.create([{
                        user: userAuth[0]._id,
                        firstName,
                        lastName,
                        displayName: decodedToken.name || `User-${decodedToken.uid.slice(0, 5)}`,
                        profileImage: {
                            url: decodedToken.picture || null,
                            updatedAt: new Date()
                        },
                        createdAt: new Date()
                    }], { session });

                    userAuth = userAuth[0];
                });
            } catch (error) {
                console.error('User creation failed:', error);
                throw new AuthenticationError('Failed to create user profile', 500);
            } finally {
                await session.endSession();
            }
        } else {
            await UserAuth.findByIdAndUpdate(userAuth._id, {
                $set: { lastLogin: new Date() }
            });
        }

        if (userAuth && !userAuth.isActive) {
            throw new AuthenticationError('User account is disabled', 403);
        }

        req.firebaseUser = decodedToken;
        req.user = userAuth;
        req.userRoles = {
            isAdmin: userAuth.role === 'admin',
            isUser: userAuth.role === 'user',
        };

        next();
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return res.status(error.code).json({
                success: false,
                message: error.message
            });
        }

        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication'
        });
    }
};

export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

export const firebaseProtect = verifyFirebaseToken;