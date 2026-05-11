# E Studio // Visual VFX

面向影视特效与生成式影像项目展示的作品集网站。暗色、高密度、电影化的视觉语言，围绕项目案例、能力标签、单项目详情、工作室介绍和世界观叙事构建。

---

## 目录结构

```
EtherealProject/
├── ethereal/                    # 前端（React + Vite + TypeScript）
│   ├── src/
│   │   ├── components/          # 公共组件（Navbar, Footer）
│   │   ├── context/             # AuthContext（登录状态全局管理）
│   │   ├── data/                # 项目数据定义（类型 + 本地数据）
│   │   └── pages/
│   │       ├── Home.tsx         # 首页
│   │       ├── Projects.tsx     # 项目列表（筛选+搜索+A-Z过滤）
│   │       ├── ProjectDetail.tsx# 项目详情（播放器+文件下载）
│   │       ├── Worldview.tsx    # 世界观页面
│   │       ├── About.tsx        # 关于页面
│   │       ├── LoginPage.tsx    # 登录
│   │       ├── RegisterPage.tsx # 注册
│   │       ├── BookmarksPage.tsx# 收藏
│   │       └── AdminProjectsPage.tsx  # 管理后台（多 Tab）
│   │           ├── AdminUsersTab.tsx
│   │           ├── AdminTagsTab.tsx
│   │           ├── AdminProjectsPage.list.tsx
│   │           ├── AdminProjectsPage.form.tsx
│   │           └── AdminProjectsPage.components.tsx
│   ├── public/asset/            # 项目媒体文件（图片、视频）
│   ├── vite.config.ts
│   └── package.json
│
└── ethereal-api-mock/           # 后端（Express mock API）
    ├── server.js                # 主服务（认证/CRUD/下载/标签管理/文件上传）
    └── package.json
```

---

## 技术栈

| 层 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 6 |
| 样式 | Tailwind CSS 4（通过 @tailwindcss/vite） |
| 路由 | react-router-dom 7 |
| 动效 | motion（Framer Motion 重构版） |
| 图标 | lucide-react |
| 后端 | Express 5（CommonJS） |
| 文件上传 | multer（最大 1GB） |
| 数据存储 | JSON 文件持久化（`data/db.json`） |

---

## 功能清单

- **项目展示**：卡片网格布局、A-Z 拼音首字母过滤、技术标签分类、搜索
- **项目详情**：视频播放器、Gallery 浏览、全屏模式、文件下载
- **用户系统**：注册/登录（token 鉴权）、访客/管理员/超级管理员三级权限
- **文件下载**：登录用户可下载全部 gallery 文件，非登录只能浏览
- **管理后台**：
  - 项目管理：增/删/改项目、拖拽上传文件、设置封面和主视频
  - 标签管理：查看标签使用统计、合并相似标签、删除标签
  - 用户管理：邀请码生成、用户列表
- **标签智能建议**：输入时自动提示已有标签，检测到新标签时弹出相似推荐

---

## 快速启动（本地开发）

### 环境要求

- Node.js >= 22
- npm

### 1. 启动后端

```bash
cd ethereal-api-mock
npm install
node server.js
```

后端默认运行在 **http://localhost:8080**

首次启动会自动从 `ethereal/src/data/projects.ts` 导入项目数据并持久化到 `data/db.json`。

### 2. 启动前端

```bash
cd ethereal
npm install
npm run dev
```

前端默认运行在 **http://localhost:3000**

开发模式下 Vite 自动代理 `/api` 请求到后端 8080 端口（配置见 `vite.config.ts`）。

### 3. 默认管理员账号

```
邮箱: yao_pengcheng@outlook.com
密码: 123456
角色: super_admin
```

---

## 生产环境部署

### 方案一：前后端同机部署（推荐小团队）

#### 1. 构建前端

```bash
cd ethereal
npm run build
```

构建产物在 `ethereal/dist/` 目录。

#### 2. 配置 Nginx（反向代理）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /path/to/ethereal/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 大文件上传支持
        client_max_body_size 1024m;
        proxy_request_buffering off;
        proxy_buffering off;
    }

    # 静态文件缓存（图片/视频）
    location /asset/ {
        alias /path/to/ethereal/public/asset/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

> **注意**：如果前后端不在同一台服务器，需要修改 `ethereal/vite.config.ts` 中的 proxy 配置，并在后端 `server.js` 中设置 CORS 允许的前端域名。

#### 3. 启动后端

```bash
cd ethereal-api-mock

# 推荐使用 PM2 管理进程
npm install -g pm2
pm2 start server.js --name e-studio-api

# 开机自启
pm2 save
pm2 startup
```

#### 4. 确保媒体文件目录

```bash
# 项目媒体文件目录（前端构建后需要能被访问到）
ls ethereal/public/asset/

# 每个项目一个子目录，例如：
# asset/三尺之下/
# asset/攻玉/
# asset/长宁帝君/
```

### 方案二：Docker 部署

> 需要自行编写 Dockerfile，如有需要可提供。

---

## 管理后台使用

访问 `http://your-domain/admin` 并用管理员账号登录。

### Projects 管理

| Tab | 功能 |
|------|------|
| Projects | 查看/编辑/删除已有项目 |
| + New Project | 新建项目（完整表单 + 拖拽上传） |
| Tags | 标签统计、合并相似标签、删除标签 |
| Users | 邀请码生成、用户列表 |

### 项目编辑注意

- **Cover**：每个项目只能设置一张封面，在项目列表页显示
- **Main Video**：每个项目只能设置一个主视频，在详情页播���
- 设置 Cover/Main Video 后，对应文件会自动加入 Gallery 列表，不会被清理
- 保存时弹窗提示将从目录中删除的文件

### 标签管理

- 在 **Tags Tab** 中可以查看所有标签的使用次数
- 选中 Source Tag 和 Target Tag 后点击 "Execute Merge" 合并
- 合并后所有使用 Source Tag 的项目自动更新为 Target Tag
- 在创建/编辑项目时输入标签会自动提示已有标签
- 输入不存在的标签按回车会弹出相似标签推荐

---

## 安全注意事项

- 生产环境请修改默认管理员密码
- 后端 `server.js` 中的 token 验证仅为简化 mock，生产环境应接入 JWT 或 session
- 文件上传有 1GB 限制（`server.js` 中 `limist: 1024*1024*1024`），根据需要调整
- 媒体文件目录 `public/asset/` 应做好备份
- `api/download` 接口有路径穿越防护（`path.normalize` + `startsWith('/asset/')`）
- CORS 在生产环境中应限制具体域名，而非使用 `*`

---

## 常见问题

**Q: 新建项目后页面不显示？**
A: 刷新页面。前端项目列表页优先从 API 获取数据。

**Q: 上传文件后 main video 不播放？**
A: 可能是文件不存在于服务器。后端会自动校验并清空不存在的 video/cover 字段。重新上传文件后再设置 main video。

**Q: 首字母过滤不准确？**
A: 中文项目名称使用拼音首字母映射表。如果某个字的拼音不在映射表中，请更新 `Projects.tsx` 中的 `pinyinMap`。

**Q: 数据如何备份？**
A: 备份 `ethereal-api-mock/data/db.json` 和 `ethereal/public/asset/` 目录。
