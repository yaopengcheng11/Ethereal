import { motion } from 'motion/react';
import { siteConfig } from '../data/projects';
// 移除了 projects 数组的导入，因为主页不再需要渲染项目列表了

export function Home() {
  return (
    // 🚀 核心修改：使用 h-screen 和 overflow-hidden 彻底锁死屏幕，禁止往下滚动
    <div className="h-screen w-full bg-background overflow-hidden relative">

      {/* 背景大图 */}
      <motion.img
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        src={siteConfig.hero.image}
        className="absolute inset-0 w-full h-full object-cover opacity-100 saturate-100"
        alt="E STUDIO Showreel"
        referrerPolicy="no-referrer"
      />

      {/* 渐变遮罩：压暗边缘，让白字清晰可见，且不干扰图片主体 */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/90 via-[#030303]/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#030303]/60 via-transparent to-transparent pointer-events-none" />

      {/* 左下角排版区域 */}
      <div className="absolute bottom-12 md:bottom-20 left-6 md:left-16 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="font-mono text-[9px] text-white/50 uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
            <span className="w-6 h-[1px] bg-white/40"></span>
            {siteConfig.hero.label}
          </p>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter uppercase leading-[1.05] text-white drop-shadow-lg">
            {siteConfig.hero.titleLine1}<br />
            <span className="text-white/60">{siteConfig.hero.titleLine2}</span>
          </h1>
          <p className="mt-6 font-sans text-sm text-white/50 max-w-md leading-relaxed font-light tracking-wide">
            {siteConfig.hero.description}
          </p>
        </motion.div>
      </div>

    </div>
  );
}