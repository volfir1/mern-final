// test/troubleshoot-email.js
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

async function troubleshootEmail() {
    try {
        console.log('Starting email troubleshooting...\n');

        // 1. Check environment variables
        console.log('1. Checking environment variables:');
        const requiredVars = [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_CLIENT_EMAIL',
            'FRONTEND_URL',
            'FIREBASE_AUTH_DOMAIN'
        ];

        requiredVars.forEach(varName => {
            console.log(`${varName}: ${process.env[varName] ? '✓ Present' : '✗ Missing'}`);
        });

        // 2. Initialize Firebase Admin
        console.log('\n2. Initializing Firebase Admin...');
        const app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            })
        });

        // 3. Test user operations
        console.log('\n3. Testing user operations...');
        const auth = app.auth();
        const testEmail = 'lesteripulan18@gmail.com';

        // Get or create test user
        let user;
        try {
            user = await auth.getUserByEmail(testEmail);
            console.log('Found existing user:', user.uid);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                user = await auth.createUser({
                    email: testEmail,
                    emailVerified: false
                });
                console.log('Created new user:', user.uid);
            } else {
                throw error;
            }
        }

        // 4. Test verification link generation
        console.log('\n4. Testing verification link generation...');
        const actionCodeSettings = {
            url: `${process.env.FRONTEND_URL}/verify-email?email=${encodeURIComponent(testEmail)}`,
            handleCodeInApp: true
        };

        const link = await auth.generateEmailVerificationLink(testEmail, actionCodeSettings);
        console.log('Verification link generated:', link);

        console.log('\n✅ Troubleshooting completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Error during troubleshooting:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
    } finally {
        process.exit(0);
    }
}

troubleshootEmail();