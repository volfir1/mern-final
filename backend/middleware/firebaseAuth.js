import { auth } from '../config/firebase-admin.js';
import UserAuth from '../models/userAuth.js'; // Ensure the User model is imported

export const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized. No token provided.' 
            });
        }

        const token = authorization.split('Bearer ')[1];
        try {
            const decodedToken = await auth.verifyIdToken(token);
            req.firebaseUser = decodedToken;
            next();
        } catch (error) {
            console.error('Firebase token verification error:', error);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired token' 
            });
        }
    } catch (error) {
        console.error('Firebase auth middleware error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error during authentication' 
        });
    }
};

export const ensureUserExists = async (req, res, next) => {
    try {
        const { uid } = req.firebaseUser;
        const user = await UserAuth.findOne({ firebaseUid: uid });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found in database',
            });
        }

        req.user = user; // Attach the user to the request
        next();
    } catch (error) {
        console.error('Database user check error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error checking user in database',
        });
    }
};