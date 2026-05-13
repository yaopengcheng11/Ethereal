import { Link, useLocation, useSearchParams } from 'react-router-dom';

export function Footer() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isShareContext = location.pathname.startsWith('/share/') ||
    (location.pathname.startsWith('/project/') && searchParams.has('share'));

  if (isShareContext) {
    return (
      <footer className="py-8 px-4 md:px-8 border-t border-white/10 mt-24 bg-background">
        <div className="max-w-[1600px] mx-auto text-center">
          <h3 className="font-display font-bold text-xs tracking-[0.2em] uppercase mb-2 text-white">
            E STUDIO
          </h3>
          <p className="font-mono text-[9px] text-text-muted uppercase tracking-widest">
            Pushing the boundaries of visual storytelling. © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="py-8 px-4 md:px-8 border-t border-white/10 mt-24 bg-background">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h3 className="font-display font-bold text-xs tracking-[0.2em] uppercase mb-2 text-white">
            E STUDIO
          </h3>
          <p className="font-mono text-[9px] text-text-muted uppercase tracking-widest">
            Pushing the boundaries of visual storytelling. © {new Date().getFullYear()}
          </p>
        </div>

        <div className="flex gap-12 font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">
          <div className="flex flex-col gap-2">
            <span className="text-white mb-1">Navigation</span>
            <Link to="/" className="hover:text-white transition-colors">Projects</Link>
            <Link to="/worldview" className="hover:text-white transition-colors">Worldview</Link>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-white mb-1">Legal</span>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

