// frontend/src/components/TestFirebase.jsx
import { useState } from 'react';
import { auth } from '../config/firebase.config';
import { signInWithEmailAndPassword } from 'firebase/auth';

export const TestFirebase = () => {
    const [status, setStatus] = useState('idle');

    const testConnection = async () => {
        try {
            setStatus('testing');
            // Just checking if Firebase is initialized
            if (auth) {
                setStatus('success');
                console.log('Firebase initialized successfully!');
            }
        } catch (error) {
            setStatus('error');
            console.error('Firebase test failed:', error);
        }
    };

    return (
        <div>
            <h2>Firebase Connection Test</h2>
            <button onClick={testConnection}>
                Test Firebase Connection
            </button>
            <p>Status: {status}</p>
        </div>
    );
};