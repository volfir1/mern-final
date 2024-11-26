// auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { 
    TextField, 
    Button, 
    Alert, 
    CircularProgress,
    Card,
    CardContent,
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../utils/authContext';
import { toast } from 'react-hot-toast';

// Validation schema
const forgotPasswordSchema = Yup.object().shape({
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
});

function ForgotPassword() {
    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            setIsSubmitting(true);
            setError('');
            setSuccess(false);

            await resetPassword(values.email);
            
            setSuccess(true);
            resetForm();
            toast.success('Password reset email sent successfully');

            // Stay on page for a moment to show success message
            setTimeout(() => {
                navigate('/login', { 
                    state: { 
                        message: 'Check your email for password reset instructions'
                    }
                });
            }, 3000);

        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    // Rest of your component remains the same...
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full">
                <CardContent className="space-y-6 p-6">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-bold text-gray-900">
                            Reset your password
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter your email address and we'll send you instructions to reset your password.
                        </p>
                    </div>

                    {error && (
                        <Alert 
                            severity="error" 
                            onClose={() => setError('')}
                            className="mb-4"
                        >
                            {error}
                        </Alert>    
                    )}

                    {success && (
                        <Alert 
                            severity="success" 
                            className="mb-4"
                        >
                            Reset password link has been sent to your email address. Please check your inbox.
                        </Alert>
                    )}

                    <Formik
                        initialValues={{ email: '' }}
                        validationSchema={forgotPasswordSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, touched, handleChange, handleBlur, values }) => (
                            <Form className="mt-8 space-y-6">
                                <TextField
                                    fullWidth
                                    id="email"
                                    name="email"
                                    label="Email Address"
                                    value={values.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.email && Boolean(errors.email)}
                                    helperText={touched.email && errors.email}
                                    disabled={isSubmitting}
                                />

                                <div className="space-y-4">
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        disabled={isSubmitting}
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center">
                                                <CircularProgress size={24} color="inherit" className="mr-2" />
                                                Sending...
                                            </div>
                                        ) : (
                                            'Send Reset Link'
                                        )}
                                    </Button>

                                    <Link 
                                        to="/login"
                                        className="flex items-center justify-center text-sm text-indigo-600 hover:text-indigo-500"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-1" />
                                        Back to login
                                    </Link>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </CardContent>
            </Card>
        </div>
    );
}

export default ForgotPassword;