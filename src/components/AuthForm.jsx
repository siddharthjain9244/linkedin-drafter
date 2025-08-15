import React, { useState } from 'react';
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification 
} from '../authService';

const AuthForm = () => {
  const [authError, setAuthError] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    const email = event.target.email.value;
    const password = event.target.password.value;

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setAuthError('Sign-up successful! Please check your email to verify your account before logging in.');
        setIsLoginMode(true);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      let errorMessage = "An unknown authentication error occurred.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already in use. Try logging in or use a different email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak (should be at least 6 characters).';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid credentials. Please check your email and password.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many login attempts. Please try again later.';
          break;
        default:
          errorMessage = `Authentication failed: ${error.message}`;
          break;
      }
      setAuthError(errorMessage);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <style>{`
          /* Basic styles for auth forms, similar to main app's input fields */
          .auth-container {
            background-color: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(16px);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border-radius: 1.5rem;
            padding: 2rem;
            max-width: 28rem;
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 10;
            text-align: center;
          }
          .auth-title {
            font-size: 2.25rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 1.5rem;
          }
          .auth-form-group {
            margin-bottom: 1rem;
            text-align: left;
          }
          .auth-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.5rem;
          }
          .auth-input {
            width: 100%;
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: 1px solid #d1d5db;
            background-color: #fff;
            color: #111827;
            transition: all 0.2s ease-in-out;
          }
          .auth-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
          }
          .auth-button {
            width: 100%;
            background-color: #2563eb;
            color: #fff;
            font-weight: 600;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease-in-out;
            cursor: pointer;
            border: none;
            margin-top: 1.5rem;
          }
          .auth-button:hover {
            background-color: #1d4ed8;
          }
          .auth-button:disabled {
            background-color: #9ca3af;
            cursor: not-allowed;
          }
          .auth-toggle-text {
            margin-top: 1rem;
            font-size: 0.875rem;
            color: #4b5563;
          }
          .auth-toggle-link {
            color: #2563eb;
            font-weight: 600;
            cursor: pointer;
            text-decoration: underline;
          }
          .auth-error {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            color: #b91c1c;
            padding: 0.75rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
            font-size: 0.875rem;
          }
          @media (prefers-color-scheme: dark) {
            .auth-container {
              background-color: rgba(31, 41, 55, 0.9);
              border-color: rgba(75, 85, 99, 0.2);
            }
            .auth-title {
              color: #f9fafb;
            }
            .auth-label {
              color: #d1d5db;
            }
            .auth-input {
              background-color: #374151;
              color: #e5e7eb;
              border-color: rgba(107, 114, 128, 0.4);
            }
            .auth-toggle-text {
              color: #9ca3af;
            }
            .auth-error {
              background-color: rgba(153, 27, 27, 0.2);
              border-color: rgba(153, 27, 27, 0.3);
              color: #fecaca;
            }
          }
        `}</style>
        <div className="auth-container">
          <h2 className="auth-title">{isLoginMode ? 'Login' : 'Sign Up'}</h2>
          <form onSubmit={handleAuthSubmit}>
            <div className="auth-form-group">
              <label htmlFor="email" className="auth-label">Email</label>
              <input type="email" id="email" className="auth-input" required />
            </div>
            <div className="auth-form-group">
              <label htmlFor="password" className="auth-label">Password</label>
              <input type="password" id="password" className="auth-input" required />
            </div>
            <button type="submit" className="auth-button">
              {isLoginMode ? 'Login' : 'Sign Up'}
            </button>
          </form>
          {authError && <div className="auth-error">{authError}</div>}
          <p className="auth-toggle-text">
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <span className="auth-toggle-link" onClick={() => setIsLoginMode(!isLoginMode)}>
              {isLoginMode ? 'Sign Up' : 'Login'}
            </span>
          </p>
        </div>
      </div>
  );
};

export default AuthForm;
