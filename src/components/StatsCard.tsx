import React, { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, change, color = '#25D366' }) => {
  return (
    <div 
      className="bg-[rgba(255,255,255,0.05)] backdrop-blur-md rounded-2xl p-6 border border-[rgba(255,255,255,0.08)] transition-all duration-300 hover:scale-[1.02]"
      style={{ boxShadow: `0 4px 20px rgba(0,0,0,0.2), inset 0 0 20px ${color}10` }}
      id={`stats-card-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[rgba(255,255,255,0.6)] font-medium text-sm">{title}</h3>
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold text-white">{value}</div>
        {change && (
          <div className="text-sm font-medium" style={{ color: change.startsWith('+') ? '#25D366' : '#EF4444' }}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
