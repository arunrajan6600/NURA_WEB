"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  FolderOpen, 
  Settings as SettingsIcon, 
  LogOut 
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Posts", href: "/admin/posts", icon: FileText },
    { name: "Files & Storage", href: "/admin/files", icon: FolderOpen },
    { name: "Settings", href: "/admin/settings", icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Mini Admin navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border border-border/80 bg-muted/5 p-4 gap-4">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                asChild
                className="font-mono text-[10px] uppercase gap-1.5 h-8"
              >
                <Link href={item.href}>
                  <Icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              </Button>
            );
          })}
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-border/40 pt-3 md:pt-0">
          <span className="font-mono text-[9px] uppercase text-muted-foreground">
            User: <strong className="text-foreground">{user?.username || 'admin'}</strong>
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="font-mono text-[10px] uppercase text-destructive hover:text-destructive hover:bg-destructive/15 h-8 gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            logout
          </Button>
        </div>
      </div>

      <div className="min-h-[500px]">
        {children}
      </div>
    </div>
  );
}
