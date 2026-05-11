import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isLoggedIn = currentUser !== null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const links = [
    { path: '/projects', label: 'Projects' },
    { path: '/worldview', label: 'Worldview' },
    { path: '/about', label: 'About' },
  ];

  return (
    <nav className="absolute top-0 left-0 w-full z-50 bg-transparent text-white pt-6">
      <div className="w-full mx-auto flex justify-between items-center p-4 md:px-16 relative z-50">
        <Link to="/" className="font-display font-bold text-xs tracking-[0.2em] uppercase hover:text-white/80 transition-colors">
          E STUDIO
        </Link>

        {/* --- 桌面端导航 --- */}
        <div className="hidden md:flex items-center gap-12">
          {/* 1. 常规页面链接 */}
          <div className="flex gap-12">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                  location.pathname.startsWith(link.path) ? 'text-white' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* 2. 账号与权限控制区 */}
          <div className="flex items-center gap-6 border-l border-white/10 pl-12 ml-2">
            {isLoggedIn ? (
              <>
                {/* 收藏入口 — 所有登录用户可见 */}
                <Link
                  to="/bookmarks"
                  className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                    location.pathname === '/bookmarks' ? 'text-white' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Bookmark size={11} />
                  Bookmarks
                </Link>

                {/* 管理后台 — 仅超级管理员和管理员可见 */}
                {(currentUser?.permissions?.[0] === 'super_admin' || currentUser?.permissions?.[0] === 'admin') && (
                  <Link
                    to="/admin"
                    className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                      location.pathname === '/admin' ? 'text-white' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                  location.pathname === '/login' ? 'text-white' : 'text-zinc-500 hover:text-white'
                }`}
              >
                Login
              </Link>
            )}
          </div>
        </div>

        <button
          className="md:hidden text-zinc-500 hover:text-white p-2 -mr-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* --- 移动端导航 --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-full left-0 right-0 bg-[#030303] border-b border-white/10 shadow-2xl md:hidden overflow-hidden"
          >
            <div className="flex flex-col px-6 py-8 gap-6">
              {/* 常规链接 */}
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`font-mono text-sm uppercase tracking-[0.2em] ${
                    location.pathname.startsWith(link.path) ? 'text-white' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* 账户功能分隔线 */}
              <div className="h-[1px] w-full bg-white/10 my-2"></div>

              {/* 账户链接 */}
              {isLoggedIn ? (
                <>
                  <Link
                    to="/bookmarks"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] ${
                      location.pathname === '/bookmarks' ? 'text-white' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    <Bookmark size={14} />
                    Bookmarks
                  </Link>
                  {(currentUser?.permissions?.[0] === 'super_admin' || currentUser?.permissions?.[0] === 'admin') && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className={`font-mono text-sm uppercase tracking-[0.2em] ${
                        location.pathname === '/admin' ? 'text-white' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="text-left font-mono text-sm uppercase tracking-[0.2em] text-zinc-500 hover:text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className={`font-mono text-sm uppercase tracking-[0.2em] ${
                    location.pathname === '/login' ? 'text-white' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
