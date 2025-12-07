import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { updateAuth } = useAuth();
  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (hasHandledRef.current) return;
    hasHandledRef.current = true;

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`Authentication failed: ${errorParam}`);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!code || !state) {
        setError('Missing authorization code or state');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        await authService.handleCallback(code, state);

        // Update auth context with new user data
        updateAuth();

        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          // Redirect all users to the view selection page
          navigate('/select-view', { replace: true });
        }, 100);
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, updateAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center">
          {error ? (
            <>
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <div className="text-red-600 text-xl font-bold mb-4">
                {error}
              </div>
              <p className="text-gray-600 mb-6">
                Don't worry! You can try logging in again.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Return to Login
              </button>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Authenticating...
              </h2>
              <p className="text-gray-600">Please wait while we sign you in</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
