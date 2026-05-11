import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, BookmarkCheck, ArrowLeft, Trash2 } from 'lucide-react';
import { projects } from '../data/projects';

export default function BookmarksPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string } | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('ethereal_current_user');
    if (!stored) {
      navigate('/login');
      return;
    }
    try { setCurrentUser(JSON.parse(stored)); } catch {}
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem('ethereal_token');

    fetch(`http://localhost:8080/api/bookmarks?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setBookmarkedIds(data.bookmarks);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleRemove = async (projectId: string) => {
    const token = localStorage.getItem('ethereal_token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:8080/api/bookmarks/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, token }),
      });
      const data = await res.json();
      if (data.success) {
        setBookmarkedIds(prev => prev.filter(id => id !== projectId));
      }
    } catch (err) {
      console.error('取消收藏失败', err);
    }
  };

  const bookmarkedProjects = projects.filter(p => bookmarkedIds.includes(p.id));

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-6 md:px-16 w-full">
      <div className="w-full mx-auto max-w-[1400px]">

        {/* 顶部 */}
        <div className="mb-16">
          <Link
            to="/projects"
            className="inline-flex items-center gap-3 text-text-muted hover:text-white transition-colors pb-1 border-b border-transparent hover:border-white font-mono text-[10px] uppercase tracking-[0.2em] mb-6"
          >
            <ArrowLeft size={14} />
            Back to Projects
          </Link>

          <h1 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-[0.2em] text-white flex items-center gap-4">
            <BookmarkCheck size={24} className="text-yellow-400" />
            Bookmarks
          </h1>
          <p className="mt-2 font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase">
            {currentUser?.email} &middot; {bookmarkedIds.length} saved project{bookmarkedIds.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* 内容 */}
        {loading ? (
          <div className="text-center font-mono text-[10px] text-zinc-600 tracking-[0.2em] py-32">
            Loading bookmarks...
          </div>
        ) : bookmarkedProjects.length === 0 ? (
          <div className="border border-white/10 bg-[#0a0a0a] p-16 text-center">
            <Bookmark size={32} className="mx-auto text-zinc-700 mb-4" />
            <p className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase mb-2">
              No bookmarks yet
            </p>
            <Link
              to="/projects"
              className="inline-block font-mono text-[10px] text-white tracking-[0.2em] uppercase border-b border-white/30 pb-0.5 hover:border-white transition-colors mt-4"
            >
              Explore Projects &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {bookmarkedProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative bg-[#080808] border border-white/5 rounded-[20px] p-2 md:p-3 hover:bg-[#0c0c0c] hover:border-white/10 transition-all"
                >
                  <Link to={`/project/${project.id}`} className="block">
                    <div className="relative w-full aspect-video rounded-[14px] overflow-hidden bg-black mb-3">
                      {project.video ? (
                        <video
                          src={`${project.video}#t=1`}
                          poster={project.cover}
                          muted loop playsInline preload="metadata"
                          className="absolute inset-0 w-full h-full object-cover saturate-[.6] opacity-90 transition-all duration-700 group-hover:saturate-100 group-hover:scale-105"
                        />
                      ) : (
                        <img
                          src={project.cover}
                          className="absolute inset-0 w-full h-full object-cover saturate-[.6] opacity-90 transition-all duration-700 group-hover:saturate-100 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute top-3 left-3 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded-full font-mono text-[8px] text-yellow-400 uppercase flex items-center gap-1">
                        <BookmarkCheck size={9} /> Saved
                      </div>
                    </div>
                    <div className="px-2 pb-2 flex items-center justify-between">
                      <h3 className="font-display text-sm font-light uppercase tracking-[0.2em] text-white">
                        {project.title}
                      </h3>
                    </div>
                  </Link>

                  {/* 取消收藏按钮 */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(project.id);
                    }}
                    className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full hover:bg-red-500/20 hover:border-red-500/30"
                    title="Remove bookmark"
                  >
                    <Trash2 size={12} className="text-zinc-400 hover:text-red-400 transition-colors" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
