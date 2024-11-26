// test/test-email.js
import dotenv from 'dotenv';
import firebaseAdmin from '../config/firebase-admin.js';

dotenv.config();

async function simpleTest() {
    try {
        console.log('Starting API test...');
        
        // First test: List users (simpler operation)
        console.log('Testing user listing...');
        const listUsersResult = await firebaseAdmin.auth.listUsers(1);
        console.log('Successfully listed users:', listUsersResult.users.length);
        
        // If we get here, basic authentication is working
        console.log('Basic authentication test passed!');
        
        // Now try user creation
        const testEmail = 'lesteripulan18@gmail.com';
        console.log('\nTesting user creation with email:', testEmail);
        
        try {
            const userRecord = await firebaseAdmin.auth.createUser({
                email: testEmail,
                emailVerified: false,
                displayName: 'Test User'
            });
            console.log('User created successfully:', userRecord.uid);
        } catch (error) {
            if (error.code === 'auth/email-already-exists') {
                console.log('User already exists, which is fine');
            } else {
                throw error;
            }
        }
        
        return { success: true, message: 'All tests passed!' };
    } catch (error) {
        console.error('Test failed with error:', error);
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

// Run test
console.log('Starting test sequence...');
simpleTest()
    .then(result => {
        console.log('\nFinal result:', result);
        if (result.success) {
            console.log('\n✅ Test completed successfully!');
        } else {
            console.log('\n❌ Test failed. Check the error messages above.');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test execution failed:', error);
        process.exit(1);
    });