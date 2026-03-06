import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DocumentMagnifyingGlassIcon, HomeIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

export const NavBar: React.FC = () => {
  const location = useLocation();
  const navItems = [
    { to: '/', label: 'Dashboard', icon: HomeIcon },
    { to: '/cases', label: 'Cases', icon: DocumentMagnifyingGlassIcon },
    { to: '/cases/new', label: 'New Case', icon: PlusCircleIcon },
  ];

  return (
    <header className="bg-[#1e3a5f] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-blue-400 text-white font-bold px-2.5 py-1 rounded text-sm">AP</div>
            <span className="font-semibold text-lg tracking-tight">Exception Processing</span>
          </div>
          <nav className="flex gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
