import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Search, Share2 } from 'lucide-react';
import { projects as localProjects } from '../data/projects';
import { useAuth } from '../context/AuthContext';

// 排版引擎保持不变
const autoLayouts = [
  "md:col-span-2 aspect-video z-10",
  "md:col-span-2 aspect-video z-10 md:mt-6",
  "md:col-span-2 aspect-video z-10 md:-mt-4",
  "md:col-span-2 aspect-video z-10",
  "md:col-span-2 aspect-video z-20 md:-ml-8 md:mt-3 shadow-lg",
  "md:col-span-2 aspect-video z-10 md:mt-6"
];

const ProjectItem = ({ project, index }: { project: any, index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbReady, setThumbReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const layoutClass = autoLayouts[index % autoLayouts.length];
  const hasCover = project.cover && project.cover.length > 0;

  // 无 cover 但有 video 时，静默 seek 到第 1 秒作为静态封面
  useEffect(() => {
    if (!hasCover && project.video && videoRef.current && !thumbReady) {
      const v = videoRef.current;
      const onSeeked = () => {
        v.pause();
        setThumbReady(true);
      };
      v.addEventListener('seeked', onSeeked, { once: true });
      v.currentTime = 1;
      return () => v.removeEventListener('seeked', onSeeked);
    }
  }, [project.video, hasCover, thumbReady]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative group flex flex-col bg-[#080808] border border-white/5 p-2 md:p-3 rounded-[20px] hover:z-50 hover:bg-[#0c0c0c] hover:border-white/10 ${layoutClass}`}
      onMouseEnter={() => {
        setIsHovered(true);
        videoRef.current?.play().catch(() => { });
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        videoRef.current?.pause();
        if (videoRef.current) videoRef.current.currentTime = 1;
      }}
    >
      <Link to={`/project/${project.id}`} className="w-full h-full flex flex-col">
        <div className="relative w-full flex-1 rounded-[14px] overflow-hidden bg-black">
          {hasCover ? (
            <img src={project.cover} referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${isHovered ? 'saturate-100 scale-105 opacity-100' : 'saturate-[.6] opacity-90'}`}
            />
          ) : project.video ? (
            <video ref={videoRef} src={`${project.video}#t=1`} muted loop={isHovered} playsInline preload="metadata"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${isHovered ? 'saturate-100 scale-105 opacity-100' : 'saturate-[.6] opacity-90'}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-[0.2em]">No Media</span>
            </div>
          )}
          {/* 🚀 新增：卡片左下角显示对应的 Task 标签（仅在 hover 时） */}
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
};

export function Projects() {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scaleMultiplier, setScaleMultiplier] = useState(0.7);
  const [projects, setProjects] = useState(localProjects);
  const [loaded, setLoaded] = useState(false);
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.permissions?.[0] === 'super_admin' || currentUser?.permissions?.[0] === 'admin';
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  const toggleFilter = (f: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
    setActiveLetter(null);
  };

  const handleShareFilter = async () => {
    const token = localStorage.getItem('ethereal_token');
    if (!token) return;
    setSharing(true);
    setShareMsg('');
    try {
      const resp = await fetch('/api/admin/share-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          filter: { activeFilters: Array.from(activeFilters), activeLetter, searchQuery },
          name: activeFilters.size > 0 ? Array.from(activeFilters).join(' + ') : (activeLetter || 'All Projects'),
        }),
      });
      const data = await resp.json();
      if (data.success) {
        const url = `${window.location.origin}${data.url}`;
        await navigator.clipboard.writeText(url);
        setShareMsg('✅ 链接已复制到剪贴板！');
        setTimeout(() => setShareMsg(''), 3000);
      } else {
        setShareMsg('❌ ' + (data.error || '创建失败'));
      }
    } catch {
      setShareMsg('❌ 创建失败');
    } finally {
      setSharing(false);
    }
  };

  // 从 API 获取项目数据（叠加本地数据）
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.projects.length > 0) {
          setProjects(data.projects);
        }
      })
      .catch(() => {/* 使用本地数据 */})
      .finally(() => setLoaded(true));
  }, []);

  // 所有唯一 Task 标签
  const allTasks = useMemo(() => {
    const tasks = new Set<string>();
    projects.forEach(p => p.tasks?.forEach((t: string) => tasks.add(t)));
    return Array.from(tasks);
  }, [projects]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // 获取项目名称的首字母（支持中文拼音首字母）
  const getFirstLetter = (title: string) => {
    const first = title.charAt(0);
    // 英文直接返回大写
    if (/[a-zA-Z]/.test(first)) return first.toUpperCase();
    // 非中文
    if (!/[\u4e00-\u9fff]/.test(first)) return '#';
    // 中文拼音首字母映射表
    const pinyinMap: Record<string, string> = {
      '三': 'S', '医': 'Y', '南': 'N', '巴': 'B', '归': 'G', '攻': 'G',
      '无': 'W', '烟': 'Y', '燃': 'R', '猎': 'L', '珠': 'Z', '紫': 'Z',
      '老': 'L', '长': 'C', '隐': 'Y',
      // 常用字补充
      '安': 'A', '北': 'B', '成': 'C', '大': 'D', '阿': 'A', '爱': 'A',
      '发': 'F', '感': 'G', '和': 'H', '就': 'J', '看': 'K', '了': 'L',
      '明': 'M', '你': 'N', '批': 'P', '前': 'Q', '人': 'R', '是': 'S',
      '他': 'T', '有': 'Y', '在': 'Z', '不': 'B', '从': 'C', '到': 'D',
      '而': 'E', '个': 'G', '会': 'H', '见': 'J', '可': 'K', '来': 'L',
      '没': 'M', '能': 'N', '品': 'P', '其': 'Q', '日': 'R', '上': 'S',
      '同': 'T', '为': 'W', '下': 'X', '一': 'Y', '中': 'Z',
    };
    return pinyinMap[first] || '#';
  };

  // 类别过滤选项（去掉 Short Film 等分类，只保留有区分度的）
  const filterOptions = useMemo(() => {
    const allTypes = [...new Set(projects.map(p => p.type))] as string[];
    // 排除过于宽泛的分类
    const exclude = ['Short Film', 'Film'];
    const meaningful = allTypes.filter(t => !exclude.includes(t));
    return ['All', ...meaningful, ...allTasks];
  }, [projects, allTasks]);

  // 过滤 + 排序
  const filtered = useMemo(() => {
    let result = projects;

    // 搜索过滤
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.title_en || '').toLowerCase().includes(q) ||
        (p.tasks || []).some((t: string) => t.toLowerCase().includes(q)) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    // 分类/标签过滤（多选，OR 逻辑）
    if (activeFilters.size > 0) {
      result = result.filter(p =>
        Array.from(activeFilters).some(f => p.type === f || p.tasks?.includes(f))
      );
    }

    // 首字母过滤
    if (activeLetter) {
      result = result.filter(p => getFirstLetter(p.title) === activeLetter);
    }

    // 按首字母排序
    return [...result].sort((a, b) => {
      const la = getFirstLetter(a.title);
      const lb = getFirstLetter(b.title);
      if (la === '#' && lb !== '#') return 1;
      if (la !== '#' && lb === '#') return -1;
      return la.localeCompare(lb);
    });
  }, [projects, activeFilters, activeLetter, searchQuery]);

  // 按首字母分组用于显示节标题和字母导航
  const groupedByLetter = useMemo(() => {
    const groups: Record<string, typeof projects> = {};
    filtered.forEach(p => {
      const letter = getFirstLetter(p.title);
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(p);
    });
    return groups;
  }, [filtered]);

  const letterGroups = Object.entries(groupedByLetter) as [string, typeof projects][];

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-24 pb-48 px-6 md:px-12 w-full">
      <div className="w-full mx-auto max-w-[1800px] relative z-20">

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">

          {/* 分类/标签过滤器 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setActiveFilters(new Set()); setActiveLetter(null); }}
              className={`px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-[0.15em] transition-all border ${
                activeFilters.size === 0
                  ? 'bg-white text-black border-white'
                  : 'border-white/20 text-zinc-500 hover:text-white hover:border-white/40'
              }`}
            >
              All
            </button>
            {filterOptions.filter(f => f !== 'All').map(f => (
              <button
                key={f}
                onClick={() => toggleFilter(f)}
                className={`px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-[0.15em] transition-all border ${
                  activeFilters.has(f)
                    ? 'bg-white text-black border-white'
                    : 'border-white/20 text-zinc-500 hover:text-white hover:border-white/40'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* 搜索 + 缩放 */}
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input type="text" placeholder="SEARCH..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white font-mono text-[10px] rounded-full py-2.5 pl-9 pr-4 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div className="hidden sm:flex items-center gap-3 bg-[#0a0a0a] border border-white/10 rounded-full px-4 py-2">
              <span className="font-mono text-[8px] text-white/50 whitespace-nowrap">{scaleMultiplier.toFixed(1)}X</span>
              <input type="range" min="0.5" max="1.5" step="0.1" value={scaleMultiplier} onChange={e => setScaleMultiplier(parseFloat(e.target.value))}
                className="w-16 h-[2px] bg-white/20 rounded-full appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={handleShareFilter}
                  disabled={sharing}
                  className="flex items-center gap-1.5 px-3 py-2.5 border border-white/20 rounded-full font-mono text-[8px] text-zinc-400 hover:text-white hover:border-white/40 transition-all disabled:opacity-40"
                  title="Share this filter"
                >
                  <Share2 size={11} />
                  {sharing ? '...' : 'Share'}
                </button>
                {shareMsg && (
                  <div className="absolute right-0 top-full mt-2 whitespace-nowrap px-3 py-1.5 bg-white/10 border border-white/20 rounded font-mono text-[9px] text-white shadow-2xl z-50">
                    {shareMsg}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* A-Z 字母过滤 */}
        <div className="flex flex-wrap items-center gap-2 mb-10 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveLetter(null)}
            className={`font-mono text-[11px] w-7 h-6 flex items-center justify-center rounded transition-all ${
              !activeLetter
                ? 'bg-white text-black font-bold'
                : 'text-white hover:bg-white/10'
            }`}
          >
            All
          </button>
          {alphabet.map(letter => {
            const hasContent = !activeLetter && Object.keys(groupedByLetter).includes(letter);
            const isActive = activeLetter === letter;
            return (
              <button
                key={letter}
                onClick={() => {
                  if (isActive) { setActiveLetter(null); return; }
                  const allLetters = new Set(projects.map(p => getFirstLetter(p.title)));
                  if (allLetters.has(letter)) {
                    setActiveLetter(letter);
                    setActiveFilters(new Set());
                  }
                }}
                className={`font-mono text-[11px] w-7 h-6 flex items-center justify-center rounded transition-all ${
                  isActive
                    ? 'bg-white text-black font-bold'
                    : Object.keys(groupedByLetter).includes(letter) || (!activeLetter && projects.some(p => getFirstLetter(p.title) === letter))
                      ? 'text-white hover:bg-white/10'
                      : 'text-zinc-700 cursor-default'
                }`}
              >
                {letter}
              </button>
            );
          })}
          <button
            onClick={() => {
              if (activeLetter === '#') { setActiveLetter(null); return; }
              const allLetters = new Set(projects.map(p => getFirstLetter(p.title)));
              if (allLetters.has('#')) {
                setActiveLetter('#');
                setActiveFilters(new Set());
              }
            }}
            className={`font-mono text-[11px] w-7 h-6 flex items-center justify-center rounded transition-all ${
              activeLetter === '#'
                ? 'bg-white text-black font-bold'
                : projects.some(p => getFirstLetter(p.title) === '#')
                  ? 'text-white hover:bg-white/10'
                  : 'text-zinc-700 cursor-default'
            }`}
          >
            #
          </button>
        </div>

        {/* 项目卡片列表 */}
        <div className="grid gap-y-8 gap-x-4 md:gap-x-6 items-start w-full relative"
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${300 * scaleMultiplier}px), 1fr))`, gridAutoFlow: 'dense' }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((p, index) => (
              // @ts-expect-error key is special JSX prop
              <ProjectItem key={p.id} project={p} index={index} />
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-32">
            <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-[0.2em]">No projects found</p>
          </div>
        )}
      </div>
    </div>
  );
}