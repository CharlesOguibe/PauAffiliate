import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Check, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticating, signIn } = useAuth();
  const queryParams = new URLSearchParams(location.pathname.includes('register') ? location.search : '');
  const queryRole = queryParams.get('role') as UserRole | null;
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    location.pathname.includes('register') ? 'register' : 'login'
  );
  
  const [role, setRole] = useState<UserRole | null>(queryRole || null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  useEffect(() => {
    setActiveTab(location.pathname.includes('register') ? 'register' : 'login');
    
    if (location.pathname.includes('register') && queryRole) {
      setRole(queryRole);
    }

    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/dashboard');
      }
    };

    checkUser();
  }, [location, queryRole, navigate]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'login' | 'register');
    navigate(value === 'login' ? '/auth/login' : '/auth/register');
    setError(null);
    setRegistrationSuccess(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (isAuthenticating) return;
    
    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError.message || 'Failed to login. Please check your credentials.');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role) {
      setError('Please select a role (Business or Affiliate)');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userData = {
        email,
        password,
        options: {
          data: {
            name: role === 'business' ? businessName : name,
            role,
          },
        },
      };
      
      const { error } = await supabase.auth.signUp(userData);
      
      if (error) throw error;
      
      setRegistrationSuccess(true);
      setEmail('');
      setPassword('');
      setName('');
      setBusinessName('');
      
      toast({
        title: "Registration successful",
        description: "Please check your email for confirmation link.",
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: err.message || 'Failed to register. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setResendingEmail(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      if (error) throw error;
      
      toast({
        title: "Confirmation email sent",
        description: "Please check your inbox for the confirmation link",
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send confirmation email');
      toast({
        variant: "destructive",
        title: "Failed to send confirmation email",
        description: err.message || 'An error occurred. Please try again.',
      });
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <section className="flex-grow py-20 px-6 flex items-center justify-center">
        <div className="w-full max-w-md animate-fade-in">
          <GlassCard className="w-full">
            {registrationSuccess ? (
              <div className="text-center">
                <div className="mx-auto my-4 bg-green-100 rounded-full p-3 w-12 h-12 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Registration Successful!</h2>
                <p className="mb-4 text-muted-foreground">
                  Please check your email for a confirmation link. Once confirmed, you can log in to your account.
                </p>
                
                <Alert className="mb-6 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800 text-sm">Didn't receive an email?</AlertTitle>
                  <AlertDescription className="text-blue-700 text-sm">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Check your spam/junk folder</li>
                      <li>Make sure you entered the correct email address</li>
                      <li>You can request a new confirmation link below</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resendEmail">Email Address</Label>
                    <Input
                      id="resendEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    isLoading={resendingEmail}
                    loadingText="Sending..."
                    onClick={handleResendConfirmation}
                  >
                    Resend Confirmation Email
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate('/auth/login');
                      setRegistrationSuccess(false);
                    }}
                  >
                    Go to Login
                  </Button>
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Log In</TabsTrigger>
                  <TabsTrigger value="register">Sign Up</TabsTrigger>
                </TabsList>
                
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isAuthenticating}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password">Password</Label>
                        <Link 
                          to="/auth/forgot-password" 
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot Password?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isAuthenticating}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="w-full mt-6"
                      isLoading={isAuthenticating}
                      loadingText="Signing in..."
                    >
                      Log In
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  {!role && (
                    <div className="space-y-2 mb-6">
                      <Label>I am a:</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={role === 'business' ? 'primary' : 'outline'}
                          className="w-full justify-center"
                          onClick={() => setRole('business')}
                        >
                          Business
                        </Button>
                        <Button
                          type="button"
                          variant={role === 'affiliate' ? 'primary' : 'outline'}
                          className="w-full justify-center"
                          onClick={() => setRole('affiliate')}
                        >
                          Affiliate
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {role && (
                    <>
                      <div className="bg-muted/50 p-3 rounded-md text-sm mb-2">
                        Signing up as: <span className="font-medium">
                          {role === 'business' ? 'Business' : 'Affiliate'}
                        </span>
                        <button 
                          type="button" 
                          className="text-primary text-xs ml-2 hover:underline"
                          onClick={() => setRole(null)}
                        >
                          Change
                        </button>
                      </div>
                      
                      {role === 'business' ? (
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            type="text"
                            placeholder="Your Business Name"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            required
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-4">
                        By signing up, you agree to our{' '}
                        <Link to="/terms" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </p>
                      
                      <Button 
                        onClick={handleRegister}
                        type="button" 
                        variant="primary" 
                        className="w-full mt-4"
                        isLoading={isLoading}
                        loadingText="Creating account..."
                      >
                        Create Account
                      </Button>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </GlassCard>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Auth;
