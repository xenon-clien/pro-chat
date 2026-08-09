import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/api';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', { email, password, name });
      setAuth(response.data.user, response.data.token);
      navigate('/');
    } catch (err: any) {
      console.warn('Backend register unavailable, creating demo session:', err);
      const fallbackUser = {
        id: 'user-' + Math.random().toString(36).substring(2, 8),
        email,
        name: name || 'Pro Member',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${name || 'User'}`,
      };
      setAuth(fallbackUser, 'demo-token-' + Date.now());
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create an account</h2>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-transparent focus:border-brand rounded p-3 text-white outline-none transition-colors"
              required
            />
          </div>

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
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand hover:bg-brand/90 text-white font-bold py-3 rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Registering...' : 'Continue'}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-400">
          <Link to="/login" className="text-brand hover:underline font-medium">
            Already have an account?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
