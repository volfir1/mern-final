// utils/firebase.js
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, '../config/credentials/gadget-galaxy-89369-firebase-adminsdk-ladi9-d2d5313165.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // Add the exact database URL from your Firebase console
        databaseURL: "https://gadget-galaxy-89369-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
}

export const validateFileUpload = async (file) => {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error(`File size exceeds 5MB limit`);
    }
    return true;
};

export const auth = admin.auth();
export const db = admin.firestore();
export const rtdb = admin.database(); // Add this for Realtime Database access
export default admin;