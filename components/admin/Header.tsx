'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { apiClient } from '@/lib/api/client';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const router = useRouter();

  const handleLogout = () => {
    apiClient.clearToken();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Admin Dashboard</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* User Info */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <User className="h-4 w-4" />
          <span>Admin</span>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
