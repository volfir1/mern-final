import { auth } from '../config/firebase-admin.js';
import { getAuth, sendEmailVerification } from 'firebase/auth';

export const sendVerificationEmail = async (user) => {
  try {
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/verify-email?email=${user.email}`,
      handleCodeInApp: true,
    };

    // If using Firebase Admin SDK
    const link = await auth.generateEmailVerificationLink(
      user.email,
      actionCodeSettings
    );

    // If using Firebase Client SDK
    await sendEmailVerification(user, actionCodeSettings);

    return { success: true, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error({
      success: false,
      message: 'Failed to send verification email',
      error: error.message
    });
  }
};

// Add a function to check verification status
export const checkEmailVerification = async (user) => {
  try {
    // Reload user to get latest status
    await user.reload();
    return user.emailVerified;
  } catch (error) {
    console.error('Error checking email verification:', error);
    throw error;
  }
};

