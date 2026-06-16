import { Link, useLocation } from 'react-router-dom';
import canaryPng from '../assets/code_canary.png';

const Header = () => {
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isExplorer = location.pathname === '/explorer';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/[0.03]">
      <div className="max-w-7xl mx-auto px-4 sm:px-10 h-16 flex items-center justify-between">
        
        {/* Brand & Navigation */}
        <div className="flex items-center w-full justify-between sm:justify-start sm:gap-8">
          <Link to="/" className="group flex items-center gap-2 no-underline shrink-0">
            <div className="w-8 h-8 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:rotate-[22deg] origin-[75%_75%]">
              <img 
                src={canaryPng} 
                alt="Code Canary" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="text-sm font-black text-white uppercase tracking-tight">
              Code <span className="text-neutral-500">Canary</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="cc-header-divider" aria-hidden="true" />

          {/* Primary Nav Tabs - Visible on all screen sizes */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link 
              to="/" 
              className={`text-[11px] sm:text-[12px] font-black uppercase tracking-widest px-2.5 sm:px-4 py-2 transition-all duration-300 ${
                isHome ? 'text-white' : 'text-neutral-500 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/explorer" 
              className={`text-[11px] sm:text-[12px] font-black uppercase tracking-widest px-2.5 sm:px-4 py-2 transition-all duration-300 ${
                isExplorer ? 'text-white' : 'text-neutral-500 hover:text-white'
              }`}
            >
              Explorer
            </Link>
          </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
