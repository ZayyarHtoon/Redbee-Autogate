import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithGoogle, 
  loginWithEmail, 
  registerWithEmail 
} from '../firebaseService';
import { User } from 'firebase/auth';
import { Mail, Lock, ShieldAlert, LogIn, UserPlus, ArrowRight, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onContinueAsGuest: () => void;
  onLoginSuccess: (user: User) => void;
}

export default function LoginView({ onContinueAsGuest, onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/popup-blocked') {
        setError('The sign-in popup was blocked. Please allow popups or try the Quick Email Login instead.');
      } else if (err?.code === 'auth/network-request-failed') {
        setError('Network error. If you are inside the preview iframe, try clicking "Open in New Tab" or use Quick Email Login.');
      } else {
        setError(err?.message || 'Failed to sign in with Google. Please try Email Login inside this preview.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let user: User;
      if (isRegisterMode) {
        user = await registerWithEmail(email, password);
      } else {
        user = await loginWithEmail(email, password);
      }
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      if (err?.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err?.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err?.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please sign in instead.');
      } else {
        setError(err?.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-center items-center p-4 font-sans antialiased selection:bg-slate-900 selection:text-white">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
      >
        {/* Banner with visual styling */}
        <div className="bg-slate-900 px-6 py-8 text-center relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-800 opacity-90" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-600/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-red-600/15 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex flex-col items-center gap-3">
            {!logoFailed ? (
              <img
                src="/Logo.jpg"
                alt="Redbee Autogate & Security"
                className="h-14 w-auto object-contain rounded-xl bg-white p-1"
                onError={() => setLogoFailed(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white font-black flex items-center justify-center shadow-md text-xl">
                R
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold tracking-tight">Redbee Autogate & Security</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider font-mono mt-1">Quotation & Invoice Hub</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs leading-relaxed"
              >
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Premium Google Sign-In */}
          <div className="space-y-3.5">
            {isIframe && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-left flex flex-col gap-2">
                <div className="flex items-start gap-2 text-red-800 text-xs font-semibold leading-normal">
                  <Sparkles size={14} className="shrink-0 mt-0.5 text-red-600 animate-pulse" />
                  <span>Gmail Login Requires a Direct Tab</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal font-medium">
                  Browsers block Google popup authorization windows when inside preview containers. Click the button below to open this app in a dedicated tab where Gmail login works seamlessly:
                </p>
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider font-mono rounded-xl transition shadow-sm inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🚀 Open App in New Tab</span>
                  <ArrowRight size={12} />
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold rounded-2xl transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-.1.37 1.85 3.32h5.09c2.97-2.74 4.69-6.77 4.69-11.23z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-5.09-3.92c-1.4.94-3.23 1.51-5.18 1.51-3.99 0-7.38-2.7-8.58-6.32H.99v4.06C2.97 20.35 7.15 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.42 12.36a7.16 7.16 0 010-4.72V3.58H.99a11.96 11.96 0 000 12.84l2.43-4.06z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.15 0 2.97 3.65.99 7.64l2.43 4.06c1.2-3.62 4.59-6.32 8.58-6.32z"
                />
              </svg>
              <span>Continue with Gmail / Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Or use Email login</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Quick Email Authorization */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Email Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-slate-900 focus:bg-white rounded-2xl text-xs font-medium text-slate-900 transition outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-slate-900 focus:bg-white rounded-2xl text-xs font-medium text-slate-900 transition outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-2xl transition cursor-pointer shadow-md shadow-slate-900/10 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRegisterMode ? (
                <>
                  <UserPlus size={14} />
                  <span>Create Account & Log In</span>
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  <span>Log In to Sync Hub</span>
                </>
              )}
            </button>
          </form>

          {/* Mode Toggle & Sandbox Warning */}
          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs text-slate-500 hover:text-slate-950 font-semibold transition underline decoration-slate-200 hover:decoration-slate-950 cursor-pointer"
            >
              {isRegisterMode 
                ? "Already have an account? Log In" 
                : "New here? Register a new account"}
            </button>

            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl text-left">
              <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                💡 <strong>Sandbox Tip:</strong> If Google sign-in fails inside the iframe, use the **Email Login** above (it will auto-register you) or click the pop-out button to run the app in a dedicated tab.
              </p>
            </div>
          </div>
        </div>

        {/* Guest Mode footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="flex items-center justify-center gap-1 mx-auto text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <span>Continue Offline in Local Mode</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
