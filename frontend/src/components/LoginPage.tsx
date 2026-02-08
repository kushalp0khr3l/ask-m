import { useState } from 'react';
import { X, Mail, CheckCircle, Loader2 } from 'lucide-react';
import logoImage from '../assets/logo.jpg';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface LoginPageProps {
  onClose?: () => void;
  onLogin: () => void;
}

export function LoginPage({ onClose, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError(true);
      return;
    }

    setLoading(true);
    console.log("DEBUG: Attempting Magic Link for:", email.trim());
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      console.log("DEBUG: Supabase Otp Response:", { data, error });

      if (error) {
        console.error('DEBUG: Supabase Otp Error:', error);
        throw error;
      }

      setIsEmailSent(true);
      toast.success('Check your email for the login link!');
    } catch (error: any) {
      console.error('Email login error:', error.message);
      toast.error('Failed to send verification email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === 'google') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        console.error('Login error:', error.message);
        toast.error('Google login failed: ' + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-4 right-0 p-2 text-[#A0A0A0] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="flex justify-center mb-8">
          <img src={logoImage} alt="Ask-M Logo" className="w-16 h-16 object-contain" />
        </div>

        <h1 className="text-white text-3xl text-center mb-4">
          {isEmailSent ? 'Check your email' : 'Log in or sign up'}
        </h1>

        <p className="text-[#A0A0A0] text-center mb-8">
          {isEmailSent
            ? `We've sent a magic link to ${email}. Click it to sign in instantly.`
            : "An AI-powered chatbot and summarizer tailored exclusively to Kathmandu University's syllabus."
          }
        </p>

        {isEmailSent ? (
          <div className="bg-[#1E1F20] border border-[#2D2E30] rounded-2xl p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#34A853]/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-[#34A853]" />
            </div>
            <p className="text-white mb-6">Didn't receive the email? Check your spam folder.</p>
            <button
              onClick={() => setIsEmailSent(false)}
              className="text-[#A0A0A0] hover:text-white transition-colors text-sm underline"
            >
              Try another email address
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full bg-[#2D2E30] hover:bg-[#3D3E40] text-white font-medium py-3.5 px-6 rounded-full transition-colors flex items-center justify-center gap-3 border border-[#3D3E40] disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-[#3D3E40]"></div>
                <span className="text-[#A0A0A0] text-sm">OR</span>
                <div className="flex-1 h-px bg-[#3D3E40]"></div>
              </div>
            </div>

            <form onSubmit={handleEmailContinue} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                  className={`w-full bg-transparent text-white placeholder-[#A0A0A0] py-3.5 px-6 rounded-full focus:outline-none transition-colors ${emailError
                    ? 'border-2 border-red-500'
                    : 'border border-[#3D3E40] focus:border-[#5D5E60]'
                    } disabled:opacity-50`}
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-2 px-6">
                    Email is required
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3.5 px-6 rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  'Continue with Email'
                )}
              </button>
            </form>
          </>
        )}

        <p className="text-[#A0A0A0] text-xs text-center mt-8">
          By continuing, you agree to Ask-M's{' '}
          <button className="text-white hover:underline">Terms of Service</button> and{' '}
          <button className="text-white hover:underline">Privacy Policy</button>
        </p>
      </div>
    </div>
  );
}