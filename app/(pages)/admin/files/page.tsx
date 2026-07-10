'use client';

import React from 'react';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { FileBrowser } from '@/components/files/file-browser';

export default function AdminFilesPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <FileBrowser />
      </ProtectedRoute>
    </AuthProvider>
  );
}
