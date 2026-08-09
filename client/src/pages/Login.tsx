import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setAuth, guestLogin } = useAuthStore();

  const handleGuestLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await guestLogin();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login as guest');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      setAuth(response.data.user, response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back!</h2>
          <p className="text-gray-400">We're so excited to see you again!</p>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-transparent focus:border-brand rounded p-3 text-white outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-transparent focus:border-brand rounded p-3 text-white outline-none transition-colors"
              required
            />
            <div className="mt-1">
              <a href="#" className="text-brand hover:underline text-sm font-medium">Forgot your password?</a>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand hover:bg-brand/90 text-white font-bold py-3 rounded transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded transition-colors disabled:opacity-50"
            >
              Login as Guest
            </button>
          </div>
        </form>

        <div className="mt-6 text-sm text-gray-400">
          Need an account?{' '}
          <Link to="/register" className="text-brand hover:underline font-medium">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
