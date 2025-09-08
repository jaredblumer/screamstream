import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Redirect, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Footer from '@/components/footer';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { useAuth } from '@/hooks/use-auth';
import { useConfig } from '@/hooks/use-config';
import { useSearch } from '@/contexts/SearchContext';
import { trackEvent } from '@/lib/analytics';

function useAuthCopy(activeTab: 'login' | 'register', showForgot: boolean, hasReset: boolean) {
  const heading = hasReset
    ? 'Reset Password'
    : showForgot
      ? 'Forgot Password'
      : activeTab === 'login'
        ? 'Sign In'
        : 'Create An Account';

  const subheading = hasReset
    ? 'Enter your new password below.'
    : showForgot
      ? 'Enter your email to receive a password reset link.'
      : activeTab === 'login'
        ? 'Sign in to access your personalized horror content.'
        : 'Create an account to save titles to your watchlist and receive recommendations.';

  return { heading, subheading };
}

export default function AuthPage() {
  const { user } = useAuth();
  const { config, isLoading: configLoading } = useConfig();
  const [location] = useLocation();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Read ?reset= token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset');
    if (token) {
      setResetToken(token);
      setShowForgotPassword(false);
    }
  }, [location]);

  const { setQuery } = useSearch();

  useEffect(() => {
    setQuery('');
  }, [setQuery]);

  if (user) return <Redirect to="/" />;

  if (configLoading) {
    return (
      <div className="min-h-screen horror-bg flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const { heading, subheading } = useAuthCopy(activeTab, showForgotPassword, !!resetToken);

  return (
    <>
      <Helmet>
        <title>{heading} – Scream Stream</title>
        <meta name="description" content={subheading} />
      </Helmet>

      <div className="min-h-screen horror-bg flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Hero */}
            <div className="hidden lg:block">
              <div className="text-center lg:text-left">
                <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
                  <div>Welcome to</div>
                  <div>
                    <span className="blood-red">Scream Stream</span>
                  </div>
                </h1>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Discover the best horror movies and series across popular streaming platforms.
                  Manage your watchlist, get personalized recommendations, and never miss the latest
                  spine-chilling releases.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blood-red rounded-full" />
                    <span>Curated Horror Collection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blood-red rounded-full" />
                    <span>All Popular Streaming Platforms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blood-red rounded-full" />
                    <span>Personal Watchlists</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blood-red rounded-full" />
                    <span>Critic and Audience Ratings</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Auth Card */}
            <div className="w-full max-w-md mx-auto">
              <Card className="horror-bg border-gray-700">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-white">{heading}</CardTitle>
                  <CardDescription className="text-gray-400">{subheading}</CardDescription>
                </CardHeader>

                <CardContent>
                  {resetToken ? (
                    <ResetPasswordForm
                      token={resetToken}
                      onBackToLogin={() => {
                        setResetToken(null);
                        window.history.replaceState({}, '', '/auth');
                        setActiveTab('login');
                      }}
                    />
                  ) : showForgotPassword ? (
                    <ForgotPasswordForm
                      siteKey={config.recaptchaSiteKey}
                      onBack={() => setShowForgotPassword(false)}
                      onRequestSent={() => trackEvent('Auth', 'Requested Password Reset', 'Email')}
                    />
                  ) : (
                    <>
                      <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as 'login' | 'register')}
                      >
                        <TabsList className="grid w-full grid-cols-2 gap-2 bg-transparent p-0">
                          <TabsTrigger
                            value="login"
                            className="horror-button-outline data-[state=active]:horror-button-primary"
                          >
                            Sign In
                          </TabsTrigger>
                          <TabsTrigger
                            value="register"
                            className="horror-button-outline data-[state=active]:horror-button-primary"
                          >
                            Sign Up
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="space-y-4 mt-6">
                          <LoginForm
                            siteKey={config.recaptchaSiteKey}
                            onShowForgot={() => setShowForgotPassword(true)}
                            onSuccess={() => trackEvent('User', 'Logged In', 'Email')}
                          />
                        </TabsContent>

                        <TabsContent value="register" className="space-y-4 mt-6">
                          <RegisterForm
                            siteKey={config.recaptchaSiteKey}
                            onSuccess={() => trackEvent('User', 'Created an Account', 'Email')}
                          />
                        </TabsContent>
                      </Tabs>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
