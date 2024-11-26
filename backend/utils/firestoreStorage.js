// utils/firestoreStorage.js
import { db } from './firebase.js';
import { doc, setDoc, deleteDoc, getDoc, collection } from 'firebase/firestore';

/**
 * Upload image data to Firestore
 * @param {Object} file - Express multer file object
 * @param {string} path - Document path in Firestore
 * @returns {Promise<{url: string, path: string}>}
 */
export const uploadToFirestore = async (file, path) => {
    try {
        // Convert buffer to base64
        const base64Image = file.buffer.toString('base64');
        const imageData = {
            contentType: file.mimetype,
            data: base64Image,
            name: file.originalname,
            size: file.size,
            uploadedAt: new Date().toISOString()
        };

        // Create a reference to the images collection
        const imagesRef = collection(db, 'images');
        const imageDoc = doc(imagesRef, path);

        // Store in Firestore
        await setDoc(imageDoc, imageData);

        return {
            url: `data:${file.mimetype};base64,${base64Image}`,
            path: path
        };
    } catch (error) {
        console.error('Error uploading to Firestore:', error);
        throw new Error('Failed to upload image to Firestore');
    }
};

/**
 * Delete image data from Firestore
 * @param {string} path - Document path in Firestore
 */
export const deleteFromFirestore = async (path) => {
    try {
        const imageDoc = doc(db, 'images', path);
        await deleteDoc(imageDoc);
    } catch (error) {
        console.error('Error deleting from Firestore:', error);
        throw new Error('Failed to delete image from Firestore');
    }
};

/**
 * Get image data from Firestore
 * @param {string} path - Document path in Firestore
 * @returns {Promise<{url: string, path: string}>}
 */
export const getFromFirestore = async (path) => {
    try {
        const imageDoc = doc(db, 'images', path);
        const docSnap = await getDoc(imageDoc);

        if (!docSnap.exists()) {
            throw new Error('Image not found');
        }

        const imageData = docSnap.data();
        return {
            url: `data:${imageData.contentType};base64,${imageData.data}`,
            path: path
        };
    } catch (error) {
        console.error('Error getting from Firestore:', error);
        throw new Error('Failed to retrieve image from Firestore');
    }
};