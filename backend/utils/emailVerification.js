import sgMail from '@sendgrid/mail';
import sgClient from '@sendgrid/client';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { getAuth } from 'firebase-admin/auth';
import firebaseAdmin from 'firebase-admin';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
sgClient.setApiKey(process.env.SENDGRID_API_KEY);

const verifyApiKey = async () => {
 try {
   const [response] = await sgClient.request({
     method: 'GET',
     url: '/v3/user/credits'
   });
   console.log('SendGrid API Key is valid:', { remainingCredits: response.body.remaining });
   return true;
 } catch (error) {
   console.error('SendGrid API Key Verification Failed:', error);
   return false;
 }
};

export const sendVerificationEmail = async (email, { name }) => {
 try {
   if (!await verifyApiKey()) {
     throw new Error('Invalid SendGrid API key');
   }

   const customToken = await firebaseAdmin.auth().createCustomToken(email);
   const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify-email?token=${customToken}`;

   const msg = {
     to: email,
     from: {
       email: process.env.SENDGRID_FROM_EMAIL,
       name: process.env.SENDGRID_FROM_NAME
     },
     subject: 'Verify Your Email Address',
     html: `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
         <h2>Welcome ${name}!</h2>
         <p>Please verify your email address by clicking the button below:</p>
         <a href="${verificationLink}" 
            data-bypass-tracking="true"
            style="display: inline-block; padding: 12px 24px; background-color: #4CAF50;
                   color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
           Verify Email
         </a>
         <p>If the button doesn't work, copy and paste this link:</p>
         <p>${verificationLink}</p>
         <p>This link will expire in 24 hours.</p>
       </div>
     `,
     tracking_settings: {
       click_tracking: {
         enable: false,
         enable_text: false
       }
     }
   };

   await sgMail.send(msg);
   return { success: true };

 } catch (error) {
   console.error('SendGrid Error:', error);
   throw error;
 }
};

export const verifyEmailWithCode = async (req, res) => {
 try {
   const { token } = req.query;
   
   if (!token) {
     return res.redirect('/email-verified?success=false&error=missing_token');
   }

   try {
     // Verify the custom token
     const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
     const email = decodedToken.email;

     // Update Firebase user
     const user = await firebaseAdmin.auth().getUserByEmail(email);
     await firebaseAdmin.auth().updateUser(user.uid, {
       emailVerified: true
     });

     return res.redirect('/email-verified?success=true');

   } catch (firebaseError) {
     console.error('Firebase error:', firebaseError);
     return res.redirect(`/email-verified?success=false&error=${firebaseError.message}`);
   }

 } catch (error) {
   console.error('Verification error:', error);
   return res.redirect(`/email-verified?success=false&error=${error.message}`);
 }
};