// utils/firestoreStorage.js
import { db } from './firebase.js';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

/**
 * Upload image data to Firestore
 * @param {Buffer} file - Image file buffer
 * @param {string} path - Document path in Firestore
 * @returns {Promise<{url: string, path: string}>}
 */
export const uploadToFirestore = async (file, path) => {
    // Convert buffer to base64
    const base64Image = file.buffer.toString('base64');
    const imageData = {
        contentType: file.mimetype,
        data: base64Image,
        name: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString()
    };

    // Store in Firestore
    const docRef = doc(db, 'images', path);
    await setDoc(docRef, imageData);

    return {
        url: `data:${file.mimetype};base64,${base64Image}`,
        path: path
    };
};

/**
 * Delete image data from Firestore
 * @param {string} path - Document path in Firestore
 */
export const deleteFromFirestore = async (path) => {
    const docRef = doc(db, 'images', path);
    await deleteDoc(docRef);
};

/**
 * Get image data from Firestore
 * @param {string} path - Document path in Firestore
 * @returns {Promise<{url: string, path: string}>}
 */
export const getFromFirestore = async (path) => {
    const docRef = doc(db, 'images', path);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        throw new Error('Image not found');
    }

    const imageData = docSnap.data();
    return {
        url: `data:${imageData.contentType};base64,${imageData.data}`,
        path: path
    };
};