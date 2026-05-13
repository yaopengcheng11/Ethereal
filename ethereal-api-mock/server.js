const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// ==========================================
// 数据目录 & JSON 持久化
// ==========================================
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const ASSET_DIR = path.resolve(__dirname, '..', 'Ethereal', 'public', 'asset');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ASSET_DIR)) fs.mkdirSync(ASSET_DIR, { recursive: true });

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (e) { console.error('Load DB error:', e.message); }
  return null;
}

function saveDB() {
  const toSave = {
    users: db.users,
    invitations: db.invitations,
    projects: db.projects,
    bookmarks: db.bookmarks || []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
}

// ==========================================
// 核心数据
// ==========================================
const initialDB = {
  users: [{
    id: 1,
    email: 'yao_pengcheng@outlook.com',
    password: '123456',
    permissions: ['super_admin'],
    createdAt: new Date('2026-05-01').toISOString(),
    lastLogin: null,
    invitedBy: null
  }],
  invitations: [],
  projects: [],
  bookmarks: []
};

const db = loadDB() || JSON.parse(JSON.stringify(initialDB));

// 从 projects.ts 导入已有项目（首次初始化时）
if (db.projects.length === 0) {
  try {
    const projectsTSPath = path.join(__dirname, '..', 'Ethereal', 'src', 'data', 'projects.ts');
    const tsContent = fs.readFileSync(projectsTSPath, 'utf-8');
    // 用正则提取 projects 数组
    const match = tsContent.match(/export const projects: Project\[\] = (\[[\s\S]*?\]);/);
    if (match) {
      // 去掉 trailing comma 让 JSON5 能解析——用 eval 简单处理
      const jsonStr = match[1]
        .replace(/\/\/.*$/gm, '')
        .replace(/,\s*([\]}])/g, '$1');
      // 手动替换 key
      const code = `const __projects = ${jsonStr}; __projects`;
      const projects = eval(code);
      if (Array.isArray(projects)) {
        db.projects = projects;
        // 确保 image 和 video 在 gallery 中
        db.projects.forEach(p => {
          if (!p.gallery) p.gallery = [];
          if (p.cover && !p.gallery.includes(p.cover)) {
            p.gallery.push(p.cover);
          }
          if (p.video && !p.gallery.includes(p.video)) {
            p.gallery.push(p.video);
          }
        });
        console.log(`从 projects.ts 导入了 ${projects.length} 个项目`);
      }
    }
  } catch (e) {
    console.error('导入 projects.ts 失败:', e.message);
  }
  saveDB();
}

function getCurrentUser(token) {
  return db.users.find(u => u.id === Number(token));
}

// ==========================================
// 文件上传配置
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectDir = path.join(ASSET_DIR, req.body.projectId || 'temp');
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
    cb(null, projectDir);
  },
  filename: (req, file, cb) => {
    // 保留原文件名
    cb(null, file.originalname);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB
});

// ==========================================
// 权限规则
// ==========================================
const INVITE_MAP = {
  super_admin: ['super_admin', 'admin', 'guest'],
  admin: ['admin', 'guest'],
  guest: []
};
const DELETE_MAP = {
  super_admin: ['super_admin', 'admin', 'guest'],
  admin: ['guest'],
  guest: []
};

// ==========================================
// 接口 1：登录
// ==========================================
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email && u.password === password);
  if (user) {
    user.lastLogin = new Date().toISOString();
    saveDB();
    res.json({
      success: true,
      token: String(user.id),
      user: { id: user.id, email: user.email, permissions: user.permissions }
    });
  } else {
    res.status(401).json({ error: '账号或密码错误' });
  }
});

// ==========================================
// 接口 2：生成邀请码
// ==========================================
app.post('/api/admin/invite', (req, res) => {
  const { targetLevel, token } = req.body;
  const currentUser = getCurrentUser(token);
  if (!currentUser) return res.status(401).json({ error: '未登录或登录已过期' });
  const role = currentUser.permissions[0];
  const canInvite = INVITE_MAP[role] || [];
  if (!canInvite.includes(targetLevel)) {
    return res.status(403).json({ error: `无权邀请「${targetLevel}」级别` });
  }
  const inviteCode = uuidv4();
  db.invitations.push({ invite_code: inviteCode, permissions: [targetLevel], invited_by: currentUser.id, status: 'pending' });
  saveDB();
  res.json({ success: true, inviteCode });
});

