import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, X, Volume2, VolumeX, ArrowLeft, Bookmark, BookmarkCheck, Heart, Download } from 'lucide-react';
import { projects } from '../data/projects';
import { useAuth } from '../context/AuthContext';

const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

function DownloadBtn({ filePath, isLoggedIn, onLoginRedirect }: {
  filePath: string | null;
  isLoggedIn: boolean;
  onLoginRedirect: () => void;
}) {
  if (!filePath) return null;

  if (isLoggedIn) {
    return (
      <a
        href={`/api/download?token=${localStorage.getItem('ethereal_token')}&path=${encodeURIComponent(filePath)}`}
        download
        title="Download"
        className="absolute top-3 right-3 z-20 p-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white hover:text-black transition-all duration-300 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Download size={12} />
      </a>
    );
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onLoginRedirect(); }}
      title="Login to Download"
      className="absolute top-3 right-3 z-20 p-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full opacity-0 group-hover:opacity-100 hover:bg-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 shadow-lg"
    >
      <Download size={12} className="text-zinc-400" />
    </button>
  );
}

const GalleryItem = ({ item, layoutClass, onClick, isLoggedIn, onLoginRedirect }: {
  item: string;
  layoutClass: string;
  onClick: () => void;
  isLoggedIn: boolean;
  onLoginRedirect: () => void;
  key?: number | string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className={`group relative overflow-hidden rounded-[12px] cursor-pointer bg-[#050505] border border-white/5 shadow-2xl hover:border-white/20 transition-all z-10 hover:z-50 ${layoutClass}`}
      onClick={onClick}
      onMouseEnter={() => videoRef.current?.play().catch(() => { })}
      onMouseLeave={() => videoRef.current?.pause()}
    >
      {isVideo(item) ? (
        <video
          ref={videoRef} src={item} muted loop playsInline preload="metadata"
          className="w-full h-full object-cover saturate-75 opacity-90 transition-all duration-700 hover:saturate-100 hover:opacity-100"
        />
      ) : (
        <img
          src={item}
          className="w-full h-full object-cover saturate-75 opacity-90 transition-all duration-700 hover:scale-105 hover:saturate-100 hover:opacity-100"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-500 bg-black/30">
        <p className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-white drop-shadow-lg flex items-center gap-2">
          &rarr; VIEW
        </p>
      </div>
      <DownloadBtn filePath={item} isLoggedIn={isLoggedIn} onLoginRedirect={onLoginRedirect} />
    </motion.div>
  );
};

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const decodedId = id ? decodeURIComponent(id) : '';
  const [project, setProject] = useState(() => projects.find(p => p.id === decodedId || p.id === id) || projects[0]);
  const [loading, setLoading] = useState(true);

  // 从 API 获取项目数据
  useEffect(() => {
    if (!id) return;
    fetch(`/api/projects/${encodeURIComponent(decodedId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.project) {
          setProject(data.project);
        }
      })
      .catch(() => {/* fallback to local */})
      .finally(() => setLoading(false));
  }, [id, decodedId]);

  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  // --- 收藏功能 ---
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const { currentUser, token } = useAuth();

  // 加载时检查收藏状态
  useEffect(() => {
    if (!currentUser || !project) return;
    if (!token) return;

    fetch(`http://localhost:8080/api/bookmarks?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setIsBookmarked(data.bookmarks.includes(project.id));
        }
      })
      .catch(() => {});
  }, [currentUser, project]);

  const handleToggleBookmark = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setBookmarkLoading(true);
    try {
      const endpoint = isBookmarked ? '/api/bookmarks/remove' : '/api/bookmarks/add';
      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, token }),
      });
      const data = await res.json();
      if (data.success) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (err) {
      console.error('收藏操作失败', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  // --- 视频控制 ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (fullscreenImage) setFullscreenImage(null);
        else navigate('/projects');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage, navigate]);

  const handleTimeUpdate = () => {
    if (mainVideoRef.current) {
      const { currentTime, duration } = mainVideoRef.current;
      if (!isNaN(duration)) setProgress((currentTime / duration) * 100);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (mainVideoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      mainVideoRef.current.currentTime = percentage * mainVideoRef.current.duration;
      setProgress(percentage * 100);
    }
  };

  if (!project) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-24 pb-24 px-6 md:px-16 w-full overflow-x-hidden">
      <div className="w-full mx-auto relative z-10 max-w-[1400px]">

        <div className="flex justify-between items-end mb-6">
          <Link to="/projects" className="group flex items-center gap-3 text-text-muted hover:text-white transition-colors pb-1 border-b border-transparent hover:border-white">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">All Projects (ESC)</span>
          </Link>

          {/* 收藏按钮 */}
          <button
            onClick={handleToggleBookmark}
            disabled={bookmarkLoading}
            className={`group flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] pb-1 border-b transition-all ${
              !currentUser
                ? 'text-zinc-500 border-zinc-700 hover:text-white hover:border-white'
                : isBookmarked
                  ? 'text-yellow-400 border-yellow-400/50'
                  : 'text-zinc-500 border-zinc-700 hover:text-white hover:border-white'
            }`}
          >
            {!currentUser ? (
              <>
                <Bookmark size={12} className="group-hover:scale-110 transition-transform" />
                Login to Save
              </>
            ) : isBookmarked ? (
              <>
                <BookmarkCheck size={12} className="animate-in zoom-in" />
                Saved
              </>
            ) : (
              <>
                <Bookmark size={12} className="group-hover:scale-110 transition-transform" />
                Save to Bookmarks
              </>
            )}
          </button>
        </div>

        {/* 顶部主视觉 */}
        <div
          className="w-full flex items-center justify-center relative group cursor-pointer bg-black rounded-[16px] overflow-hidden border border-white/5"
          style={{ minHeight: '50vh' }}
          onClick={() => {
            if (mainVideoRef.current) {
              isPlaying ? mainVideoRef.current.pause() : mainVideoRef.current.play();
              setIsPlaying(!isPlaying);
            }
          }}
        >
          {project.video ? (
            <video
              ref={mainVideoRef} src={`${project.video}#t=0.1`} loop muted={isMuted} playsInline preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              className="w-full h-auto max-h-[75vh] object-contain saturate-100 opacity-100 transition-opacity duration-700"
            />
          ) : project.cover ? (
            <img src={project.cover} className="w-full h-auto max-h-[75vh] object-contain saturate-100 opacity-100" />
          ) : (
            <div className="flex items-center justify-center w-full h-full min-h-[40vh]">
              <p className="font-mono text-[10px] text-zinc-700 uppercase tracking-[0.2em]">No media available</p>
            </div>
          )}

          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700 pointer-events-none" />

          {project.video && (
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} pointer-events-none`}>
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-all duration-500">
                {isPlaying ? <Pause className="text-white w-8 h-8" /> : <Play className="text-white w-8 h-8 ml-2" />}
              </div>
            </div>
          )}

          <div className="absolute bottom-12 left-6 md:left-12 z-10 pointer-events-none">
            <h1 className="text-3xl md:text-5xl font-display font-light uppercase tracking-[0.2em] text-white drop-shadow-2xl">
              {project.title}
            </h1>
          </div>

          {/* 主封面下载按钮 */}
          {currentUser && project.video && (
            <a
              href={`/api/download?token=${token}&path=${encodeURIComponent(project.video)}`}
              download
              title="Download Main Video"
              className="absolute top-6 right-6 z-20 p-3 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white hover:text-black transition-all duration-300 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={16} />
            </a>
          )}

          {project.video && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer z-30 group/progress" onClick={handleSeek}>
              <div className="absolute bottom-0 w-full h-8 -translate-y-1 bg-transparent" />
              <div className="relative h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-75 ease-linear group-hover/progress:shadow-[0_0_15px_rgba(255,255,255,0.9)]" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity duration-200" />
              </div>
            </div>
          )}
        </div>

        {/* 详情介绍 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 border-t border-white/10 pt-16 mt-20 mb-20">
          <div className="md:col-span-8 text-lg md:text-xl text-text-main leading-relaxed font-light whitespace-pre-line">
            {project.description}
          </div>
          <div className="md:col-span-4 flex flex-col gap-8">
            <div>
              <h4 className="font-mono text-[9px] text-text-muted uppercase tracking-[0.3em] mb-2">Category</h4>
              <p className="font-display text-sm font-light uppercase tracking-[0.2em] text-white">{project.category}</p>
            </div>
            <div>
              <h4 className="font-mono text-[9px] text-text-muted uppercase tracking-[0.3em] mb-2">Type</h4>
              <p className="font-display text-sm font-light uppercase tracking-[0.2em] text-white">{project.type}</p>
            </div>
            <div>
              <h4 className="font-mono text-[9px] text-text-muted uppercase tracking-[0.3em] mb-2">Date</h4>
              <p className="font-display text-sm font-light uppercase tracking-[0.2em] text-white">{project.date}</p>
            </div>
          </div>
        </div>

        {/* 🚀 核心更新：高密度、精致的 Gallery 布局 */}
        {project.gallery && project.gallery.length > 0 && (
          <div className="border-t border-white/10 pt-16 pb-32">
            <h3 className="font-display text-xl font-light uppercase tracking-[0.2em] text-white/50 mb-16">Gallery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-6 md:gap-4 relative">
              {project.gallery.map((item, idx) => {
                const layouts = [
                  /* 1. 左侧小图 */ "md:col-span-3 md:col-start-1 aspect-video z-10",
                  /* 2. 中间主图（较大且遮挡） */ "md:col-span-4 md:col-start-4 md:-ml-12 md:-mt-8 aspect-[4/5] z-20 shadow-2xl",
                  /* 3. 右侧竖图 */ "md:col-span-2 md:col-start-9 md:mt-12 aspect-[2/3] z-10",
                  /* 4. 左下宽幅 */ "md:col-span-4 md:col-start-2 md:-mt-12 aspect-[16/9] z-10",
                  /* 5. 底部右侧咬合 */ "md:col-span-3 md:col-start-7 md:-mt-20 md:-ml-8 aspect-[3/4] z-20 shadow-2xl",
                  /* 6. 边缘点缀 */ "md:col-span-2 md:col-start-10 md:mt-4 aspect-square z-10",
                ];
                const layoutClass = layouts[idx % layouts.length];
                return (
                  <GalleryItem
                    key={idx}
                    item={item}
                    layoutClass={layoutClass}
                    onClick={() => setFullscreenImage(item)}
                    isLoggedIn={currentUser !== null}
                    onLoginRedirect={() => navigate('/login')}
                  />
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 全屏查看 */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-12 cursor-zoom-out"
            onClick={() => setFullscreenImage(null)}
          >
            <button className="absolute top-6 right-6 text-white/70 hover:text-white z-50 transition-colors" onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}>
              <X size={32} />
            </button>
            {isVideo(fullscreenImage) ? (
              <video src={fullscreenImage} controls autoPlay className="max-w-full max-h-full" onClick={e => e.stopPropagation()} />
            ) : (
              <img src={fullscreenImage} className="max-w-full max-h-full object-contain cursor-default" onClick={e => e.stopPropagation()} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
