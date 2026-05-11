import React, { useState, useEffect, useRef } from 'react';
import { File, X, AlertTriangle, Check, Plus } from 'lucide-react';

// ==========================================
// UploadedFileItem
// ==========================================
export function UploadedFileItem({ file, onRemove, onSetAsCover, onSetAsVideo, isCover, isVideo }: {
  file: { name: string; path: string; size: number };
  onRemove: () => void;
  onSetAsCover: () => void;
  onSetAsVideo: () => void;
  isCover: boolean;
  isVideo: boolean;
}) {
  const isVideoFile = /\.(mp4|mov|webm)$/i.test(file.name);
  const isCoverFile = /\.(png|jpg|jpeg|webp)$/i.test(file.name);
  const sizeStr = file.size > 1024 * 1024
    ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
    : `${(file.size / 1024).toFixed(0)} KB`;

  return (
    <div className="group relative bg-[#0a0a0a] border border-white/10 rounded-lg overflow-hidden hover:border-white/30 transition-all">
      <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
        {isVideoFile ? (
          <video src={file.path} className="w-full h-full object-cover" muted />
        ) : isCoverFile ? (
          <img src={file.path} className="w-full h-full object-cover" />
        ) : (
          <File size={24} className="text-zinc-600" />
        )}
      </div>
      <div className="px-2 py-1.5">
        <p className="font-mono text-[9px] text-zinc-400 truncate">{file.name.slice(0, 30)}</p>
        <p className="font-mono text-[8px] text-zinc-700">{sizeStr}</p>
      </div>
      <div className="px-2 pb-2 flex flex-wrap gap-1">
        {isCover && <span className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded font-mono text-[7px] text-blue-400 uppercase">Cover</span>}
        {isVideo && <span className="px-1.5 py-0.5 bg-green-500/20 border border-green-500/40 rounded font-mono text-[7px] text-green-400 uppercase">Main</span>}
      </div>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
        {isCoverFile && (
          <button onClick={onSetAsCover} className={`w-full py-1 rounded font-mono text-[8px] uppercase tracking-[0.1em] transition-colors ${isCover ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
            {isCover ? '✓ Cover — Click to Cancel' : 'Set as Cover'}
          </button>
        )}
        {isVideoFile && (
          <button onClick={onSetAsVideo} className={`w-full py-1 rounded font-mono text-[8px] uppercase tracking-[0.1em] transition-colors ${isVideo ? 'bg-green-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
            {isVideo ? '✓ Main — Click to Cancel' : 'Set as Main Video'}
          </button>
        )}
        <button onClick={onRemove} className="w-full py-1 rounded font-mono text-[8px] uppercase tracking-[0.1em] bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors">
          Remove
        </button>
      </div>
    </div>
  );
}

// ==========================================
// TagInput with autocomplete + modal suggestion
// ==========================================
export function TagInput({ tags, onChange, placeholder, suggestions }: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [modalData, setModalData] = useState<{ input: string; similars: { tag: string; score: number }[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = (suggestions || [])
    .filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s))
    .slice(0, 8);

  const jaccardSimilarity = (a: string, b: string) => {
    const setA = new Set(a.toLowerCase());
    const setB = new Set(b.toLowerCase());
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  };

  const noMatch = input.length > 0 && filtered.length === 0;
  const similarTags = noMatch
    ? (suggestions || [])
        .filter(s => !tags.includes(s))
        .map(s => ({ tag: s, score: jaccardSimilarity(input, s) }))
        .filter(s => s.score > 0.15)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
    : [];

  const suggestionItems = filtered.length > 0 ? filtered : similarTags.map(s => s.tag);

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
    setShowSuggestions(false);
    setSelectedIdx(-1);
    setModalData(null);
  };

  const handleEnter = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) { setInput(''); return; }
    if (filtered.length > 0) { addTag(filtered[0]); return; }
    if (similarTags.length > 0) { setModalData({ input: trimmed, similars: similarTags }); return; }
    addTag(trimmed);
  };

  useEffect(() => {
    if (input && (filtered.length > 0 || similarTags.length > 0)) {
      setShowSuggestions(true);
      setSelectedIdx(-1);
    } else {
      setShowSuggestions(false);
    }
  }, [input, filtered.length, similarTags.length]);

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border border-white/10 bg-black/50 rounded min-h-[42px]">
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-white/10 border border-white/20 rounded font-mono text-[9px] text-zinc-300 uppercase tracking-[0.1em]">
            {tag}
            <button onClick={() => onChange(tags.filter((_, j) => j !== i))} className="hover:text-red-400 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => { if (input && filtered.length > 0) setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={e => {
            if (showSuggestions && suggestionItems.length > 0) {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, suggestionItems.length - 1)); return; }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return; }
              if (e.key === 'Enter' && selectedIdx >= 0) { e.preventDefault(); addTag(suggestionItems[selectedIdx]); return; }
            }
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleEnter(); }
            if (e.key === 'Backspace' && !input && tags.length > 0) { onChange(tags.slice(0, -1)); }
          }}
          placeholder={placeholder || 'Type and press Enter'}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none font-mono text-[10px] text-white placeholder-zinc-600"
        />
      </div>

      {/* Autocomplete dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111] border border-white/20 rounded shadow-2xl overflow-hidden">
          {filtered.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              className={`w-full text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${i === selectedIdx ? 'bg-white/20 text-white' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Modal: similar tag suggestions */}
      {modalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={14} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white tracking-[0.1em]">标签「{modalData.input}」不存在</h3>
                <p className="font-mono text-[9px] text-zinc-500 mt-0.5">是否想使用以下相似标签？</p>
              </div>
            </div>

            {/* Similar tag list */}
            <div className="px-6 py-3 space-y-1.5">
              {modalData.similars.map((s, i) => (
                <button
                  key={s.tag}
                  type="button"
                  onClick={() => addTag(s.tag)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-mono text-[9px] text-zinc-400">{i + 1}</span>
                    <span className="font-mono text-[11px] text-white uppercase tracking-[0.1em]">{s.tag}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[8px] text-zinc-600">{Math.round(s.score * 100)}%</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check size={12} className="text-green-400" />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => addTag(modalData.input)}
                className="flex items-center gap-2 px-4 py-2 rounded font-mono text-[9px] text-zinc-400 hover:text-white hover:bg-white/10 transition-all tracking-[0.1em] uppercase"
              >
                <Plus size={12} />
                仍然添加「{modalData.input}」
              </button>
              <button
                type="button"
                onClick={() => setModalData(null)}
                className="px-4 py-2 rounded font-mono text-[9px] text-zinc-600 hover:text-white hover:bg-white/10 transition-all tracking-[0.1em] uppercase"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
