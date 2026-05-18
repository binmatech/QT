import { motion, AnimatePresence } from "motion/react";
import { Search, Menu, User, Bell, LogOut, Settings } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { signInWithGoogle, logout } from "../lib/firebase";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const ADMIN_EMAIL = "subairnurudeen20@gmail.com";
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 h-16 flex items-center px-6 md:px-12"
    >
      <div className="flex items-center gap-12 w-full max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-1 cursor-pointer group">
          <span className="font-editorial font-black text-2xl tracking-tighter uppercase">Quotients Africa<span className="text-brand-accent">.</span></span>
        </Link>

        <div className="hidden lg:flex items-center gap-8 flex-1">
          {[
            { name: "Trending", path: "/trending" },
            { name: "Technology", path: "/category/Technology" },
            { name: "FinTech", path: "/category/FinTech" },
            { name: "Business", path: "/category/Business" },
            { name: "Markets", path: "/category/Markets" },
            { name: "Events", path: "/events" }
          ].map((item) => (
            <Link 
              key={item.name} 
              to={item.path} 
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-black transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-6 ml-auto">
          <button className="p-2 hover:bg-slate-50 rounded-full transition-colors hidden sm:flex">
            <Search size={18} className="text-slate-600" />
          </button>
          <div className="h-4 w-px bg-slate-200 hidden md:block" />
          
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1 pr-3 hover:bg-slate-50 rounded-full transition-colors border border-transparent hover:border-slate-100"
              >
                <img src={user.photoURL || ""} alt={user.displayName || ""} className="w-8 h-8 rounded-full border border-slate-200" />
                <span className="text-xs font-bold uppercase tracking-widest hidden md:block">{user.displayName?.split(' ')[0]}</span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-xl py-2 z-50"
                  >
                    {isAdmin && (
                      <Link 
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-brand-accent hover:bg-slate-50 transition-colors uppercase tracking-widest border-b border-slate-100"
                      >
                        <Settings size={16} />
                        Admin Panel
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={() => signInWithGoogle()}
              className="bg-black text-white p-2.5 hover:bg-brand-accent transition-colors flex items-center justify-center rounded-sm"
              aria-label="Sign In"
            >
              <User size={18} />
            </button>
          )}

          <button className="lg:hidden p-2 hover:bg-slate-50 rounded-full transition-colors">
            <Menu size={20} className="text-slate-600" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
