import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, Wallet, Loader2 } from 'lucide-react';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
        // Basic validation before hitting Firebase
        alert("Password must be at least 6 characters");
        return;
    }

    const success = await register(name, email, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-6 shadow-lg shadow-indigo-200">
              <Wallet className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create an account</h2>
            <p className="mt-2 text-slate-500">Start your journey to financial freedom.</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors outline-none bg-slate-50/50 text-slate-900 placeholder-slate-400"
                    placeholder="John Doe"
                  />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors outline-none bg-slate-50/50 text-slate-900 placeholder-slate-400"
                    placeholder="name@example.com"
                  />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors outline-none bg-slate-50/50 text-slate-900 placeholder-slate-400"
                    placeholder="Create a password"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1 ml-1">Must be at least 6 characters.</p>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg border border-red-100">
                {error.replace("Firebase:", "").trim()}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-[0.98] disabled:opacity-50"
            >
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="ml-2 w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      
      {/* Right Side - Same decoration as login for consistency */}
      <div className="hidden lg:block relative w-0 flex-1 bg-slate-900">
         <div className="absolute inset-0 bg-gradient-to-bl from-slate-800 to-slate-900"></div>
         <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-white z-10">
             {/* Abstract grid */}
             <div className="grid grid-cols-2 gap-4 w-96 transform -rotate-6 opacity-80">
                <div className="bg-slate-700/50 h-32 rounded-2xl backdrop-blur-sm border border-slate-600/50"></div>
                <div className="bg-indigo-600/20 h-32 rounded-2xl backdrop-blur-sm border border-indigo-500/30"></div>
                <div className="bg-slate-700/50 h-32 rounded-2xl backdrop-blur-sm border border-slate-600/50 col-span-2"></div>
             </div>
             <h2 className="text-3xl font-bold mt-12 mb-4">Join 10,000+ Users</h2>
             <p className="text-slate-400 max-w-sm text-center">SmartSpend is the fastest growing expense tracker. Join us today and start saving.</p>
         </div>
      </div>
    </div>
  );
};

export default Register;