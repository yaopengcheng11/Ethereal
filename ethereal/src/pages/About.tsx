import { motion } from 'motion/react';

export function About() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-6 md:px-16">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-32">
          <div className="md:col-span-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl md:text-5xl font-display font-bold tracking-tighter uppercase text-white leading-tight mb-12"
            >
              ETHEREAL ENGINE is a global standard-bearer for creative innovation, attracting the world's most ambitious talent, partners, and clients.
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="font-sans text-text-muted text-lg leading-relaxed space-y-6 max-w-2xl"
            >
              <p>
                Born at the intersection of cinematic artistry and generative computation, we redefine the boundaries of visual storytelling. Our studio serves as a sanctuary for the fusion of traditional craft and autonomous intelligence.
              </p>
              <p>
                We don't just generate imagery; we curate experiences that pulse with intentionality. Every frame processed through the Ethereal Engine is a testament to our commitment to the "Art of the Shot," ensuring that technology remains a servant to human vision.
              </p>
              
              <div className="pt-8">
                <a href="/worldview" className="font-mono text-[10px] text-white uppercase tracking-[0.2em] border-b border-white/30 pb-1 hover:border-white transition-colors">
                  Explore our worldview -&gt;
                </a>
              </div>
            </motion.div>
          </div>
          
          <div className="md:col-span-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="w-full aspect-[3/4] border border-white/10 p-2 bg-surface-low"
            >
              <img 
                src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop" 
                alt="Studio Server" 
                className="w-full h-full object-cover saturate-[0.25] opacity-60"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-16">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tighter text-white mb-12">Contact</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h4 className="font-mono text-[9px] text-text-muted uppercase tracking-[0.3em] mb-4">Head Office</h4>
              <p className="font-sans text-sm text-white leading-relaxed">
                99 Obsidian Way<br/>
                Neo-VFX District<br/>
                London, NCVX 2RN<br/>
                <br/>
                +44 (0) 20 7946 0122
              </p>
            </div>
            <div>
              <h4 className="font-mono text-[9px] text-text-muted uppercase tracking-[0.3em] mb-4">Work & General</h4>
              <p className="font-sans text-sm text-white leading-relaxed">
                <a href="#" className="hover:text-text-muted transition-colors">hello@etherealengine.ai</a><br/>
                <a href="#" className="hover:text-text-muted transition-colors">press@etherealengine.ai</a>
              </p>
            </div>
            <div>
              <h4 className="font-mono text-[9px] text-text-muted uppercase tracking-[0.3em] mb-4">New Business</h4>
              <p className="font-sans text-sm text-white leading-relaxed">
                <a href="#" className="hover:text-text-muted transition-colors">partners@etherealengine.ai</a>
              </p>
              <p className="font-mono text-[9px] text-text-muted mt-4">Inquiries for project engagements.</p>
            </div>
            <div>
              <h4 className="font-mono text-[9px] text-text-muted uppercase tracking-[0.3em] mb-4">Careers</h4>
              <p className="font-sans text-sm text-white leading-relaxed">
                <a href="#" className="hover:text-text-muted transition-colors">talent@etherealengine.ai</a>
              </p>
              <p className="font-mono text-[9px] text-text-muted mt-4">We are always seeking exceptional talent.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
