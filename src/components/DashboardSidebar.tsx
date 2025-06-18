'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiHome, FiFolder, FiDollarSign, FiPlay, FiGrid } from 'react-icons/fi';
import { HomeIcon, ServerIcon, FolderIcon, BoxIcon, BeakerIcon, CreditCardIcon, LogOutIcon, ArrowRightIcon, SparklesIcon } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { format } from 'date-fns';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon
  },
  {
    name: 'Instances',
    href: '/dashboard/instances',
    icon: ServerIcon
  },
  {
    name: 'File Manager',
    href: '/dashboard/files',
    icon: FolderIcon
  },
  {
    name: 'My Apps',
    href: '/dashboard/my-apps',
    icon: BoxIcon
  },
  {
    name: 'Playground',
    href: '/dashboard/playground',
    icon: BeakerIcon
  },
  {
    name: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCardIcon
  }
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { notifications } = useNotificationStore();

  const handleSignOut = () => {
    // Add sign out logic here
    console.log('Signing out...');
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-black border-r border-emerald-500/10">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-emerald-500/10">
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            RunAI
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-none px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center px-3 py-2 rounded-lg group ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-emerald-100 hover:bg-emerald-500/10 hover:text-emerald-400'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 rounded-lg bg-emerald-500/10"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-emerald-400' : 'text-emerald-500 group-hover:text-emerald-400'
                  }`}
                />
                <span className="relative">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Notifications */}
        <div className="flex-1 px-3 py-4 overflow-y-auto border-t border-emerald-500/10">
          <h3 className="text-sm font-semibold text-emerald-400 mb-4">Notifications</h3>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
              >
                <div className="flex items-center gap-2">
                  {notification.type === 'loading' && (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-emerald-500 border-t-transparent" />
                  )}
                  {notification.type === 'success' && (
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  )}
                  {notification.type === 'error' && (
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                  )}
                  <p className="text-sm text-emerald-100">{notification.message}</p>
                </div>
                <p className="text-xs text-emerald-500 mt-1">
                  {format(new Date(notification.timestamp), 'HH:mm')}
                </p>
              </motion.div>
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-emerald-500/50 text-center py-4">
                No notifications
              </p>
            )}
          </div>
        </div>

        {/* Plan and Logout Section */}
        <div className="flex-none px-3 py-4 border-t border-emerald-500/10 space-y-3">
          {/* Current Plan */}
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-white">Hobbyist Plan</span>
              </div>
              <Link 
                href="/dashboard/billing"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Upgrade
                <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>
            <div className="h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-emerald-500 rounded-full" />
            </div>
            <p className="text-xs text-emerald-500 mt-2">75% of monthly usage</p>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className="w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-sm"
          >
            <LogOutIcon className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
} 