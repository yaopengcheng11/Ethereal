import { motion } from 'motion/react';

export function Worldview() {
  const categories = [
    {
      id: "01",
      title: "Geospatial Signatures",
      description: "Cataloging the atmospheric and structural data of global environments. From the light scattering in a dense rainforest to the concrete brutalism of urban sprawls, we define the parameters of 'place'.",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop",
      tags: ["Atmosphere", "Architecture", "Terrain"]
    },
    {
      id: "02",
      title: "Temporal Epochs",
      description: "Archiving the visual zeitgeist of time. We capture the material degradation, color grading, and cultural aesthetics specific to historical eras and speculative futures.",
      image: "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=1000&auto=format&fit=crop",
      tags: ["Era", "Degradation", "Zeitgeist"]
    },
    {
      id: "03",
      title: "Biological Kinematics",
      description: "A deep dive into the morphological traits and movement patterns of organic life. Simulating muscle tension, skeletal limits, and behavioral dynamics across species.",
      image: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1000&auto=format&fit=crop",
      tags: ["Anatomy", "Motion", "Species"]
    },
    {
      id: "04",
      title: "Stylistic Paradigms",
      description: "Codifying the laws of artistic interpretation. How physical reality translates into specific visual styles, from hyper-realism to stylized animation, governed by strict rule sets.",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
      tags: ["Aesthetics", "Rulesets", "Rendering"]
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-6 md:px-16">
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-32 border-b border-white/10 pb-16">
          <p className="font-mono text-[10px] text-text-muted uppercase tracking-[0.3em] mb-6">The Taxonomy of Reality</p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-7xl font-display font-bold tracking-tighter uppercase text-white mb-8"
          >
            Worldview<span className="text-text-muted">.</span>
          </motion.h1>
          <p className="font-sans text-lg text-text-muted max-w-2xl leading-relaxed">
            A categorized, grand reference system for the AI era. We archive the characteristics, styles, dynamics, and underlying laws of every geography, epoch, and biological entity to train the next generation of visual synthesis.
          </p>
        </header>

        <div className="space-y-32">
          {categories.map((category, index) => (
            <motion.div 
              key={category.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 md:gap-24 items-center`}
            >
              <div className="flex-1 w-full">
                <p className="font-mono text-[9px] text-text-muted uppercase tracking-[0.3em] mb-4">Category {category.id} // Taxonomy</p>
                <h2 className="font-display text-3xl font-bold uppercase tracking-tighter text-white mb-6">
                  {category.title}
                </h2>
                <p className="font-sans text-text-muted leading-relaxed mb-8">
                  {category.description}
                </p>
                <div className="flex gap-4">
                  {category.tags.map(tag => (
                    <span key={tag} className="font-mono text-[8px] text-white border border-white/20 px-2 py-1 uppercase tracking-widest">{tag}</span>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 w-full">
                <div className="relative aspect-video border border-white/10 bg-surface-low p-2">
                  <div className="absolute top-4 left-4 font-mono text-[8px] text-text-muted tracking-widest z-10">SYS.ARCHIVE // {category.id}</div>
                  <img 
                    src={category.image} 
                    alt={category.title} 
                    className="w-full h-full object-cover saturate-[0.25] opacity-60"
                    referrerPolicy="no-referrer"
                  />
                  {/* Decorative UI elements */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Tech Specs Footer */}
        <div className="mt-32 pt-16 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-mono text-[9px] text-text-muted uppercase tracking-[0.3em] mb-2">Data Points</h4>
            <p className="font-display text-sm font-bold text-white uppercase tracking-widest">14.2 Billion</p>
          </div>
          <div>
            <h4 className="font-mono text-[9px] text-text-muted uppercase tracking-[0.3em] mb-2">Taxonomy</h4>
            <p className="font-display text-sm font-bold text-white uppercase tracking-widest">Dynamic Tree</p>
          </div>
          <div>
            <h4 className="font-mono text-[9px] text-text-muted uppercase tracking-[0.3em] mb-2">Resolution</h4>
            <p className="font-display text-sm font-bold text-white uppercase tracking-widest">Sub-Millimeter</p>
          </div>
          <div>
            <h4 className="font-mono text-[9px] text-text-muted uppercase tracking-[0.3em] mb-2">Synthesis</h4>
            <p className="font-display text-sm font-bold text-white uppercase tracking-widest">Real-Time</p>
          </div>
        </div>
      </div>
    </div>
  );
}