// ==========================================
// 接口 3：注册
// ==========================================
app.post('/api/auth/register', (req, res) => {
  const { code, email, password } = req.body;
  const inviteIndex = db.invitations.findIndex(i => i.invite_code === code && i.status === 'pending');
  if (inviteIndex === -1) return res.status(400).json({ error: '邀请码无效或已使用' });
  if (db.users.find(u => u.email === email)) return res.status(400).json({ error: '该邮箱已被注册' });
  const invite = db.invitations[inviteIndex];
  const newUser = {
    id: db.users.length + 1,
    email, password,
    permissions: invite.permissions,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    invitedBy: invite.invited_by || null
  };
  db.users.push(newUser);
  db.invitations[inviteIndex].status = 'used';
  saveDB();
  res.json({ success: true });
});

// ==========================================
// 接口 4：获取用户列表
// ==========================================
app.get('/api/admin/users', (req, res) => {
  const users = db.users.map(u => ({
    id: u.id, email: u.email, permissions: u.permissions,
    createdAt: u.createdAt, lastLogin: u.lastLogin, invitedBy: u.invitedBy
  }));
  const usersWithInviter = users.map(u => ({
    ...u,
    invitedByEmail: u.invitedBy ? (db.users.find(inv => inv.id === u.invitedBy)?.email || null) : null
  }));
  res.json({ success: true, users: usersWithInviter });
});

// ==========================================
// 接口 5：收藏
// ==========================================
app.post('/api/bookmarks/add', (req, res) => {
  const { projectId, token } = req.body;
  const user = getCurrentUser(token);
  if (!user) return res.status(401).json({ error: '未登录' });
  if (!db.bookmarks) db.bookmarks = [];
  if (db.bookmarks.find(b => b.userId === user.id && b.projectId === projectId)) {
    return res.json({ success: true, message: '已收藏过' });
  }
  db.bookmarks.push({ userId: user.id, projectId, createdAt: new Date().toISOString() });
  saveDB();
  res.json({ success: true });
});
app.post('/api/bookmarks/remove', (req, res) => {
  const { projectId, token } = req.body;
  const user = getCurrentUser(token);
  if (!user) return res.status(401).json({ error: '未登录' });
  db.bookmarks = (db.bookmarks || []).filter(b => !(b.userId === user.id && b.projectId === projectId));
  saveDB();
  res.json({ success: true });
});
app.get('/api/bookmarks', (req, res) => {
  const user = getCurrentUser(req.query.token);
  if (!user) return res.status(401).json({ error: '未登录' });
  const bookmarks = (db.bookmarks || []).filter(b => b.userId === user.id);
  res.json({ success: true, bookmarks: bookmarks.map(b => b.projectId) });
});

// ==========================================
// 接口 6：删除用户
// ==========================================
app.post('/api/admin/delete-user', (req, res) => {
  const { targetUserId, token } = req.body;
  const currentUser = getCurrentUser(token);
  if (!currentUser) return res.status(401).json({ error: '未登录' });
  const targetUser = db.users.find(u => u.id === targetUserId);
  if (!targetUser) return res.status(404).json({ error: '目标用户不存在' });
  if (targetUser.id === currentUser.id) return res.status(403).json({ error: '不能删除自己' });
  const role = currentUser.permissions[0];
  const canDelete = DELETE_MAP[role] || [];
  if (!canDelete.includes(targetUser.permissions[0])) {
    return res.status(403).json({ error: `无权删除「${targetUser.permissions[0]}」级别` });
  }
  db.users = db.users.filter(u => u.id !== targetUserId);
  saveDB();
  res.json({ success: true });
});

// ==========================================
// 接口 7：下载素材
// ==========================================
app.get('/api/download', (req, res) => {
  const token = req.query.token;
  const filePath = req.query.path;
  const user = getCurrentUser(token);
  if (!user) return res.status(401).json({ error: '请先登录后再下载素材' });
  if (!filePath) return res.status(400).json({ error: '缺少文件路径参数' });
  const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  if (!normalized.startsWith('/asset/') && !normalized.startsWith('asset/')) {
    return res.status(403).json({ error: '不允许的下载路径' });
  }
  const absolutePath = path.join(__dirname, '..', 'Ethereal', 'public', normalized);
  if (!fs.existsSync(absolutePath)) return res.status(404).json({ error: '文件不存在' });
  const fileName = path.basename(absolutePath);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  fs.createReadStream(absolutePath).pipe(res);
});

