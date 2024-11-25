# Environment Variables and Security

## Setup
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables:
   - Get Firebase configuration from your Firebase Console
   - Set up Google OAuth credentials in Google Cloud Console
   - Configure Cloudinary credentials from your Cloudinary Dashboard
   - Generate VAPID keys for web push notifications

## Security Guidelines
- Never commit `.env` files to version control
- Keep sensitive keys out of your codebase
- Rotate credentials regularly
- Use different credentials for development and production
- Restrict API key usage with proper security rules
- For production:
  - Use environment variables in your deployment platform
  - Enable security features in Firebase Console
  - Set up proper CORS rules in your backend
  - Restrict API key usage in Cloudinary

## Firebase Security
- Enable Authentication providers you need
- Set up proper Firebase Security Rules
- Regularly monitor Firebase Console for unusual activity

## Cloudinary Security
- Use signed uploads
- Set proper upload presets
- Monitor usage and set up proper restrictions