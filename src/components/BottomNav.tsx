import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, MessageSquare, Users, Settings } from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prospector', icon: Search, label: 'Prospectar' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/settings', icon: Settings, label: 'Config' },
];

const BottomNav = () => (
  <nav className="bottom-nav">
    {NAV.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Icon size={20} />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
