import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
const TopNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [{
    path: '/',
    icon: BarChart3,
    label: 'Summary'
  }, {
    path: '/gifts',
    icon: Package,
    label: 'Gifts'
  }, {
    path: '/settings',
    icon: Settings,
    label: 'Settings'
  }];
  return <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 max-w-7xl mx-auto">
        {/* App Logo/Name */}
        <div className="flex items-center gap-2 mr-6">
          <img src="/lovable-uploads/e63fed0e-0c0e-4abc-ae15-113c1666560d.png" alt="Elfie logo" loading="eager" decoding="async" onError={e => {
          e.currentTarget.src = '/placeholder.svg';
        }} className="h-12 w-12 object-contain" />
          <span className="font-bold text-lg hidden sm:inline">Elfie</span>
          <span className="font-bold text-sm sm:hidden">Elfie</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return <Button key={item.path} variant={isActive ? "secondary" : "ghost"} size="sm" onClick={() => navigate(item.path)} className={cn("h-10 px-3 text-sm", isActive && "bg-accent text-accent-foreground font-medium")}>
                <Icon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>;
        })}
        </nav>
      </div>
    </header>;
};
export default TopNavigation;