// ==========================================
// 接口 8：项目 CRUD
// ==========================================

// 8a. 获取所有项目（公开）
app.get('/api/projects', (req, res) => {
  res.json({ success: true, projects: db.projects });
});

// 8b. 获取单个项目（公开）
app.get('/api/projects/:id', (req, res) => {
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  res.json({ success: true, project });
});

// 8c. 创建项目（需登录 admin+）
app.post('/api/admin/projects', (req, res) => {
  const { token, project } = req.body;
  const user = getCurrentUser(token);
  if (!user) return res.status(401).json({ error: '未登录' });
  if (!['super_admin', 'admin'].includes(user.permissions[0])) {
    return res.status(403).json({ error: '无权创建项目' });
  }

  if (!project || !project.id || !project.title) {
    return res.status(400).json({ error: '项目ID和标题为必填' });
  }
  if (db.projects.find(p => p.id === project.id)) {
    return res.status(400).json({ error: `项目ID「${project.id}」已存在` });
  }

  // 确保文件夹存在
  const projectDir = path.join(ASSET_DIR, project.id);
  if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

  const newProject = {
    id: project.id,
    title: project.title || project.id,
    title_en: project.title_en || '',
    category: project.category || 'Cinematic VFX',
    category_en: project.category_en || '',
    date: project.date || new Date().toISOString().slice(0, 7),
    type: project.type || 'Short Film',
    tasks: project.tasks || [],
    tasks_en: project.tasks_en || [],
    description: project.description || '',
    description_en: project.description_en || '',
    cover: project.cover || '',
    video: project.video || '',
    gallery: project.gallery || [],
    downloadable: project.downloadable || []
  };

  // 自动扫描 asset 目录中的文件填充 gallery
  try {
    const files = fs.readdirSync(projectDir);
    const existingGallery = new Set(newProject.gallery);
    files.forEach(f => {
      const p = `/asset/${project.id}/${f}`;
      if (!existingGallery.has(p)) {
        newProject.gallery.push(p);
      }
    });
    // 自动设置 cover 和 video
    if (!newProject.cover) {
      const imgFile = files.find(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
      if (imgFile) newProject.cover = `/asset/${project.id}/${imgFile}`;
    }
    if (!newProject.video) {
      const vidFile = files.find(f => /\.(mp4|mov|webm)$/i.test(f));
      if (vidFile) newProject.video = `/asset/${project.id}/${vidFile}`;
    }
  } catch (e) {
    // 目录可能为空，没关系
  }

  // 不再自动生成 downloadable — 所有 gallery 文件登录即可下载
  newProject.gallery = newProject.gallery || [];

  // 确保 cover 和 video 在 gallery 中（导入旧数据时可能缺失）
  if (newProject.cover && !newProject.gallery.includes(newProject.cover)) {
    newProject.gallery.push(newProject.cover);
  }
  if (newProject.video && !newProject.gallery.includes(newProject.video)) {
    newProject.gallery.push(newProject.video);
  }

  db.projects.push(newProject);
  saveDB();
  res.json({ success: true, project: newProject });
});

// 8d. 更新项目（需登录 admin+）
app.put('/api/admin/projects/:id', (req, res) => {
  const { token, project } = req.body;
  const user = getCurrentUser(token);
  if (!user) return res.status(401).json({ error: '未登录' });
  if (!['super_admin', 'admin'].includes(user.permissions[0])) {
    return res.status(403).json({ error: '无权编辑项目' });
  }

  const index = db.projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '项目不存在' });

  // 如果改了 id，需要重命名文件夹
  if (project.id && project.id !== req.params.id) {
    if (db.projects.find(p => p.id === project.id)) {
      return res.status(400).json({ error: `项目ID「${project.id}」已存在` });
    }
    const oldDir = path.join(ASSET_DIR, req.params.id);
    const newDir = path.join(ASSET_DIR, project.id);
    if (fs.existsSync(oldDir) && !fs.existsSync(newDir)) {
      fs.renameSync(oldDir, newDir);
    }
  }

  // 合并更新
  const updated = { ...db.projects[index], ...project };
  // 确保 gallery 中的路径正确
  if (project.gallery) {
    updated.gallery = project.gallery.map(p =>
      p.startsWith('/asset/') ? p : `/asset/${project.id || req.params.id}/${p.split('/').pop()}`
    );
  }

  // 校验 video 和 image 文件是否存在，不存在则清空
  const resolveAsset = (filePath) => {
    if (!filePath) return null;
    const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const abs = path.join(__dirname, '..', 'Ethereal', 'public', normalized);
    return fs.existsSync(abs) ? filePath : null;
  };
  if (updated.video && !resolveAsset(updated.video)) {
    console.warn(`[警告] video 文件不存在: ${updated.video}，已自动清空`);
    updated.video = '';
  }
  if (updated.cover && !resolveAsset(updated.cover)) {
    console.warn(`[警告] cover 文件不存在: ${updated.cover}，已自动清空`);
    updated.cover = '';
  }

  // 确保 video 和 cover 文件在 gallery 中（避免被清理逻辑误删）
  if (updated.video && !updated.gallery.includes(updated.video)) {
    updated.gallery.push(updated.video);
  }
  if (updated.cover && !updated.gallery.includes(updated.cover)) {
    updated.gallery.push(updated.cover);
  }

  db.projects[index] = updated;
  saveDB();

  // 清理项目目录中不在 gallery 里的多余文件
  const projectDir = path.join(ASSET_DIR, updated.id);
  if (fs.existsSync(projectDir)) {
    try {
      const galleryPaths = new Set((updated.gallery || []).map(p => path.basename(p)));
      const files = fs.readdirSync(projectDir);
      files.forEach(f => {
        if (!galleryPaths.has(f)) {
          const filePath = path.join(projectDir, f);
          fs.unlinkSync(filePath);
          console.log(`[清理] 删除了多余文件: ${updated.id}/${f}`);
        }
      });
    } catch (e) {
      console.error(`清理项目目录失败: ${e.message}`);
    }
  }

  res.json({ success: true, project: updated });
});

// 8e. 删除项目（仅 super_admin）
app.delete('/api/admin/projects/:id', (req, res) => {
  const token = req.query.token;
  const user = getCurrentUser(token);
  if (!user) return res.status(401).json({ error: '未登录' });
  if (user.permissions[0] !== 'super_admin') {
    return res.status(403).json({ error: '仅超级管理员可删除项目' });
  }

  const index = db.projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '项目不存在' });

  db.projects.splice(index, 1);
  saveDB();
  res.json({ success: true });
});

// ==========================================
// 接口 9：文件上传
// ==========================================
app.post('/api/admin/upload', upload.array('files', 50), (req, res) => {
  const { token, projectId } = req.body;
  const user = getCurrentUser(token);
  if (!user) return res.status(401).json({ error: '未登录' });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '请选择文件' });
  }

  // 确保项目文件夹存在
  const projectDir = path.join(ASSET_DIR, projectId);
  if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

  const uploaded = req.files.map(f => ({
    originalname: f.originalname,
    size: f.size,
    path: `/asset/${projectId}/${f.originalname}`,
    filename: f.filename
  }));

  console.log(`[上传] ${user.email} 上传了 ${uploaded.length} 个文件到 ${projectId}`);
  res.json({ success: true, files: uploaded });
});

// 单个文件上传（兼容）
app.post('/api/admin/upload/single', upload.single('file'), (req, res) => {
  const { token, projectId } = req.body;
  const user = getCurrentUser(token);
  if (!user) return res.status(401).json({ error: '未登录' });
  if (!req.file) return res.status(400).json({ error: '请选择文件' });

  const projectDir = path.join(ASSET_DIR, projectId);
  if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

  console.log(`[上传] ${user.email} 上传了 ${req.file.originalname} 到 ${projectId}`);
  res.json({
    success: true,
    file: {
      originalname: req.file.originalname,
      size: req.file.size,
      path: `/asset/${projectId}/${req.file.originalname}`,
      filename: req.file.filename
    }
  });
});

// ==========================================
// 接口 10：标签管理
// ==========================================

// 10a. 获取所有标签及其使用次数
app.get('/api/admin/tags', (req, res) => {
  const tagCount = {};
  db.projects.forEach(p => {
    (p.tasks || []).forEach((t) => {
      tagCount[t] = (tagCount[t] || 0) + 1;
    });
  });
  const tags = Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  res.json({ success: true, tags });
});

