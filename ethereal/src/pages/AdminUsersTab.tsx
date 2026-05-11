import React, { useState, useEffect, useCallback } from 'react';

interface User {
  id: number; email: string; permissions: string[];
  createdAt: string; lastLogin: string | null;
  invitedBy: number | null; invitedByEmail: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员', admin: '管理员', guest: '访客',
};
const INVITE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  super_admin: [
    { value: 'super_admin', label: '超级管理员（最高权限）' },
    { value: 'admin', label: '管理员（可邀请、可删访客）' },
    { value: 'guest', label: '访客（仅浏览）' },
  ],
  admin: [
    { value: 'admin', label: '管理员（可邀请、可删访客）' },
    { value: 'guest', label: '访客（仅浏览）' },
  ],
  guest: [],
};

function canDeleteRole(current: string[], target: string[]): boolean {
  const role = current[0];
  if (role === 'super_admin') return true;
  if (role === 'admin' && target[0] === 'guest') return true;
  return false;
}

export function UsersTab({ currentUser }: { currentUser: { id: number; email: string; permissions: string[] } | null }) {
  const [targetLevel, setTargetLevel] = useState('admin');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const role = currentUser?.permissions[0] || '';
  const inviteOptions = INVITE_OPTIONS[role] || [];
  const token = typeof window !== 'undefined' ? localStorage.getItem('ethereal_token') : null;

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error('获取用户列表失败', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    if (inviteOptions.length > 0) setTargetLevel(inviteOptions[0].value);
  }, [role]);

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentUser) { alert('请先登录'); return; }
    setIsLoading(true);
    setGeneratedLink('');
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLevel, token }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedLink(`${window.location.origin}/register?code=${data.inviteCode}`);
      } else {
        alert(data.error || '生成失败');
      }
    } catch { alert('生成失败，请检查后端'); }
    finally { setIsLoading(false); }
  };

  const handleDeleteUser = async (target: User) => {
    if (!token || !currentUser) return;
    if (!confirm(`确定要删除用户「${target.email}」吗？`)) return;
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: target.id, token }),
      });
      const data = await res.json();
      if (data.success) setUsers(prev => prev.filter(u => u.id !== target.id));
      else alert(data.error || '删除失败');
    } catch { alert('删除失败'); }
  };

  const permissionLabel = (perms: string[]) => perms.map(p => ROLE_LABELS[p] || p).join(', ');
  const formatDateTime = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-10">
      {/* 生成邀请 */}
      <div className="bg-[#0a0a0a] border border-white/20 p-8 shadow-2xl">
        <h2 className="text-lg font-display font-bold text-white tracking-[0.2em] uppercase mb-6">Generate Invite</h2>
        {inviteOptions.length > 0 ? (
          <form onSubmit={handleGenerateInvite} className="space-y-6">
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 tracking-[0.2em] uppercase mb-2">Permission Level</label>
              <select value={targetLevel} onChange={e => setTargetLevel(e.target.value)}
                className="block w-full px-4 py-3 border border-white/20 bg-black/50 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors appearance-none">
                {inviteOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={isLoading}
              className={`w-full py-4 border border-transparent text-white font-mono text-xs tracking-[0.2em] uppercase transition-all ${isLoading ? 'bg-white/20 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'}`}>
              {isLoading ? 'Generating...' : 'Generate Invite Link'}
            </button>
          </form>
        ) : (
          <p className="font-mono text-[10px] text-zinc-500 text-center py-6">You do not have permission to invite new users.</p>
        )}
        {generatedLink && (
          <div className="mt-6 p-4 border border-green-500/30 bg-green-500/10">
            <p className="text-[10px] font-mono text-green-400 tracking-[0.1em] uppercase mb-2">Link Generated</p>
            <div className="flex gap-2">
              <input type="text" readOnly value={generatedLink} className="flex-1 px-3 py-2 border border-white/10 bg-black text-zinc-300 font-mono text-xs" />
              <button onClick={() => { navigator.clipboard.writeText(generatedLink); alert('已复制！'); }}
                className="px-4 py-2 bg-green-600 text-white font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-green-500">Copy</button>
            </div>
          </div>
        )}
      </div>

      {/* 用户列表 */}
      <div className="bg-[#0a0a0a] border border-white/20 p-8 shadow-2xl">
        <h2 className="text-lg font-display font-bold text-white tracking-[0.2em] uppercase mb-2">Registered Users</h2>
        <p className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase mb-8">{users.length} user{users.length !== 1 ? 's' : ''} total</p>
        {usersLoading ? (
          <div className="text-center font-mono text-[10px] text-zinc-600 py-8">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center font-mono text-[10px] text-zinc-600 py-8">No registered users yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-3 font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase pr-4">Email</th>
                  <th className="pb-3 font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase pr-4">Role</th>
                  <th className="pb-3 font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase pr-4">Invited By</th>
                  <th className="pb-3 font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase pr-4">Registered</th>
                  <th className="pb-3 font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase pr-4">Last Login</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isSelf = currentUser && u.id === currentUser.id;
                  const showDelete = currentUser && !isSelf && canDeleteRole(currentUser.permissions, u.permissions);
                  return (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4">
                        <span className="font-mono text-sm text-zinc-200">{u.email}</span>
                        {isSelf && <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-mono text-[9px]">You</span>}
                      </td>
                      <td className="py-3 pr-4"><span className="font-mono text-xs text-zinc-400">{permissionLabel(u.permissions)}</span></td>
                      <td className="py-3 pr-4"><span className="font-mono text-xs text-zinc-500">{u.invitedByEmail || '—'}</span></td>
                      <td className="py-3 pr-4"><span className="font-mono text-xs text-zinc-500">{formatDateTime(u.createdAt)}</span></td>
                      <td className="py-3 pr-4"><span className={`font-mono text-xs ${u.lastLogin ? 'text-zinc-400' : 'text-zinc-700'}`}>{formatDateTime(u.lastLogin)}</span></td>
                      <td className="py-3 text-right">
                        {showDelete && (
                          <button onClick={() => handleDeleteUser(u)}
                            className="px-3 py-1 border border-red-500/40 text-red-400 font-mono text-[9px] tracking-[0.1em] uppercase hover:bg-red-500/10 transition-colors">Delete</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default UsersTab;
