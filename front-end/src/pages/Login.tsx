import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateToSpanish } from '../i18n/translateToSpanish';
import { authService } from '../services/auth';

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const authUrl = await authService.getGoogleAuthUrl();

      // Small delay to ensure localStorage write is flushed
      // This prevents race condition where redirect happens before storage completes
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('[Login] About to redirect, state in storage:', localStorage.getItem('oauth_state'));
      window.location.href = authUrl;
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate login');
      setLoading(false);
    }
  };

  const handleTranslateClick = async () => {
    try {
      if (i18n.language === 'en') {
        await translateToSpanish();
      } else {
        await i18n.changeLanguage('en');
      }
    } catch (error) {
      console.error('Error translating to Spanish:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('login_title')}</h1>
            <p className="text-gray-600">{t('login_subtitle')}</p>
          </div>
          <button
            onClick={handleTranslateClick}
            className="self-center inline-flex items-center justify-center px-4 py-2 border border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
            aria-label="Switch interface to Spanish"
          >
            {i18n.language === 'en' ? 'Español' : 'English'}
          </button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {loading ? t('login_google_loading') : t('login_google_button')}
          </button>

          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('login_or')}</span>
            </div>
          </div> */}

          <div className="text-center text-sm text-gray-600">
            <p className="font-semibold mb-2">{t('login_authorized_admins')}</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>{t('login_authorized_domain')}</p>
              <p>{t('login_authorized_email')}</p>
            </div>
          </div>
        </div>

        {/* <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/customer')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              {t('continue_as_customer')}
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};
