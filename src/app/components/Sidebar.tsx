import { Link, useLocation } from 'react-router';
import { Home, Upload, Eye, Copy, Users, MapPin, Calendar, Settings } from 'lucide-react';

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Import', href: '/import', icon: Upload },
  { name: 'Review', href: '/review', icon: Eye },
  { name: 'Duplicates', href: '/duplicates', icon: Copy },
  { name: 'People', href: '/people', icon: Users },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Occasions', href: '/occasions', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gray-50">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Photo Organizer</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="text-xs text-gray-500">
          <p className="font-semibold">Private AI Photo Organizer</p>
          <p className="mt-1">All processing happens locally</p>
        </div>
      </div>
    </div>
  );
}
