"use client";

import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminLayout } from "@/components/layout/admin-layout";
import { postsApi } from "@/lib/posts-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Globe, 
  Share2, 
  Search, 
  Mail, 
  Loader2, 
  Save, 
  AlertCircle,
  Upload,
  FileDown,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface SettingsData {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  theme: string;
  socialTwitter: string;
  socialLinkedin: string;
  socialGithub: string;
  seoTitle: string;
  seoDescription: string;
  contactEmail: string;
  analyticsId: string;
  [key: string]: string;
}

export default function AdminSettingsPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="container mx-auto p-6">
          <AdminLayout>
            <SettingsContent />
          </AdminLayout>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

function SettingsContent() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<SettingsData>({
    siteName: "",
    logoUrl: "",
    faviconUrl: "",
    theme: "system",
    socialTwitter: "",
    socialLinkedin: "",
    socialGithub: "",
    seoTitle: "",
    seoDescription: "",
    contactEmail: "",
    analyticsId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) {
      postsApi.setAuthToken(token);
    }
  }, [token]);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await postsApi.getSettings();
        if (res.success && res.data) {
          setSettings(prev => ({ ...prev, ...(res.data as SettingsData) }));
        }
      } catch {
        toast.error("Failed to retrieve site configuration");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Updating configurations…");
    try {
      const res = await postsApi.updateSettings(settings);
      if (res.success) {
        toast.success("Site configuration saved successfully", { id: toastId });
      } else {
        toast.error(res.error || "Failed to update configurations", { id: toastId });
      }
    } catch {
      toast.error("Network error while saving settings", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="font-mono text-xs uppercase text-muted-foreground">Loading settings…</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground font-mono text-xs uppercase mt-1">
            Global site variables & configurations
          </p>
        </div>
        <Button type="submit" disabled={saving} className="font-mono text-xs uppercase gap-1.5 h-9 bg-green-600 hover:bg-green-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save configs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Site Details Card */}
        <Card className="border-border bg-background">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Site Details
            </CardTitle>
            <CardDescription className="font-mono text-[9px] uppercase">Identity & visuals</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="siteName" className="font-mono text-[10px] uppercase text-muted-foreground">Site Name</label>
              <Input
                id="siteName"
                name="siteName"
                value={settings.siteName}
                onChange={handleInputChange}
                className="font-mono text-xs"
                placeholder="e.g. Arun Nura"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="logoUrl" className="font-mono text-[10px] uppercase text-muted-foreground">Logo Asset Path / URL</label>
              <Input
                id="logoUrl"
                name="logoUrl"
                value={settings.logoUrl}
                onChange={handleInputChange}
                className="font-mono text-xs"
                placeholder="e.g. /logo.svg"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="faviconUrl" className="font-mono text-[10px] uppercase text-muted-foreground">Favicon Path / URL</label>
              <Input
                id="faviconUrl"
                name="faviconUrl"
                value={settings.faviconUrl}
                onChange={handleInputChange}
                className="font-mono text-xs"
                placeholder="e.g. /favicon.ico"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="theme" className="font-mono text-[10px] uppercase text-muted-foreground">Default Color Theme</label>
              <select
                id="theme"
                name="theme"
                value={settings.theme}
                onChange={handleInputChange}
                className="w-full font-mono text-xs border border-border bg-background px-3 py-2 outline-none rounded-md"
              >
                <option value="system">System Default</option>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* SEO Configuration Card */}
        <Card className="border-border bg-background">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              SEO Defaults
            </CardTitle>
            <CardDescription className="font-mono text-[9px] uppercase">Search engines metadata</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="seoTitle" className="font-mono text-[10px] uppercase text-muted-foreground">Default Page Title Template</label>
              <Input
                id="seoTitle"
                name="seoTitle"
                value={settings.seoTitle}
                onChange={handleInputChange}
                className="font-mono text-xs"
                placeholder="e.g. Arun Nura | Multi-disciplinary Art Practitioner"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="seoDescription" className="font-mono text-[10px] uppercase text-muted-foreground">Default Page Meta Description</label>
              <Textarea
                id="seoDescription"
                name="seoDescription"
                value={settings.seoDescription}
                onChange={handleInputChange}
                className="font-mono text-xs min-h-[90px]"
                placeholder="Describe your site for crawlers…"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="analyticsId" className="font-mono text-[10px] uppercase text-muted-foreground">Google Analytics Measurement ID</label>
              <Input
                id="analyticsId"
                name="analyticsId"
                value={settings.analyticsId}
                onChange={handleInputChange}
                className="font-mono text-xs"
                placeholder="e.g. G-XXXXXXX"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Social Links */}
        <Card className="border-border bg-background">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              Social Accounts
            </CardTitle>
            <CardDescription className="font-mono text-[9px] uppercase">Networks connection</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="socialTwitter" className="font-mono text-[10px] uppercase text-muted-foreground">Twitter / X URL</label>
              <Input
                id="socialTwitter"
                name="socialTwitter"
                value={settings.socialTwitter}
                onChange={handleInputChange}
                className="font-mono text-xs"
                placeholder="https://twitter.com/…"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="socialLinkedin" className="font-mono text-[10px] uppercase text-muted-foreground">LinkedIn URL</label>
              <Input
                id="socialLinkedin"
                name="socialLinkedin"
                value={settings.socialLinkedin}
                onChange={handleInputChange}
                className="font-mono text-xs"
                placeholder="https://linkedin.com/in/…"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="socialGithub" className="font-mono text-[10px] uppercase text-muted-foreground">GitHub URL</label>
              <Input
                id="socialGithub"
                name="socialGithub"
                value={settings.socialGithub}
                onChange={handleInputChange}
                className="font-mono text-xs"
                placeholder="https://github.com/…"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact info card */}
        <Card className="border-border bg-background">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Support & Contact
            </CardTitle>
            <CardDescription className="font-mono text-[9px] uppercase">Direct correspondence</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="contactEmail" className="font-mono text-[10px] uppercase text-muted-foreground">Contact Email Address</label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={handleInputChange}
                className="font-mono text-xs"
                placeholder="e.g. arunrajan6600@gmail.com"
              />
            </div>
            <div className="pt-2">
              <div className="bg-muted/15 border border-border p-3 rounded text-[10px] font-mono uppercase text-muted-foreground leading-normal flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>
                  These configurations apply directly to public layouts, sitemaps, and indexing robots dynamically.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resume/CV upload card */}
        <ResumeUploadCard />
      </div>
    </form>
  );
}

