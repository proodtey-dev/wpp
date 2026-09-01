import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Users, Send, Settings, MessageSquare, Menu, X } from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/prospector', label: 'Prospectar', icon: Search },
    { to: '/chat', label: 'Chat / CRM', icon: MessageSquare },
    { to: '/leads', label: 'Leads', icon: Users },
    { to: '/campaigns', label: 'Campanhas', icon: Send },
    { to: '/settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Mobile toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1a1a2e] border border-[rgba(255,255,255,0.08)] rounded-lg text-white"
        onClick={() => setIsOpen(!isOpen)}
        id="mobile-menu-btn"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-[#0a0a0f]/90 backdrop-blur-md border-r border-[rgba(255,255,255,0.08)] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">WPP Prospector</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                id={`nav-${link.label.toLowerCase().replace(/\s+\/\s+/g, '-')}`}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-[rgba(37,211,102,0.1)] text-[#25D366] font-medium' 
                      : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-6 text-center text-xs text-[rgba(255,255,255,0.4)]">
          Versão 1.0.0
        </div>
      </div>
    </>
  );
};

export default Sidebar;
