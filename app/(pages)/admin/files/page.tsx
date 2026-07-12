'use client';

import React from 'react';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { FileBrowser } from '@/components/files/file-browser';
import { AdminLayout } from '@/components/layout/admin-layout';

export default function AdminFilesPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="container mx-auto p-6">
          <AdminLayout>
            <FileBrowser />
          </AdminLayout>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
