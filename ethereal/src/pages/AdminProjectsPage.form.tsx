import React, { useState, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../data/projects';
import { TagInput, UploadedFileItem } from './AdminProjectsPage.components';

// ==========================================
// Constants
// ==========================================
const CATEGORIES = ['Cinematic VFX', 'Commercial', 'R&D'];
const TYPES = ['Short Film', 'Commercial', 'BTS'];

// ==========================================
// TempFile Interface
// ==========================================
interface TempFile {
  id: string;
  name: string;
  path: string;
  size: number;
  isCover: boolean;
  isMainVideo: boolean;
}

let _idCounter = 0;
function generateId(): string {
  _idCounter += 1;
  return `tmp_${Date.now()}_${_idCounter}`;
}

// ==========================================
// Helper: determine file type from name
// ==========================================
const isImageByName = (name: string) => /\\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(name);
const isVideoByName = (name: string) => /\\.(mp4|mov|webm|avi|mkv)$/i.test(name);

// ==========================================
// Helper: build TempFile array from Project
// ==========================================
function buildTempFilesFromProject(project: Project): TempFile[] {
  const files: TempFile[] = [];
  const seen = new Set<string>();

  const addIfNew = (path: string, extra: Partial<TempFile>) => {
    if (!path || seen.has(path)) return;
    seen.add(path);
    const name = path.split('/').pop() || path;
    files.push({
      id: generateId(),
      name,
      path,
      size: 0, // server-side files have unknown size here
      isCover: false,
      isMainVideo: false,
      ...extra,
    });
  };

  if (project.cover) addIfNew(project.cover, { isCover: true });
  if (project.video) addIfNew(project.video, { isMainVideo: true });
  (project.gallery || []).forEach((p) => addIfNew(p, {}));

  return files;
}

// ==========================================
// Main Component
// ==========================================
export default function ProjectFormTab({
  editProject,
  onSaved,
}: {
  editProject: Project | null;
  onSaved: () => void;
}) {
  const { token } = useAuth();

  // ---- form fields ----
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [type, setType] = useState(TYPES[0]);
  const [tasks, setTasks] = useState<string[]>([]);
  const [tasksEn, setTasksEn] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');

  // ---- file management ----
  const [files, setFiles] = useState<TempFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- existing tags for autocomplete ----
  const [allTags, setAllTags] = useState<string[]>([]);
  useEffect(() => {
    fetch('/api/admin/tags')
      .then(r => r.json())
      .then(d => { if (d.success) setAllTags(d.tags.map((t: any) => t.tag)); })
      .catch(() => {});
  }, []);

  // ---- is editing? ----
  const isEditing = editProject !== null;

  // ---- pre-fill when editing ----
  useEffect(() => {
    if (editProject) {
      setId(editProject.id);
      setTitle(editProject.title);
      setTitleEn(editProject.title_en);
      setDate(editProject.date);
      setCategory(editProject.category);
      setType(editProject.type);
      setTasks(editProject.tasks || []);
      setTasksEn(editProject.tasks_en || []);
      setDescription(editProject.description);
      setDescriptionEn(editProject.description_en);
      setFiles(buildTempFilesFromProject(editProject));
    } else {
      setId('');
      setTitle('');
      setTitleEn('');
      setDate('');
      setCategory(CATEGORIES[0]);
      setType(TYPES[0]);
      setTasks([]);
      setTasksEn([]);
      setDescription('');
      setDescriptionEn('');
      setFiles([]);
    }
  }, [editProject]);

  // ==========================================
  // File Upload (drag-and-drop + click)
  // ==========================================
  const uploadFiles = async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    if (arr.length === 0) return;
    setUploading(true);

    try {
      const uploadPromises = arr.map(async (file) => {
        const formData = new FormData();
        formData.append('token', token || '');
        formData.append('projectId', id);
        formData.append('files', file);
        const resp = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        if (!resp.ok) {
          const errText = await resp.text().catch(() => 'Unknown error');
          console.error(`Upload failed for ${file.name}:`, errText);
          return null;
        }
        const data = await resp.json();
        // data contains { files: [{ originalname, size, path }] }
        const uploadedFile = data.files?.[0];
        if (!uploadedFile || !uploadedFile.path) {
          console.error(`Upload response missing path for ${file.name}:`, data);
          return null;
        }
        return {
          id: generateId(),
          name: uploadedFile.originalname || file.name,
          path: uploadedFile.path,
          size: uploadedFile.size || file.size,
          isCover: false,
          isMainVideo: false,
        } as TempFile;
      });

      const results = await Promise.all(uploadPromises);
      const valid = results.filter((r): r is TempFile => r !== null);

      // Auto-set cover/mainVideo on first upload
      setFiles((prev) => {
        const hasCover = prev.some((f) => f.isCover);
        const hasMainVideo = prev.some((f) => f.isMainVideo);

        const updated = valid.map((f) => {
          // If no cover yet and this is an image, auto-set as cover
          if (!hasCover && isImageByName(f.name)) {
            return { ...f, isCover: true };
          }
          // If no main video yet and this is a video, auto-set as main video
          if (!hasMainVideo && isVideoByName(f.name)) {
            return { ...f, isMainVideo: true };
          }
          return f;
        });

        return [...prev, ...updated];
      });
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      // reset so same file can be re-selected
      e.target.value = '';
    }
  };

  // ==========================================
  // File Actions
  // ==========================================
  const updateFile = (id: string, upd: Partial<TempFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...upd } : f)));
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const setAsCover = (id: string) => {
    setFiles((prev) => {
      const target = prev.find(f => f.id === id);
      // 如果已经是 Cover，点击取消
      if (target?.isCover) {
        return prev.map((f) => ({ ...f, isCover: false }));
      }
      return prev.map((f) => ({
        ...f,
        isCover: f.id === id,
      }));
    });
  };

  const setAsMainVideo = (id: string) => {
    setFiles((prev) => {
      const target = prev.find(f => f.id === id);
      // 如果已经是 Main Video，点击取消
      if (target?.isMainVideo) {
        return prev.map((f) => ({ ...f, isMainVideo: false }));
      }
      return prev.map((f) => ({
        ...f,
        isMainVideo: f.id === id,
      }));
    });
  };

  // ==========================================
  // Save
  // ==========================================
  const handleSave = async () => {
    if (!token) {
      alert('You must be logged in to save.');
      return;
    }
    if (!id.trim()) {
      alert('Project ID is required.');
      return;
    }
    if (!title.trim()) {
      alert('Chinese title is required.');
      return;
    }

    setSaving(true);

    // Build project payload from form state
    const coverFile = files.find((f) => f.isCover);
    const mainVideoFile = files.find((f) => f.isMainVideo);
    const finalGallery = files
      .filter((f) => !f.isMainVideo)
      .map((f) => f.path);

    // 确保 main video 和 cover 对应的文件在 gallery 中（避免被后端清理）
    if (mainVideoFile && !finalGallery.includes(mainVideoFile.path)) {
      finalGallery.push(mainVideoFile.path);
    }

    // 校验 main video 和 cover 对应的文件在 files 中存在（即已上传到服务器）
    if (mainVideoFile && !files.some(f => f.path === mainVideoFile.path && f.id === mainVideoFile.id)) {
      alert(`Main video 文件「${mainVideoFile.name}」不存在于已上传的文件列表中，请先上传该文件。`);
      setSaving(false);
      return;
    }
    if (coverFile && !files.some(f => f.path === coverFile.path && f.id === coverFile.id)) {
      alert(`Cover 文件「${coverFile.name}」不存在于已上传的文件列表中，请先上传该文件。`);
      setSaving(false);
      return;
    }

    const cover = coverFile ? coverFile.path : '';
    const video = mainVideoFile ? mainVideoFile.path : '';
    const gallery = finalGallery;

    const projectData: Partial<Project> = {
      id: id.trim(),
      title: title.trim(),
      title_en: titleEn.trim(),
      category,
      category_en: category,
      date: date.trim(),
      type,
      tasks,
      tasks_en: tasksEn,
      description: description.trim(),
      description_en: descriptionEn.trim(),
      cover,
      video,
      gallery,
    };

    // 编辑模式下，对比旧 gallery，确认要删除的文件
    if (isEditing && editProject) {
      const oldGallery = editProject.gallery || [];
      const newPaths = new Set(gallery);
      const toDelete = oldGallery.filter(p => !newPaths.has(p));
      if (toDelete.length > 0) {
        const fileNames = toDelete.map(p => p.split('/').pop() || p).join('\n  • ');
        const confirmed = confirm(
          `将从项目目录中删除以下文件（不在 gallery 中）：\n\n  • ${fileNames}\n\n确定继续吗？`
        );
        if (!confirmed) {
          setSaving(false);
          return;
        }
      }
    }

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing
        ? `/api/admin/projects/${encodeURIComponent(editProject!.id)}`
        : '/api/admin/projects';
      const resp = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, project: projectData }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => 'Unknown error');
        alert(`Save failed: ${errText}`);
        return;
      }

      onSaved();
    } catch (err) {
      console.error('Save error:', err);
      alert('Save failed due to network error.');
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-display font-bold text-white tracking-[0.15em] uppercase">
            {isEditing ? `Edit: ${editProject!.id}` : 'New Project'}
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSaved}
            className="px-4 py-2 border border-white/20 text-zinc-400 font-mono text-[10px] uppercase tracking-[0.2em] rounded hover:text-white hover:border-white/40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-white text-black font-mono text-[10px] uppercase tracking-[0.2em] rounded hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ======================== */}
        {/* LEFT COLUMN: Form Fields */}
        {/* ======================== */}
        <div className="space-y-6">
          {/* ID */}
          <div>
            <label className="block font-mono text-[9px] text-zinc-400 uppercase tracking-[0.15em] mb-1.5">
              Project ID
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. my-project"
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Title (CN) */}
          <div>
            <label className="block font-mono text-[9px] text-zinc-400 uppercase tracking-[0.15em] mb-1.5">
              Title <span className="text-zinc-600">(Chinese)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="项目标题"
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Title (EN) */}
          <div>
            <label className="block font-mono text-[9px] text-zinc-400 uppercase tracking-[0.15em] mb-1.5">
              Title <span className="text-zinc-600">(English)</span>
            </label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Project Title"
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block font-mono text-[9px] text-zinc-400 uppercase tracking-[0.15em] mb-1.5">
              Date
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="e.g. 2026.04"
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-mono text-[9px] text-zinc-400 uppercase tracking-[0.15em] mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-black text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block font-mono text-[9px] text-zinc-400 uppercase tracking-[0.15em] mb-1.5">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
            >
              {TYPES.map((t) => (
                <option key={t} value={t} className="bg-black text-white">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Tasks (CN) */}
          <div>
            <label className="block font-mono text-[9px] text-zinc-400 uppercase tracking-[0.15em] mb-1.5">
              Tasks <span className="text-zinc-600">(Chinese)</span>
            </label>
            <TagInput tags={tasks} onChange={setTasks} placeholder="输入任务按回车添加" suggestions={allTags} />
          </div>

          {/* Tasks (EN) */}
          <div>
            <label className="block font-mono text-[9px] text-zinc-400 uppercase tracking-[0.15em] mb-1.5">
              Tasks <span className="text-zinc-600">(English)</span>
            </label>
            <TagInput tags={tasksEn} onChange={setTasksEn} placeholder="Type task and press Enter" suggestions={allTags} />
          </div>

          {/* Description (CN) */}
          <div>
            <label className="block font-mono text-[9px] text-zinc-400 uppercase tracking-[0.15em] mb-1.5">
              Description <span className="text-zinc-600">(Chinese)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="项目描述（中文）"
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors resize-y"
            />
          </div>

          {/* Description (EN) */}
          <div>
            <label className="block font-mono text-[9px] text-zinc-400 uppercase tracking-[0.15em] mb-1.5">
              Description <span className="text-zinc-600">(English)</span>
            </label>
            <textarea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={4}
              placeholder="Project description (English)"
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors resize-y"
            />
          </div>
        </div>

        {/* ============================= */}
        {/* RIGHT COLUMN: File Upload Area */}
        {/* ============================= */}
        <div className="space-y-6">
          {/* Drag & Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center
              border-2 border-dashed rounded-xl p-10 min-h-[200px]
              cursor-pointer transition-all duration-200
              ${
                dragOver
                  ? 'border-white bg-white/5'
                  : 'border-white/20 bg-black/30 hover:border-white/40 hover:bg-black/50'
              }
            `}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-[0.15em]">
                  Uploading...
                </span>
              </div>
            ) : (
              <>
                <Upload size={32} className="text-zinc-500 mb-3" />
                <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-[0.15em] text-center leading-relaxed">
                  Drag &amp; drop files here
                  <br />
                  <span className="text-zinc-600">or click to browse</span>
                </p>
                <p className="font-mono text-[8px] text-zinc-700 mt-2">
                  PNG, JPG, WebP, MP4, MOV, WebM
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Files Preview Grid */}
          {files.length > 0 && (
            <div>
              <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-[0.15em] mb-3">
                Files · <span className="text-zinc-400">{files.length}</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {files.map((file) => (
                  <div key={file.id}>
                    <UploadedFileItem
                      file={file}
                      onRemove={() => removeFile(file.id)}
                      onSetAsCover={() => setAsCover(file.id)}
                      onSetAsVideo={() => setAsMainVideo(file.id)}
                      isCover={file.isCover}
                      isVideo={file.isMainVideo}
                  />
                    </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary statistics */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {files.filter((f) => f.isCover).length > 0 && (
                <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded font-mono text-[8px] text-blue-400 uppercase tracking-[0.1em]">
                  Cover: {files.filter((f) => f.isCover).length}
                </span>
              )}
              {files.filter((f) => f.isMainVideo).length > 0 && (
                <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded font-mono text-[8px] text-green-400 uppercase tracking-[0.1em]">
                  Main Video: {files.filter((f) => f.isMainVideo).length}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
