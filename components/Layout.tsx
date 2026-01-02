import React, { ReactNode } from 'react';
import { NAV_ITEMS } from '../constants';
import { Menu, X, LogOut, User, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === 'dashboard' && location.pathname === '/') return true;
    return location.pathname === `/${path}`;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">S</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                SmartSpend
                </h1>
            </div>
            <button className="lg:hidden p-2 rounded-md hover:bg-slate-100 text-slate-500" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-8 py-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Menu</p>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.id);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.id === 'dashboard' ? '/' : `/${item.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    group flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 relative
                    ${active 
                      ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4 text-indigo-400" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
              {user?.avatar ? (
                 <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mr-3 shadow-md border-2 border-white" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3 shadow-md border-2 border-white">
                    {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button onClick={logout} className="p-1 hover:bg-red-50 rounded-full transition-colors">
                 <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white/80 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex items-center justify-between z-30 sticky top-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-lg active:bg-slate-100">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <span className="font-bold text-slate-900 text-lg">SmartSpend</span>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200">
             {user?.name?.charAt(0) || 'U'}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;