// components/ProfileUpdate.jsx
import React, { useState } from 'react';
import { useAuth } from '../utils/authContext';
import { Loader2 } from 'lucide-react';

export const ProfileUpdate = () => {
    const { user, updateUserProfile, error, setError } = useAuth();
    const [loading, setLoading] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(user?.photoURL || null);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await updateUserProfile({
                displayName: displayName || user?.displayName,
                photoFile: photoFile
            });
            // Show success message
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Update Profile</h2>
            
            {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Profile Photo
                    </label>
                    <div className="mt-2 flex items-center space-x-4">
                        <div className="relative">
                            <img
                                src={photoPreview || user?.photoURL || '/default-avatar.png'}
                                alt="Profile"
                                className="h-20 w-20 rounded-full object-cover"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => document.querySelector('input[type="file"]').click()}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                            Change photo
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        'Update Profile'
                    )}
                </button>
            </form>
        </div>
    );
};