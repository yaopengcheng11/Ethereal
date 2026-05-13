import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const autoLayouts = [
  "md:col-span-2 aspect-video z-10",
  "md:col-span-2 aspect-video z-10 md:mt-6",
  "md:col-span-2 aspect-video z-10 md:-mt-4",
  "md:col-span-2 aspect-video z-10",
  "md:col-span-2 aspect-video z-20 md:-ml-8 md:mt-3 shadow-lg",
  "md:col-span-2 aspect-video z-10 md:mt-6"
];

function ShareProjectItem({ project, index, shareToken }: { project: any, index: number, shareToken: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const layoutClass = autoLayouts[index % autoLayouts.length];
  const hasCover = project.cover && project.cover.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative group flex flex-col bg-[#080808] border border-white/5 p-2 md:p-3 rounded-[20px] hover:z-50 hover:bg-[#0c0c0c] hover:border-white/10 ${layoutClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/project/${project.id}?share=${shareToken}`} className="w-full h-full flex flex-col">
        <div className="relative w-full flex-1 rounded-[14px] overflow-hidden bg-black">
          {hasCover ? (
            <img src={project.cover}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${isHovered ? 'saturate-100 scale-105 opacity-100' : 'saturate-[.6] opacity-90'}`}
            />
          ) : project.video ? (
            <video src={`${project.video}#t=1`} muted loop={isHovered} playsInline preload="metadata"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${isHovered ? 'saturate-100 scale-105 opacity-100' : 'saturate-[.6] opacity-90'}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-[0.2em]">No Media</span>
            </div>
          )}
          <div className={`absolute bottom-4 left-4 flex gap-2 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {project.tasks?.map((t: string) => (
              <span key={t} className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full font-mono text-[8px] text-white/70 uppercase">
                {t}
              </span>
            ))}
          </div>
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
        </div>
        <div className="pt-3 pb-1 px-2 flex items-center">
          <h3 className="font-display text-sm font-light uppercase tracking-[0.2em] text-white group-hover:text-white transition-colors">
            {project.title}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}

export default function SharePage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<{ share: any; filter: any; projects: any[] } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d);
        else setError(d.error || '加载失败');
      })
      .catch(() => setError('无法加载分享内容'))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let result = data.projects;
    if (data.filter.activeLetter) {
      const firstChar = data.filter.activeLetter;
      result = result.filter((p: any) => {
        const first = p.title.charAt(0);
        if (/[a-zA-Z]/.test(first)) return first.toUpperCase() === firstChar;
        return firstChar === '#';
      });
    }
    return result;
  }, [data]);

  if (loading) return (
    <div className="min-h-screen bg-background pt-40 flex items-center justify-center">
      <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-[0.2em]">Loading...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background pt-40 flex flex-col items-center justify-center gap-6">
      <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-[0.2em]">{error}</p>
      <Link to="/" className="font-mono text-[10px] text-white/50 hover:text-white uppercase tracking-[0.2em]">← Back to Home</Link>
    </div>
  );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background pt-28 md:pt-32 pb-48 px-6 md:px-12 w-full">
      <div className="w-full mx-auto max-w-[1800px] relative z-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-xl font-bold text-white tracking-[0.15em] uppercase">
            {data.share.name || 'Shared Projects'}
          </h1>
          {filtered.length === 0 && (
            <p className="mt-8 font-mono text-[10px] text-zinc-600 uppercase tracking-[0.2em]">No projects match this filter.</p>
          )}
        </div>

        {/* Projects grid */}
        <div className="grid gap-y-8 gap-x-4 md:gap-x-6 items-start w-full relative"
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, 300px), 1fr))`, gridAutoFlow: 'dense' }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((p: any, index: number) => (
              <div key={p.id}>
                <ShareProjectItem project={p} index={index} shareToken={token!} />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
