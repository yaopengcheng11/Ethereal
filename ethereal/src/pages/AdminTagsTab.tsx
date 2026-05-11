import React, { useState, useEffect, useCallback } from 'react';
import { Merge, Trash2, AlertTriangle } from 'lucide-react';

interface TagItem {
  tag: string;
  count: number;
}

export function TagsTab() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergeFrom, setMergeFrom] = useState('');
  const [mergeTo, setMergeTo] = useState('');
  const [message, setMessage] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('ethereal_token') : null;

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tags');
      const data = await res.json();
      if (data.success) setTags(data.tags);
    } catch (e) {
      console.error('获取标签失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const handleMerge = async () => {
    if (!mergeFrom || !mergeTo || mergeFrom === mergeTo) {
      setMessage('请选择两个不同的标签');
      return;
    }
    if (!confirm(`确定要将「${mergeFrom}」合并到「${mergeTo}」吗？\n所有使用「${mergeFrom}」的项目将自动改用「${mergeTo}」。\n此操作不可撤销。`)) return;

    try {
      const res = await fetch('/api/admin/tags/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, sourceTag: mergeFrom, targetTag: mergeTo }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ 合并成功！影响了 ${data.affected} 个项目`);
        setMergeFrom('');
        setMergeTo('');
        fetchTags();
      } else {
        setMessage(`❌ ${data.error || '合并失败'}`);
      }
    } catch {
      setMessage('❌ 合并失败，请检查后端');
    }
  };

  const handleDelete = async (tag: string) => {
    if (!confirm(`确定要删除标签「${tag}」吗？\n该标签将从所有项目中移除。\n此操作不可撤销。`)) return;

    try {
      const res = await fetch('/api/admin/tags/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, tag }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ 标签「${tag}」已删除，影响了 ${data.affected} 个项目`);
        fetchTags();
      } else {
        setMessage(`❌ ${data.error || '删除失败'}`);
      }
    } catch {
      setMessage('❌ 删除失败');
    }
  };

  if (loading) return <div className="text-center py-16 font-mono text-[10px] text-zinc-600">Loading tags...</div>;

  const allTags = tags.map(t => t.tag);

  return (
    <div className="space-y-8">
      {/* 合并标签 */}
      <div className="bg-[#0a0a0a] border border-white/20 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Merge size={16} className="text-zinc-400" />
          <h2 className="text-lg font-display font-bold text-white tracking-[0.2em] uppercase">Merge Tags</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-mono text-[10px] text-zinc-400 tracking-[0.2em] uppercase mb-2">Source Tag</label>
            <select value={mergeFrom} onChange={e => setMergeFrom(e.target.value)}
              className="block w-full px-4 py-3 border border-white/20 bg-black/50 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors appearance-none">
              <option value="">— Select —</option>
              {tags.filter(t => t.tag !== mergeTo).map(t => (
                <option key={t.tag} value={t.tag}>{t.tag} ({t.count})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] text-zinc-400 tracking-[0.2em] uppercase mb-2">Target Tag</label>
            <select value={mergeTo} onChange={e => setMergeTo(e.target.value)}
              className="block w-full px-4 py-3 border border-white/20 bg-black/50 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors appearance-none">
              <option value="">— Select —</option>
              {tags.filter(t => t.tag !== mergeFrom).map(t => (
                <option key={t.tag} value={t.tag}>{t.tag} ({t.count})</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleMerge}
          disabled={!mergeFrom || !mergeTo}
          className="px-6 py-3 bg-white text-black font-mono text-[10px] uppercase tracking-[0.2em] rounded hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Execute Merge
        </button>

        {message && (
          <div className="mt-4 p-3 border border-white/10 bg-white/5 rounded">
            <p className="font-mono text-[10px] text-zinc-300">{message}</p>
          </div>
        )}
      </div>

      {/* 标签列表 */}
      <div className="bg-[#0a0a0a] border border-white/20 p-8 shadow-2xl">
        <h2 className="text-lg font-display font-bold text-white tracking-[0.2em] uppercase mb-2">All Tags</h2>
        <p className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase mb-8">
          {tags.length} tag{tags.length !== 1 ? 's' : ''} total · 在新建项目时输入标签会自动提示已有标签
        </p>

        {tags.length === 0 ? (
          <div className="text-center py-8 font-mono text-[10px] text-zinc-600">No tags yet.</div>
        ) : (
          <>
            {/* Summary bars */}
            <div className="space-y-1.5 mb-10">
              {tags.map(t => {
                const maxCount = tags[0]?.count || 1;
                const width = (t.count / maxCount) * 100;
                return (
                  <div key={t.tag} className="flex items-center gap-3 group hover:bg-white/5 px-2 py-1 rounded transition-colors">
                    <span className="font-mono text-[11px] text-zinc-200 w-24 truncate">{t.tag}</span>
                    <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden relative">
                      <div className="h-full bg-white/15 rounded transition-all" style={{ width: `${width}%` }} />
                    </div>
                    <span className="font-mono text-[9px] text-zinc-500 w-8 text-right">{t.count}</span>
                    <button
                      onClick={() => handleDelete(t.tag)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      title="Delete this tag"
                    >
                      <Trash2 size={10} className="text-red-400" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Tag cloud */}
            <div className="flex flex-wrap gap-2">
              {tags.map(t => {
                const sizes = ['text-[9px]', 'text-[10px]', 'text-[11px]', 'text-[12px]', 'text-[13px]'];
                const sizeIdx = Math.min(Math.floor((t.count / (tags[0]?.count || 1)) * sizes.length), sizes.length - 1);
                return (
                  <span
                    key={t.tag}
                    className={`${sizes[sizeIdx]} px-2 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-zinc-400 uppercase tracking-[0.1em]`}
                  >
                    {t.tag} ({t.count})
                  </span>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
