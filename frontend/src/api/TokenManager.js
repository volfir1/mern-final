// api/TokenManager.js
export class TokenManager {
    static getToken() {
        return localStorage.getItem('firebaseToken');
    }

    static setToken(token) {
        localStorage.setItem('firebaseToken', token);
    }

    static getUser() {
        const userStr = localStorage.getItem('firebaseUser');
        return userStr ? JSON.parse(userStr) : null;
    }

    static setUser(user) {
        localStorage.setItem('firebaseUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: user.role || 'user',
            emailVerified: user.emailVerified
        }));
    }

    static clearAuth() {
        localStorage.removeItem('firebaseToken');
        localStorage.removeItem('firebaseUser');
    }
}