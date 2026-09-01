import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Search, MessageSquare, Users, Megaphone, Settings, Zap
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prospector', icon: Search, label: 'Prospectar' },
  { to: '/chat', icon: MessageSquare, label: 'Chat / CRM' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/campaigns', icon: Megaphone, label: 'Campanhas' },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={16} color="#000" fill="#000" />
        </div>
        <span className="sidebar-logo-text">WPP Prospector</span>
        <span className="sidebar-logo-badge">PRO</span>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Menu</span>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={15} className="nav-icon" />
            {label}
          </NavLink>
        ))}

        <span className="nav-section-label" style={{ marginTop: 'auto' }}>Sistema</span>
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Settings size={15} className="nav-icon" />
          Configurações
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span className="online-dot" />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Sistema Online</span>
          <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>v1.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
