import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Upload, Trash2, Plus, X, Edit3, Save, Image, Film, File, Check, ArrowLeft, Search, FolderOpen, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../data/projects';
import { TagInput, UploadedFileItem } from './AdminProjectsPage.components';

// ==========================================
// Constants
// ==========================================
const CATEGORIES = ['Cinematic VFX', 'Commercial', 'R&D'];
const TYPES = ['Short Film', 'Commercial', 'BTS'];

interface TempFile {
  id: string;
  name: string;
  path: string;
  size: number;
  isImage: boolean;
  isVideo: boolean;
  isDownloadable: boolean;
  isCover: boolean;
  isMainVideo: boolean;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// ==========================================
// Project List Tab
// ==========================================
export function ProjectsListTab({ onEdit }: { onEdit: (project: Project) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { currentUser } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('ethereal_token') : null;

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) setProjects(data.projects);
    } catch (e) {
      console.error('获取项目列表失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    if (!confirm(`确定要删除项目「${id}」吗？此操作不可撤销。`)) return;
    try {
      const res = await fetch(`/api/admin/projects/${encodeURIComponent(id)}?token=${token}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => prev.filter(p => p.id !== id));
      } else {
        alert(data.error || '删除失败');
      }
    } catch { alert('删除失败'); }
  };

  const filtered = projects.filter(p =>
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-16 font-mono text-[10px] text-zinc-600">Loading projects...</div>;

  return (
    <div className="bg-[#0a0a0a] border border-white/20 p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-display font-bold text-white tracking-[0.2em] uppercase">Projects</h2>
          <p className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-black border border-white/10 text-white font-mono text-[10px] py-2.5 pl-9 pr-3 focus:outline-none focus:border-white/30 transition-colors rounded" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center font-mono text-[10px] text-zinc-600 py-16">{search ? 'No matching projects' : 'No projects yet. Create your first one!'}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(project => (
            <div key={project.id} className="flex items-center justify-between px-4 py-3 border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all rounded group">
              <div className="flex items-center gap-6 min-w-0 flex-1">
                <div className="w-12 h-12 rounded overflow-hidden bg-black shrink-0 border border-white/5">
                  {project.image ? (
                    <img src={project.image} className="w-full h-full object-cover" />
                  ) : project.video ? (
                    <video src={`${project.video}#t=1`} className="w-full h-full object-cover" muted />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><FolderOpen size={16} className="text-zinc-700" /></div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm font-light uppercase tracking-[0.2em] text-white truncate">{project.title}</p>
                  <p className="font-mono text-[9px] text-zinc-500 mt-0.5">{project.id} · {project.date} · {project.type}</p>
                </div>
                <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-zinc-600">
                  <span>{project.gallery?.length || 0} files</span>
                  <span>{project.downloadable?.length || 0} DL</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onEdit(project)}
                  className="p-2 border border-white/10 rounded opacity-0 group-hover:opacity-100 hover:border-white/40 transition-all">
                  <Edit3 size={12} className="text-zinc-400" />
                </button>
                {currentUser?.permissions?.[0] === 'super_admin' && (
                  <button onClick={() => handleDelete(project.id)}
                    className="p-2 border border-red-500/20 rounded opacity-0 group-hover:opacity-100 hover:border-red-500/40 transition-all">
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
