import React, { useState } from 'react';
import { cn } from './ui';
import {
  LayoutDashboard, Cpu, GitCompare, BookOpen, Map, Zap,
  History, Info, BarChart3, Terminal, ChevronLeft,
  ChevronRight, Sun, Moon, Rocket
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'simulator', label: 'Live Simulator', icon: Zap },
  { id: 'comparison', label: 'Comparison', icon: BarChart3 },
  { id: 'architecture', label: 'Architecture', icon: Map },
  { id: 'how-it-works', label: 'How It Works', icon: BookOpen },
  { id: 'guide', label: 'Project Guide', icon: BookOpen },
  { id: 'applications', label: 'Applications', icon: Cpu },
  { id: 'history', label: 'Experiment History', icon: History },
  { id: 'about', label: 'About', icon: Info },
];

export default function Layout({ children, currentPage, onNavigate, darkMode, onToggleDarkMode }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-3 border-b h-14">
          <Cpu className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold tracking-tight whitespace-nowrap">IPC Lab</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2 text-sm transition-colors',
                  active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  collapsed && 'justify-center px-2'
                )}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="border-t p-2 flex flex-col gap-1">
          <button onClick={onToggleDarkMode}
            className={cn('flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-muted-foreground', collapsed && 'justify-center')}>
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && <span>{darkMode ? 'Light' : 'Dark'} Mode</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)}
            className={cn('flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-muted-foreground', collapsed && 'justify-center')}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
