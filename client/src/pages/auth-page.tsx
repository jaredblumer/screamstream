import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useConfig } from "@/hooks/use-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect, useLocation, Link, useRouter } from "wouter";
import { Eye, EyeOff, Mail, User, Lock, ArrowLeft, Skull, Shield } from "lucide-react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReCAPTCHA from "react-google-recaptcha";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  recaptchaToken: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  recaptchaToken: z.string().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters long"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginData = z.infer<typeof loginSchema>;
type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { config, isLoading: configLoading } = useConfig();
  const { toast } = useToast();
  const router = useRouter();
  const [location] = useLocation();
  
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const loginRecaptchaRef = useRef<ReCAPTCHA>(null);
  const registerRecaptchaRef = useRef<ReCAPTCHA>(null);
  const forgotPasswordRecaptchaRef = useRef<ReCAPTCHA>(null);


  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      recaptchaToken: "",
    },
  });

  const registerForm = useForm<InsertUser & { recaptchaToken?: string }>({
    resolver: zodResolver(insertUserSchema.extend({ 
      recaptchaToken: z.string().optional() 
    })),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      recaptchaToken: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      recaptchaToken: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reset email sent",
        description: data.message,
      });
      setShowForgotPassword(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const res = await apiRequest("POST", "/api/auth/reset-password", {
        token: resetToken,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password reset successful",
        description: data.message,
      });
      setResetToken(null);
      // Clear URL params and redirect to login
      window.history.replaceState({}, '', '/auth');
      setActiveTab("login");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check for reset token in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset');
    if (token) {
      setResetToken(token);
      setShowForgotPassword(false);
    }
  }, [location]);

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        loginRecaptchaRef.current?.reset();
        
        // Check for redirect parameter and navigate accordingly
        console.log('Current URL:', window.location.href);
        console.log('Current search params:', window.location.search);
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        console.log('Login redirect param:', redirect);
        console.log('All URL params:', Array.from(urlParams.entries()));
        
        if (redirect === 'watchlist') {
          console.log('Redirecting to watchlist');
          window.location.href = "/watchlist";
        } else {
          console.log('Redirecting to home');
          window.location.href = "/";
        }
      },
      onError: () => {
        loginRecaptchaRef.current?.reset();
        loginForm.setValue("recaptchaToken", "");
      }
    });
  };

  const onRegister = (data: InsertUser & { recaptchaToken: string }) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Account created!",
          description: "Welcome to Scream Stream. Start discovering horror content.",
        });
        registerRecaptchaRef.current?.reset();
        
        // Check for redirect parameter and navigate accordingly
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        if (redirect === 'watchlist') {
          window.location.href = "/watchlist";
        } else {
          window.location.href = "/";
        }
      },
      onError: () => {
        registerRecaptchaRef.current?.reset();
        registerForm.setValue("recaptchaToken", "");
      }
    });
  };

  const onForgotPassword = (data: ForgotPasswordData) => {
    forgotPasswordMutation.mutate(data, {
      onSuccess: () => {
        forgotPasswordRecaptchaRef.current?.reset();
        forgotPasswordForm.reset();
      },
      onError: () => {
        forgotPasswordRecaptchaRef.current?.reset();
        forgotPasswordForm.setValue("recaptchaToken", "");
      }
    });
  };

  const onResetPassword = (data: ResetPasswordData) => {
    resetPasswordMutation.mutate({ ...data, token: resetToken }, {
      onSuccess: () => {
        resetPasswordForm.reset();
      }
    });
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  // Show loading while config is loading
  if (configLoading) {
    return <div className="min-h-screen horror-bg flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen horror-bg flex flex-col">
      {/* Header */}
      <header className="dark-gray-bg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold blood-red flex items-center">
                  <Skull className="mr-1 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  Scream Stream
                </h1>
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link 
                href="/" 
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                Browse Movies
              </Link>
              <Link 
                href="/subgenres" 
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                Subgenres
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden lg:block">
          <div className="text-center lg:text-left">
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              Welcome to <span className="blood-red">Scream Stream</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Discover the best horror movies and series across all streaming platforms. 
              Get personalized recommendations, manage your watchlist, and never miss 
              the latest spine-chilling releases.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blood-red rounded-full"></div>
                <span>Curated Horror Collection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blood-red rounded-full"></div>
                <span>Multiple Streaming Platforms</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blood-red rounded-full"></div>
                <span>Personal Watchlists</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blood-red rounded-full"></div>
                <span>Expert Reviews & Ratings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <div className="w-full max-w-md mx-auto">
          <Card className="horror-bg border-gray-700">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">
                {resetToken ? "Reset Password" : showForgotPassword ? "Forgot Password" : "Get Started"}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {resetToken 
                  ? "Enter your new password below" 
                  : showForgotPassword 
                    ? "Enter your email to receive a password reset link"
                    : "Sign in to your account or create a new one"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetToken ? (
                // Reset Password Form
                <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-gray-300">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        className="pl-10 pr-10 horror-bg border-gray-700 text-white placeholder-gray-500"
                        {...resetPasswordForm.register("newPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {resetPasswordForm.formState.errors.newPassword && (
                      <p className="text-red-400 text-sm">{resetPasswordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-gray-300">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        className="pl-10 horror-bg border-gray-700 text-white placeholder-gray-500"
                        {...resetPasswordForm.register("confirmPassword")}
                      />
                    </div>
                    {resetPasswordForm.formState.errors.confirmPassword && (
                      <p className="text-red-400 text-sm">{resetPasswordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>



                  <Button 
                    type="submit" 
                    className="w-full bg-blood-red hover:bg-red-700 text-white"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setResetToken(null);
                        window.history.replaceState({}, '', '/auth');
                      }}
                      className="text-sm text-gray-400 hover:text-red-400 transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Back to login
                    </button>
                  </div>
                </form>
              ) : showForgotPassword ? (
                // Forgot Password Form
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-10 horror-bg border-gray-700 text-white placeholder-gray-500"
                        {...forgotPasswordForm.register("email")}
                      />
                    </div>
                    {forgotPasswordForm.formState.errors.email && (
                      <p className="text-red-400 text-sm">{forgotPasswordForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  {/* reCAPTCHA */}
                  {config.recaptchaSiteKey && (
                    <div className="space-y-2 flex flex-col items-center">
                      <ReCAPTCHA
                        ref={forgotPasswordRecaptchaRef}
                        sitekey={config.recaptchaSiteKey}
                        onChange={(token) => {
                          forgotPasswordForm.setValue("recaptchaToken", token || "");
                          forgotPasswordForm.clearErrors("recaptchaToken");
                        }}
                        onExpired={() => {
                          forgotPasswordForm.setValue("recaptchaToken", "");
                        }}
                        onError={() => {
                          console.error("reCAPTCHA error occurred");
                          forgotPasswordForm.setValue("recaptchaToken", "");
                        }}
                        theme="dark"
                      />
                      {forgotPasswordForm.formState.errors.recaptchaToken && (
                        <p className="text-red-400 text-sm text-center">{forgotPasswordForm.formState.errors.recaptchaToken.message}</p>
                      )}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-blood-red hover:bg-red-700 text-white"
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-sm text-gray-400 hover:text-red-400 transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Back to login
                    </button>
                  </div>
                </form>
              ) : (
                // Regular Login/Register Tabs
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 horror-bg">
                    <TabsTrigger value="login" className="data-[state=active]:bg-blood-red data-[state=active]:text-white">
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="register" className="data-[state=active]:bg-blood-red data-[state=active]:text-white">
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                <TabsContent value="login" className="space-y-4 mt-6">
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username" className="text-gray-300">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="login-username"
                          type="text"
                          placeholder="Enter your username"
                          className="pl-10 horror-bg border-gray-700 text-white placeholder-gray-500"
                          {...loginForm.register("username")}
                        />
                      </div>
                      {loginForm.formState.errors.username && (
                        <p className="text-red-400 text-sm">{loginForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10 horror-bg border-gray-700 text-white placeholder-gray-500"
                          {...loginForm.register("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-red-400 text-sm">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    {/* reCAPTCHA */}
                    {config.recaptchaSiteKey && (
                      <div className="space-y-2 flex flex-col items-center">
                        <ReCAPTCHA
                          ref={loginRecaptchaRef}
                          sitekey={config.recaptchaSiteKey}
                          onChange={(token) => {
                            loginForm.setValue("recaptchaToken", token || "");
                            loginForm.clearErrors("recaptchaToken");
                          }}
                          onExpired={() => {
                            loginForm.setValue("recaptchaToken", "");
                          }}
                          onError={() => {
                            console.error("reCAPTCHA error occurred");
                            loginForm.setValue("recaptchaToken", "");
                          }}
                          theme="dark"
                        />
                        {loginForm.formState.errors.recaptchaToken && (
                          <p className="text-red-400 text-sm text-center">{loginForm.formState.errors.recaptchaToken.message}</p>
                        )}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-blood-red hover:bg-red-700 text-white"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4 mt-6">
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">

                    <div className="space-y-2">
                      <Label htmlFor="register-username" className="text-gray-300">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="register-username"
                          type="text"
                          placeholder="Choose a username"
                          className="pl-10 horror-bg border-gray-700 text-white placeholder-gray-500"
                          {...registerForm.register("username")}
                        />
                      </div>
                      {registerForm.formState.errors.username && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          className="pl-10 horror-bg border-gray-700 text-white placeholder-gray-500"
                          {...registerForm.register("email")}
                        />
                      </div>
                      {registerForm.formState.errors.email && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-gray-300">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          className="pl-10 pr-10 horror-bg border-gray-700 text-white placeholder-gray-500"
                          {...registerForm.register("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    {/* reCAPTCHA */}
                    {config.recaptchaSiteKey && (
                      <div className="space-y-2 flex flex-col items-center">
                        <ReCAPTCHA
                          ref={registerRecaptchaRef}
                          sitekey={config.recaptchaSiteKey}
                          onChange={(token) => {
                            registerForm.setValue("recaptchaToken", token || "");
                            registerForm.clearErrors("recaptchaToken");
                          }}
                          onExpired={() => {
                            registerForm.setValue("recaptchaToken", "");
                          }}
                          onError={() => {
                            console.error("reCAPTCHA error occurred");
                            registerForm.setValue("recaptchaToken", "");
                          }}
                          theme="dark"
                        />
                        {registerForm.formState.errors.recaptchaToken && (
                          <p className="text-red-400 text-sm text-center">{registerForm.formState.errors.recaptchaToken.message}</p>
                        )}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-blood-red hover:bg-red-700 text-white"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="dark-gray-bg border-t border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <h3 className="text-xl font-bold blood-red flex items-center">
                  <Skull className="mr-2 h-5 w-5" />
                  Scream Stream
                </h3>
              </div>
              <p className="text-gray-400 text-sm">
                Your ultimate destination for discovering and rating the best horror movies currently streaming across all platforms.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Browse</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Top Rated</Link></li>
                <li><Link href="/new-to-streaming" className="text-gray-400 hover:text-white transition-colors text-sm">New to Streaming</Link></li>
                <li><Link href="/subgenres" className="text-gray-400 hover:text-white transition-colors text-sm">Subgenres</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 Scream Stream. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}