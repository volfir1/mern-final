// utils/email.js
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL; // Changed to match your env variable

if (!SENDGRID_API_KEY) {
  console.warn('WARNING: SENDGRID_API_KEY is not set');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const sendVerificationEmail = async (email, verificationLink) => {
  // Always log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('\n=== VERIFICATION EMAIL DETAILS ===');
    console.log('To:', email);
    console.log('From:', FROM_EMAIL);
    console.log('Link:', verificationLink);
    console.log('================================\n');
  }

  try {
    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: 'Gadget Galaxy'
      },
      subject: 'Verify Your Email - Gadget Galaxy',
      text: `Please verify your email by clicking on the following link: ${verificationLink}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Welcome to Gadget Galaxy!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${verificationLink}" 
               style="display: inline-block; padding: 12px 24px; 
                      background-color: #4CAF50; color: white; 
                      text-decoration: none; border-radius: 4px; 
                      font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 12px;">If you didn't create an account with Gadget Galaxy, you can safely ignore this email.</p>
        </div>
      `
    };

    const response = await sgMail.send(msg);
    console.log('Email sent successfully:', response[0]?.statusCode);
    return true;

  } catch (error) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error('SendGrid Error Details:', error.response.body);
    }
    
    // In development, don't throw the error
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    throw error;
  }
};

export default sendVerificationEmail;