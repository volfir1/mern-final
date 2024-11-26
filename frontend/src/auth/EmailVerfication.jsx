import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../utils/authContext';
import axios from 'axios';

const EmailVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Get email from location state or user object
    const email = location.state?.email || user?.email;
    const fromLogin = location.state?.fromLogin;

    useEffect(() => {
        // If no email in state and no user, redirect
        if (!email && !user) {
            navigate('/login');
            return;
        }

        // Automatically send verification email if coming from login
        if (fromLogin && email) {
            handleSendVerification();
        }
    }, [user, email, navigate, fromLogin]);

    useEffect(() => {
        // Handle countdown for resend button
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setResendDisabled(false);
        }
    }, [countdown]);

    const handleSendVerification = async () => {
        try {
            setLoading(true);
            setError('');
            setMessage('');

            const response = await axios.post('/api/auth/verify/send', 
                { email },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const { verificationLink } = response.data.data;
            
            if (verificationLink) {
                // Open verification link in new tab
                window.open(verificationLink, '_blank');
                setMessage('Verification link opened in a new tab. Please check your browser and click the link.');
            } else {
                setMessage('Verification email sent. Please check your email inbox and spam folder.');
            }
            
            setResendDisabled(true);
            setCountdown(60); // 60 seconds cooldown

        } catch (err) {
            console.error('Verification error:', err);
            setError(err.response?.data?.message || 'Failed to send verification email');
        } finally {
            setLoading(false);
        }
    };

    const checkVerification = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await axios.get(`/api/auth/verify/status?email=${email}`);
            
            if (response.data.data.isEmailVerified) {
                setMessage('Email verified successfully!');
                setTimeout(() => {
                    // Navigate to dashboard instead of login
                    const targetPath = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
                    navigate(targetPath, {
                        state: {
                            message: 'Welcome! Your email has been verified.',
                            type: 'success'
                        },
                        replace: true
                    });
                }, 2000);
            } else {
                setError('Email not yet verified. Please check your email and click the verification link.');
            }
        } catch (err) {
            console.error('Error checking verification:', err);
            setError(err.response?.data?.message || 'Failed to check verification status');
        } finally {
            setLoading(false);
        }
    };

    if (!email && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Verify your email
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        We need to verify your email address:{' '}
                        <span className="font-medium text-indigo-600">
                            {email}
                        </span>
                    </p>
                </div>

                {error && (
                    <Alert 
                        severity="error" 
                        onClose={() => setError('')}
                        className="my-4"
                    >
                        {error}
                    </Alert>
                )}

                {message && (
                    <Alert 
                        severity="success" 
                        onClose={() => setMessage('')}
                        className="my-4"
                    >
                        {message}
                    </Alert>
                )}

                <div className="space-y-6">
                    <div className="text-sm text-gray-600 text-center space-y-2">
                        <p>A verification link has been sent to your email.</p>
                        <p className="text-gray-500">
                            Click the link in your email or use the button below to resend the verification link.
                        </p>
                    </div>

                    <div className="flex flex-col space-y-4">
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSendVerification}
                            disabled={loading || resendDisabled}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <CircularProgress size={24} color="inherit" className="mr-2" />
                                    Sending...
                                </div>
                            ) : resendDisabled ? (
                                `Resend in ${countdown}s`
                            ) : (
                                'Resend Verification Link'
                            )}
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={checkVerification}
                            disabled={loading}
                        >
                            I've verified my email
                        </Button>

                        <Button
                            color="inherit"
                            onClick={() => navigate('/login')}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Back to login
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailVerification;