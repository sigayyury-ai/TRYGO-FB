import { FC, useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserStore } from "@/store/useUserStore";
import { Loader } from "lucide-react";
import { isTestEmail } from "@/utils/isTestEmail";
import { sendToWebhook } from "@/api/sendToWebhook";
import { pushGTMEvent } from "@/lib/analitics";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

// Check if running on localhost
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '[::1]'
);

const Auth: FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'code'>('email');
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, login, loginWithGoogle, forgotPassword, changePassword, isLoading: authLoading } = useAuthStore();
  
  // Check if user is already authenticated
  const isLoggedIn = useUserStore((state) => state.isAuthenticated);
  const hasInitializedProject = useUserStore((state) => state.hasInitializedProject);
  
  // Redirect to dashboard if already logged in
  if (isLoggedIn && hasInitializedProject) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await register({ input: { email, password } }, (text) => text);

      if (!isTestEmail(email)) {
        await sendToWebhook(email);
      }

      pushGTMEvent({
        event: "signup",
        method: "email",
      });

      toast({
        title: "Account created",
        description: "You've successfully registered your account.",
      });

      // Navigate to dashboard - RequireProject will handle project creation if needed
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await login({ input: { email, password } }, (text) => text);

      toast({
        title: "Welcome back",
        description: "You've successfully logged in.",
      });

      // Navigate to dashboard - RequireProject will handle project creation if needed
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message || "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast({
        title: "Google login failed",
        description: "No credential received from Google.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);

      // Get user email from store after successful login
      const userData = useUserStore.getState().userData;
      if (userData?.email && !isTestEmail(userData.email)) {
        await sendToWebhook(userData.email);
      }

      pushGTMEvent({
        event: "login",
        method: "google",
      });

      toast({
        title: "Welcome!",
        description: "You've successfully logged in with Google.",
      });

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Google login failed",
        description: err.message || "An error occurred during Google login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "Google login failed",
      description: "Failed to authenticate with Google.",
      variant: "destructive",
    });
  };

  const handleForgotPasswordEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setIsLoading(true);
    try {
      await forgotPassword({ email: resetEmail });

      toast({
        title: "Reset code sent",
        description: "If an account exists, you'll receive a reset code by email.",
      });
      setForgotPasswordStep('code');
    } catch (err: any) {
      toast({
        title: "Reset failed",
        description: err.message || "Failed to send reset code. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetCode || !newPassword || newPassword !== confirmPassword) {
      if (newPassword !== confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please make sure your passwords match.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsLoading(true);
    try {
      await changePassword({
        input: { email: resetEmail, resetCode: Number(resetCode), newPassword },
      });

      toast({
        title: "Password reset successful",
        description: "Your password has been reset. You can now log in with your new password.",
      });

      // Reset forgot password state
      setShowForgotPassword(false);
      setForgotPasswordStep('email');
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({
        title: "Reset failed",
        description: err.message || "Failed to reset password. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">TRYGO</h1>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Beta
            </span>
          </Link>
          <p className="text-gray-600 mt-4">Welcome to your growth platform</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {showForgotPassword 
                ? (forgotPasswordStep === 'email' ? 'Reset your password' : 'Enter reset code')
                : 'Get Started'
              }
            </CardTitle>
            <CardDescription className="text-center">
              {showForgotPassword
                ? (forgotPasswordStep === 'email' 
                    ? "Enter your email and we'll send you a code to reset your password"
                    : 'Enter the code we sent to your email and create a new password'
                  )
                : 'Sign in to your account or create a new one'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              // Forgot Password Flow
              forgotPasswordStep === 'email' ? (
                <form onSubmit={handleForgotPasswordEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                    Send reset code
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordStep('email');
                        setResetEmail("");
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                      Back to login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotPasswordCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-code">Reset Code</Label>
                    <Input
                      id="reset-code"
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Enter your reset code"
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                    Reset Password
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordStep('email')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                      Back to code request
                    </button>
                  </div>
                </form>
              )
            ) : (
              // Login/Register Tabs
              <Tabs defaultValue="register" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="register" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">Sign Up</TabsTrigger>
                  <TabsTrigger value="login" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">Sign In</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  {!isLocalhost && (
                    <>
                      <div className="flex justify-center">
                        <GoogleLogin
                          onSuccess={handleGoogleLogin}
                          onError={handleGoogleError}
                          text="continue_with"
                          width="384"
                          locale="en"
                        />
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-muted-foreground">
                            Or continue with
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading || authLoading}
                    >
                      {(isLoading || authLoading) && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  {!isLocalhost && (
                    <>
                      <div className="flex justify-center">
                        <GoogleLogin
                          onSuccess={handleGoogleLogin}
                          onError={handleGoogleError}
                          text="continue_with"
                          width="384"
                          locale="en"
                        />
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-muted-foreground">
                            Or continue with
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        className="w-full"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading || authLoading}
                    >
                      {(isLoading || authLoading) && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                      Sign Up
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-blue-600 hover:text-blue-800 underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-800 underline">
              Privacy Policy
            </Link>
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default Auth;
