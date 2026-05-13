import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        login(data.token, data.user);
        setIsLoading(false);
        navigate('/');
      } else {
        setError(data.error || '账号或密码错误');
        setIsLoading(false);
      }
    } catch (err) {
      setError('无法连接到服务器，请检查 8080 端口是否运行');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 bg-background">
      <div className="w-full max-w-md text-center mb-8">
        <h2 className="text-3xl font-display font-bold text-white tracking-[0.2em] uppercase">
          E STUDIO
        </h2>
        <p className="mt-2 font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase">
          Internal Workspace Access
        </p>
      </div>

      <div className="w-full max-w-md bg-[#111111] border border-zinc-600 p-8 shadow-2xl relative z-10">
        <form className="space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-3 text-center">
              <p className="text-red-500 font-mono text-[10px] tracking-[0.1em] uppercase">{error}</p>
            </div>
          )}

          <div>
            <label className="block font-mono text-[10px] text-zinc-300 tracking-[0.2em] uppercase mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-3 border border-zinc-700 bg-black text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-zinc-300 tracking-[0.2em] uppercase mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-zinc-700 bg-black text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 border border-transparent text-white font-mono text-xs tracking-[0.2em] uppercase transition-all mt-4 ${
              isLoading 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
