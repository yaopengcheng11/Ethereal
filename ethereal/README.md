# Ethereal

一个面向影视特效与生成式影像项目展示的作品集网站。项目以暗色、高密度、电影化的视觉语言为主，围绕项目案例、能力标签、单项目详情、工作室介绍和世界观叙事几个部分，构建了一套适合展示视觉资产与视频内容的前端站点。

当前仓库已经不是默认的 AI Studio 模板站，而是一个真实可维护的作品展示项目：站点内容主要来自 `public/asset` 下的项目素材目录，并通过 `scan-assets.js` 自动汇总为前端数据文件。

## 项目定位

这个项目适合用作：

- 影视特效 / AI 影像工作室官网
- 项目案例展示站
- Showreel 与视觉能力集展示页
- 内部或对外的项目归档与演示入口

站点首页突出主视觉海报，项目页强调大卡片编排与悬停预览，详情页则重点展示主视频、文字说明和扩展画廊，整体更偏作品集而不是传统 CMS。

## 当前功能

### 1. 首页 `Home`

- 使用全屏 Hero 图作为主视觉
- 显示品牌文案、Showreel 标签和核心定位描述
- 页面锁定为整屏展示，强调开场气质

### 2. 项目列表页 `Projects`

- 支持按项目类型浏览
- 支持按能力标签浏览
- 支持项目名称搜索
- 支持缩放卡片尺寸，动态调整瀑布式密度
- 卡片支持视频悬停自动播放
- 悬停时显示当前项目的任务标签

### 3. 项目详情页 `ProjectDetail`

- 顶部主视频 / 主图展示
- 点击主视频可播放 / 暂停
- 自定义进度条拖拽
- 支持静音切换逻辑预留
- 显示项目描述、分类、类型、日期
- Gallery 支持图像 / 视频混排
- 支持全屏预览
- 支持 `Esc` 返回项目列表或退出全屏

### 4. 世界观页 `Worldview`

- 通过分类卡片展示工作室的创意体系与方法论
- 当前内容偏品牌叙事与概念展示
- 使用图文交替排版强化视觉节奏

### 5. 关于页 `About`

- 展示品牌介绍文案
- 提供联系信息占位内容
- 可作为后续商务、招聘、合作说明页扩展

## 技术栈

- `Vite 6`
- `React 19`
- `TypeScript`
- `React Router DOM 7`
- `Tailwind CSS 4`
- `motion` 用于页面和组件动画
- `lucide-react` 用于图标

虽然依赖中还包含 `express`、`dotenv`、`@google/genai` 等包，但当前前端实现的核心运行并不依赖服务端接口，站点本体是一个纯前端作品集。

## 项目结构

```text
ethereal/
├─ public/
│  ├─ home-bg.png                # 首页主视觉背景图
│  └─ asset/                     # 每个项目的素材目录
│     ├─ 攻玉/
│     │  ├─ meta.json
│     │  ├─ main.mov
│     │  └─ ...
│     └─ ...
├─ src/
│  ├─ components/
│  │  ├─ Navbar.tsx
│  │  └─ Footer.tsx
│  ├─ data/
│  │  └─ projects.ts            # 自动生成，不建议手改
│  ├─ pages/
│  │  ├─ Home.tsx
│  │  ├─ Projects.tsx
│  │  ├─ ProjectDetail.tsx
│  │  ├─ Worldview.tsx
│  │  └─ About.tsx
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ index.css
├─ scan-assets.js               # 扫描素材并生成项目数据
├─ vite.config.ts
├─ package.json
└─ README.md
```

## 路由说明

项目目前包含以下前端路由：

- `/` 首页
- `/projects` 项目列表页
- `/project/:id` 项目详情页
- `/worldview` 世界观页
- `/about` 关于页

## 数据来源与内容生成机制

这是项目最重要的维护方式。

### 1. 项目素材目录

每个项目对应 `public/asset` 下的一个文件夹，例如：

```text
public/asset/攻玉/
public/asset/三尺之下/
public/asset/长宁帝君/
```

当前仓库中已存在 `15` 个项目目录。

### 2. `meta.json`

每个项目目录内可以放一个 `meta.json`，用于定义该项目的元信息。当前脚本支持的字段包括：

```json
{
  "title": "攻玉",
  "title_en": "Gong Yu",
  "category": "Cinematic VFX",
  "category_en": "VFX Production",
  "date": "2026.04",
  "type": "Short Film",
  "task": "气氛，概念，换人，替身",
  "task_en": "mood, concept, face replacement, stunt double",
  "description": "这里写你的项目描述内容。",
  "description_en": "Industrial-grade production blended with generative intelligence.",
  "video_link": "",
  "image_link": ""
}
```

说明：

- `task` 和 `task_en` 会按中英文逗号拆分为数组
- `video_link`、`image_link` 可直接指定外部资源地址
- 如果不填外链，脚本会自动从本地素材中推断主视频和主图

### 3. 自动扫描规则

`scan-assets.js` 会扫描 `public/asset/*`，并按以下逻辑生成 [`src/data/projects.ts`](G:/AITOOLS/ethereal/src/data/projects.ts)：

- 文件夹名默认作为项目 `id`
- 优先把文件名包含 `main` 或 `showreel` 的视频识别为主视频
- 优先把文件名包含 `cover` 的图片识别为主图
- 如果没有明确主图，会从画廊中拿第一张图片作为主图
- 其余图片 / 视频进入 `gallery`
- 根目录下若存在 `hero.*` 或 `home-bg.*`，会作为首页 Hero 图

也就是说，这个项目的数据维护思路是：

1. 往 `public/asset` 里加项目目录
2. 放入视频、图片、`meta.json`
3. 运行扫描脚本
4. 自动生成前端项目数据

## 本地开发

### 环境要求

- Node.js 18+ 或更高版本
- npm

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

默认会在 `3000` 端口启动 Vite 开发服务器。

### 构建生产版本

```bash
npm run build
```

我已经在当前仓库实际执行过构建，构建通过。

### 本地预览构建结果

```bash
npm run preview
```

### 类型检查

```bash
npm run lint
```

这里的 `lint` 实际上执行的是 `tsc --noEmit`，也就是 TypeScript 类型检查，并不是 ESLint。

## 内容维护流程

如果你要新增一个项目，推荐按下面的流程：

### 新增项目

1. 在 `public/asset` 下新建一个目录，例如 `public/asset/新项目`
2. 放入主视频，推荐命名为 `main.mp4` 或 `main.mov`
3. 放入封面图，推荐命名为 `cover.png`，如果没有也可以由脚本自动推断
4. 添加更多过程图、对比图、补充视频，它们会进入 `gallery`
5. 新建 `meta.json` 补充分类、任务、描述等信息
6. 运行：

```bash
node scan-assets.js
```

7. 启动本地站点检查展示是否正确

### 修改首页主视觉

- 替换 `public/home-bg.png`
- 或放置 `public/hero.*` / `public/home-bg.*`
- 如需修改首页文案，可编辑 [`src/data/projects.ts`](G:/AITOOLS/ethereal/src/data/projects.ts) 中的 `siteConfig.hero`

### 修改项目页布局或交互

- 项目列表页：[`src/pages/Projects.tsx`](G:/AITOOLS/ethereal/src/pages/Projects.tsx)
- 项目详情页：[`src/pages/ProjectDetail.tsx`](G:/AITOOLS/ethereal/src/pages/ProjectDetail.tsx)
- 全局样式：[`src/index.css`](G:/AITOOLS/ethereal/src/index.css)

## 设计特点

这个项目在视觉上有几个比较鲜明的特征：

- 大面积深色背景与低亮度网格纹理
- 偏电影感、杂志感的排版
- 项目卡片采用非均质布局，避免传统整齐网格的平淡感
- 视频 hover 播放，突出动态内容展示能力
- 详情页支持图像 / 视频混合画廊，更适合影视与 AIGC 项目

如果后续继续迭代，这套结构很适合继续扩展：

- 中英文切换
- CMS 化项目管理
- 后台上传素材自动生成项目
- 接入真实联系方式与商务表单
- 项目标签体系进一步标准化

## 环境变量

仓库中保留了 `.env.example`，包含：

- `GEMINI_API_KEY`
- `APP_URL`

但就当前代码来看，前端页面本身没有实际调用 Gemini API，也没有直接使用 `APP_URL`。这些变量更多是从早期 AI Studio 模板中保留下来的配置。若后续不再使用相关能力，可以继续清理。

## 已知现状

目前项目处于“可运行、可展示、可继续美化”的状态，同时也有一些明显可继续完善的地方：

- 多个项目描述仍是占位文案“这里写你的项目描述内容。”
- `About` 和 `Worldview` 页面仍偏品牌概念页，内容可进一步本地化
- `package.json` 中项目名仍是 `react-example`
- `npm run clean` 使用了 `rm -rf dist`，在 Windows 原生命令行里不够稳妥
- `src/data/projects.ts` 是生成文件，若手动修改后再运行扫描脚本，改动会被覆盖

## 推荐下一步

如果你准备把这个项目真正用于对外展示，我建议优先做这几件事：

1. 把每个项目的 `meta.json` 描述补完整
2. 给项目补充明确的封面图命名规则，例如统一使用 `cover.*`
3. 把 `About` 页联系方式替换成真实信息
4. 调整 `package.json` 的项目名与脚本
5. 给 `scan-assets.js` 增加 npm script，例如 `npm run scan`
6. 考虑把 `projects.ts` 彻底改为纯生成产物，避免人工误改

## 许可与说明

当前仓库更像是一个私有作品集项目模板，是否开源、素材是否可公开传播，需要结合你的项目资产版权自行决定。尤其是 `public/asset` 下的视频与图像，很可能属于高价值内容，建议在公开仓库前确认授权边界。