function ResumeUploadCard() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeResume, setActiveResume] = useState<{ filename: string; url: string; createdAt: string } | null>(null);

  const fetchActiveResume = async () => {
    try {
      const res = await postsApi.getResume();
      if (res.success && res.data) {
        setActiveResume(res.data as any);
      }
    } catch (err) {
      console.error("Failed to load CV", err);
    }
  };

  useEffect(() => {
    fetchActiveResume();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading("Uploading resume PDF…");
    try {
      if (token) {
        postsApi.setAuthToken(token);
      }
      const res = await postsApi.uploadResume(file);
      if (res.success) {
        toast.success("Resume updated successfully", { id: toastId });
        setFile(null);
        fetchActiveResume();
      } else {
        toast.error(res.error || "Failed to upload resume", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload resume", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-border bg-background">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileDown className="h-4 w-4 text-muted-foreground" />
          Active Resume / CV
        </CardTitle>
        <CardDescription className="font-mono text-[9px] uppercase">Upload and manage active resume PDF</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {activeResume ? (
          <div className="bg-muted/10 border border-border p-3 rounded flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="font-medium truncate font-mono text-[10px] uppercase">Active: {activeResume.filename}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground font-mono uppercase">
              <span>Uploaded: {new Date(activeResume.createdAt).toLocaleDateString()}</span>
              <a href={activeResume.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline lowercase">
                [view pdf]
              </a>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground font-mono uppercase">No active resume uploaded yet. Using default fallback.</p>
        )}

        <div className="space-y-2">
          <label className="block font-mono text-[10px] uppercase text-muted-foreground">Select New Resume (PDF)</label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="cv-file-input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("cv-file-input")?.click()}
              className="font-mono text-[10px] uppercase h-8"
            >
              Choose PDF
            </Button>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {file ? file.name : "No file chosen"}
            </span>
          </div>
        </div>

        {file && (
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="w-full font-mono text-[10px] uppercase gap-1.5 h-8 bg-primary hover:bg-primary/95 text-primary-foreground"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload Resume
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
