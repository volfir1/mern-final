import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { 
    TextField, 
    Button, 
    IconButton, 
    InputAdornment, 
    Alert,
    CircularProgress,
    Card,
    CardContent,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../utils/authContext';

const resetPasswordSchema = Yup.object().shape({
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[0-9]/, 'Password must contain at least one number')
        .matches(/[!@#$%^&*]/, 'Password must contain at least one special character')
        .required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm Password is required'),
});

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { confirmPasswordReset, verifyResetCode } = useAuth();
    const [oobCode, setOobCode] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const code = params.get('oobCode');

        if (!code) {
            setError('Invalid password reset link');
            setIsVerifying(false);
            return;
        }

        const verifyCode = async () => {
            try {
                const result = await verifyResetCode(code);
                setOobCode(code);
                setEmail(result.email);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsVerifying(false);
            }
        };

        verifyCode();
    }, [location, verifyResetCode]);

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            setIsResetting(true);
            setError('');

            await confirmPasswordReset(oobCode, values.password);
            navigate('/login', { 
                state: { 
                    message: 'Password reset successful. Please login with your new password.' 
                }
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsResetting(false);
            setSubmitting(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <CircularProgress />
            </div>
        );
    }

    if (error && !oobCode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <Card className="max-w-md w-full">
                    <CardContent className="space-y-6 p-6">
                        <Alert severity="error">{error}</Alert>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => navigate('/forgot-password')}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Request New Reset Link
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full">
                <CardContent className="space-y-6 p-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Reset your password
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter a new password for {email}
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

                    <Formik
                        initialValues={{ password: '', confirmPassword: '' }}
                        validationSchema={resetPasswordSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, touched, handleChange, handleBlur, values }) => (
                            <Form className="mt-8 space-y-6">
                                <div className="space-y-4">
                                    <TextField
                                        fullWidth
                                        id="password"
                                        name="password"
                                        label="New Password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={values.password}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.password && Boolean(errors.password)}
                                        helperText={touched.password && errors.password}
                                        disabled={isResetting}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                        disabled={isResetting}
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        label="Confirm New Password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={values.confirmPassword}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                                        helperText={touched.confirmPassword && errors.confirmPassword}
                                        disabled={isResetting}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        edge="end"
                                                        disabled={isResetting}
                                                    >
                                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={isResetting}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {isResetting ? (
                                        <div className="flex items-center justify-center">
                                            <CircularProgress size={24} color="inherit" className="mr-2" />
                                            Resetting Password...
                                        </div>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </Button>
                            </Form>
                        )}
                    </Formik>
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPassword;