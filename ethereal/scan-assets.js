import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');
const assetsDir = path.join(publicDir, 'asset');
const outputFile = path.join(__dirname, 'src', 'data', 'projects.ts');

const videoExts = ['.mp4', '.mov', '.webm'];
const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function scanProjects() {
  const projects = [];

  if (!fs.existsSync(assetsDir)) {
    console.warn(`⚠️ 找不到目录: ${assetsDir}`);
    return;
  }

  const folders = fs.readdirSync(assetsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  folders.forEach((folderName) => {
    const folderPath = path.join(assetsDir, folderName);
    const files = fs.readdirSync(folderPath);

    let localVideoUrl = '';
    let fallbackVideoUrl = '';
    let localImageUrl = '';
    const rawGallery = [];

    // 默认数据结构（含双语）
    let projectMeta = {
      title: folderName,
      title_en: folderName,
      category: "影视特效",
      category_en: "VFX Production",
      date: "2026",
      type: "Film",
      task: "",
      task_en: "",
      description: "工业级生产力与生成式人工智能的结合。",
      description_en: "Industrial-grade production blended with generative intelligence.",
      // 🚀 新增：允许在 meta.json 中直接指定外部链接
      video_link: "",
      image_link: ""
    };

    const metaPath = path.join(folderPath, 'meta.json');
    if (fs.existsSync(metaPath)) {
      try {
        const metaContent = fs.readFileSync(metaPath, 'utf-8');
        projectMeta = { ...projectMeta, ...JSON.parse(metaContent) };
      } catch (e) {
        console.error(`⚠️ 解析失败: ${folderName}/meta.json`);
      }
    }

    // 扫描本地文件逻辑
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      const relativeUrl = `/asset/${folderName}/${file}`;
      const lowerFile = file.toLowerCase();
      if (lowerFile === 'meta.json') return;

      if (videoExts.includes(ext)) {
        if (lowerFile.includes('main') || lowerFile.includes('showreel')) localVideoUrl = relativeUrl;
        else { if (!fallbackVideoUrl) fallbackVideoUrl = relativeUrl; rawGallery.push(relativeUrl); }
      } else if (imageExts.includes(ext)) {
        if (lowerFile.includes('cover')) localImageUrl = relativeUrl;
        else rawGallery.push(relativeUrl);
      }
    });

    if (!localVideoUrl) localVideoUrl = fallbackVideoUrl;
    if (!localImageUrl && rawGallery.length > 0) {
      const firstImgIdx = rawGallery.findIndex(url => /\.(jpg|jpeg|png|webp|gif)$/i.test(url));
      if (firstImgIdx !== -1) { localImageUrl = rawGallery[firstImgIdx]; rawGallery.splice(firstImgIdx, 1); }
    }

    // 🚀 判定优先级：如果 meta.json 给了外部 link，就用外部的，否则用本地扫描的
    const finalVideo = projectMeta.video_link || localVideoUrl;
    const finalImage = projectMeta.image_link || localImageUrl;

    const taskArray = projectMeta.task.split(/[，,]/).map(t => t.trim()).filter(t => t);
    const taskArrayEn = projectMeta.task_en.split(/[，,]/).map(t => t.trim()).filter(t => t);

    projects.push({
      id: folderName,
      title: projectMeta.title,
      title_en: projectMeta.title_en,
      category: projectMeta.category,
      category_en: projectMeta.category_en,
      date: projectMeta.date,
      type: projectMeta.type,
      tasks: taskArray,
      tasks_en: taskArrayEn,
      description: projectMeta.description,
      description_en: projectMeta.description_en,
      image: finalImage,
      video: finalVideo,
      gallery: rawGallery.filter(url => url !== localVideoUrl)
    });
  });

  // 获取 Hero
  let heroImagePath = "/hero.jpg";
  if (fs.existsSync(publicDir)) {
    const publicFiles = fs.readdirSync(publicDir);
    const heroFile = publicFiles.find(file => {
      const lowerFile = file.toLowerCase();
      return (lowerFile.startsWith('hero.') || lowerFile.startsWith('home-bg.')) && imageExts.includes(path.extname(lowerFile));
    });
    if (heroFile) heroImagePath = `/${heroFile}`;
  }

  const fileContent = `// 自动生成文件 - 包含所有文案和路径映射
export interface Project {
  id: string; title: string; title_en: string; category: string; category_en: string;
  date: string; type: string; tasks: string[]; tasks_en: string[];
  description: string; description_en: string; image: string; video?: string; gallery?: string[];
}

export const siteConfig = {
  hero: { image: "${heroImagePath}", label: "E STUDIO // Showreel", titleLine1: "The Art of the Shot,", titleLine2: "Redefined", description: "Industrial-grade production blended with generative intelligence." }
};

export const projects: Project[] = ${JSON.stringify(projects, null, 2)};
`;

  fs.writeFileSync(outputFile, fileContent, 'utf-8');
  console.log("✅ 资产映射完成！GitHub 仓库现在已实现瘦身。");
}

scanProjects();