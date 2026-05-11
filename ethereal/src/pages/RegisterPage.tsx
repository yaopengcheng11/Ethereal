import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('注册成功！正在跳转登录页面...');
        navigate('/login');
      } else {
        alert(data.error || '注册失败');
      }
    } catch (error) {
      alert('无法连接到服务器，请检查 8080 后端是否运行');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!code) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] text-zinc-500 font-mono text-[10px] tracking-[0.2em] uppercase">
        Access Denied: Missing Invitation Code
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 pt-24 pb-12">
      <div className="w-full max-w-md text-center mb-8">
        <h2 className="text-3xl font-display font-bold text-white tracking-[0.2em] uppercase">
          Join E Studio
        </h2>
        <p className="mt-2 font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase">
          Invitation-based Registration
        </p>
      </div>

      <div className="w-full max-w-md bg-[#111111] border border-zinc-600 p-8 shadow-2xl relative z-10">
        <form onSubmit={handleRegister} className="space-y-6">
          {/* 邀请码（只读展示） */}
          <div>
            <label className="block font-mono text-[10px] text-zinc-300 tracking-[0.2em] uppercase mb-2">
              Invitation Code
            </label>
            <input
              type="text"
              value={code}
              readOnly
              className="block w-full px-4 py-3 border border-zinc-800 bg-black/50 text-zinc-500 font-mono text-sm cursor-not-allowed"
            />
          </div>

          {/* 邮箱 */}
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
              placeholder="you@example.com"
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="block font-mono text-[10px] text-zinc-300 tracking-[0.2em] uppercase mb-2">
              Set Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-zinc-700 bg-black text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              placeholder="Minimum 6 characters"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 border border-transparent text-white font-mono text-xs tracking-[0.2em] uppercase transition-all mt-4 ${
              isSubmitting ? 'bg-zinc-800 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