// 10b. 合并标签（将 sourceTag 合并到 targetTag）
app.post('/api/admin/tags/merge', (req, res) => {
  const { token, sourceTag, targetTag } = req.body;
  const user = getCurrentUser(token);
  if (!user) return res.status(401).json({ error: '未登录' });
  if (!['super_admin', 'admin'].includes(user.permissions[0])) {
    return res.status(403).json({ error: '无权管理标签' });
  }
  if (!sourceTag || !targetTag || sourceTag === targetTag) {
    return res.status(400).json({ error: '无效的标签' });
  }

  let affected = 0;
  db.projects.forEach(p => {
    if (p.tasks && p.tasks.includes(sourceTag)) {
      p.tasks = p.tasks.map((t) => t === sourceTag ? targetTag : t);
      affected++;
    }
  });
  saveDB();
  console.log(`[标签合并] ${user.email} 将「${sourceTag}」合并到「${targetTag}」（影响 ${affected} 个项目）`);
  res.json({ success: true, affected });
});

// 10c. 删除标签（从所有项目中移除）
app.post('/api/admin/tags/delete', (req, res) => {
  const { token, tag } = req.body;
  const user = getCurrentUser(token);
  if (!user) return res.status(401).json({ error: '未登录' });
  if (user.permissions[0] !== 'super_admin') {
    return res.status(403).json({ error: '仅超级管理员可删除标签' });
  }

  let affected = 0;
  db.projects.forEach(p => {
    if (p.tasks) {
      const before = p.tasks.length;
      p.tasks = p.tasks.filter((t) => t !== tag);
      if (p.tasks.length !== before) affected++;
    }
  });
  saveDB();
  res.json({ success: true, affected });
});

// ==========================================
// 接口 11：共享筛选链接
// ==========================================

// 11a. 创建共享筛选链接（仅 admin/super_admin）
app.post('/api/admin/share-filter', (req, res) => {
  const { token, filter, name } = req.body;
  const user = getCurrentUser(token);
  if (!user) return res.status(401).json({ error: '未登录' });
  if (!['super_admin', 'admin'].includes(user.permissions[0])) {
    return res.status(403).json({ error: '无权创建分享链接' });
  }
  if (!filter) return res.status(400).json({ error: '需要 filter 参数' });

  const shareToken = uuidv4().slice(0, 8);
  db.sharedFilters = db.sharedFilters || [];
  db.sharedFilters.push({
    token: shareToken,
    filter,
    name: name || '',
    createdBy: user.email,
    createdAt: new Date().toISOString(),
  });
  saveDB();
  console.log(`[分享] ${user.email} 创建了筛选分享: ${shareToken}`);
  res.json({
    success: true,
    shareToken,
    url: `/share/${shareToken}`,
  });
});

// 11b. 获取共享筛选内容（公开，无需登录）
app.get('/api/share/:token', (req, res) => {
  db.sharedFilters = db.sharedFilters || [];
  const share = db.sharedFilters.find(s => s.token === req.params.token);
  if (!share) return res.status(404).json({ error: '分享链接不存在或已失效' });

  const { filter } = share;
  let projects = [...db.projects];

  // 应用相同的筛选逻辑
  if (filter.searchQuery) {
    const q = filter.searchQuery.toLowerCase();
    projects = projects.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.title_en || '').toLowerCase().includes(q) ||
      (p.tasks || []).some(t => t.toLowerCase().includes(q)) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }
  const filters = filter.activeFilters || (filter.activeFilter && filter.activeFilter !== 'All' ? [filter.activeFilter] : []);
  if (filters.length > 0) {
    projects = projects.filter(p =>
      filters.some(f => p.type === f || p.tasks?.includes(f))
    );
  }
  if (filter.activeLetter) {
    // 简化：返回给前端让前端自己过滤
    // 后端只用其他条件过滤，首字母在前端处理
  }

  res.json({
    success: true,
    share: {
      name: share.name,
      createdAt: share.createdAt,
      createdBy: share.createdBy,
    },
    filter: share.filter,
    projects,
  });
});

// ==========================================
// 启动
// ==========================================
app.listen(8080, () => {
  console.log(`Mock Backend 启动成功！正在监听 http://localhost:8080`);
  console.log(`已加载 ${db.users.length} 个用户, ${db.projects.length} 个项目`);
});
