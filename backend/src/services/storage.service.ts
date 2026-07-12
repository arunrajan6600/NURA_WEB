import { supabase } from '../config/supabase';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const renamesFilePath = path.join(__dirname, '../../data/file-renames.json');

export interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  s3Key: string;
  s3Url: string;
  uploadedAt: string;
  uploadedBy: string;
  isActive: boolean;
}

export interface UploadResult {
  id: string;
  filename: string;
  url: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface SignedUrlResult {
  uploadUrl: string;
  fileId: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
  url: string;
}

export class StorageService {
  private get bucketName(): string {
    return env.SUPABASE_STORAGE_BUCKET;
  }

  /**
   * Initializes the Supabase Storage bucket.
   * Creates the bucket with public access if it does not exist.
   */
  public async initializeBucket(): Promise<void> {
    try {
      console.log(`🔌 Checking if Supabase Storage bucket "${this.bucketName}" exists...`);
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        throw error;
      }

      const exists = buckets?.some((b) => b.name === this.bucketName);

      if (!exists) {
        console.log(`🗄️  Bucket "${this.bucketName}" not found. Creating public bucket...`);
        const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
          public: true,
          fileSizeLimit: 52428800, // 50MB
        });

        if (createError) {
          throw createError;
        }
        console.log(`✅ Bucket "${this.bucketName}" created successfully.`);
      } else {
        console.log(`✅ Bucket "${this.bucketName}" is ready.`);
      }
    } catch (err: any) {
      console.error(`❌ Failed to initialize Supabase Storage bucket:`, err.message || err);
    }
  }

  /**
   * Lists all files in the bucket.
   */
  public async list(): Promise<FileRecord[]> {
    const { data: files, error } = await supabase.storage.from(this.bucketName).list('', {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      throw error;
    }

    if (!files) {
      return [];
    }

    // Load local file renames registry
    let renameRegistry: Record<string, string> = {};
    if (fs.existsSync(renamesFilePath)) {
      try {
        renameRegistry = JSON.parse(fs.readFileSync(renamesFilePath, 'utf-8'));
      } catch (err) {
        console.error('Error reading rename registry:', err);
      }
    }

    return files
      .filter((file) => file.name !== '.emptyFolderPlaceholder')
      .map((file) => {
        const publicUrl = supabase.storage.from(this.bucketName).getPublicUrl(file.name).data.publicUrl;

        // Custom metadata stored on Supabase Storage
        const metadata = (file.metadata || {}) as any;
        let originalName = metadata.original_filename || metadata.originalName || file.name;
        
        // If file has been renamed in local registry, override the original name
        if (renameRegistry[file.name]) {
          originalName = renameRegistry[file.name];
        }

        const uploadedBy = metadata.uploaded_by || metadata.uploadedBy || 'admin';
        const mimeType = metadata.mimetype || metadata.contentType || 'application/octet-stream';

        return {
          id: file.name,
          filename: file.name,
          originalName,
          size: (file.metadata as any)?.size || 0,
          mimeType,
          s3Key: file.name,
          s3Url: publicUrl,
          uploadedAt: file.created_at || new Date().toISOString(),
          uploadedBy,
          isActive: true,
        };
      });
  }

  /**
   * Renames a file in local registry.
   */
  public async rename(id: string, newName: string): Promise<void> {
    const dir = path.dirname(renamesFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let renameRegistry: Record<string, string> = {};
    if (fs.existsSync(renamesFilePath)) {
      try {
        renameRegistry = JSON.parse(fs.readFileSync(renamesFilePath, 'utf-8'));
      } catch (err) {
        console.error('Error reading rename registry on write:', err);
      }
    }

    renameRegistry[id] = newName;
    fs.writeFileSync(renamesFilePath, JSON.stringify(renameRegistry, null, 2), 'utf-8');
  }

  /**
   * Performs direct file upload.
   */
  public async upload(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    username: string
  ): Promise<UploadResult> {
    const fileExtension = originalName.split('.').pop() || '';
    const uniqueKey = `${uuidv4()}.${fileExtension}`;

    // Upload object to storage bucket
    const { error } = await supabase.storage.from(this.bucketName).upload(uniqueKey, fileBuffer, {
      contentType: mimeType,
      duplex: 'half',
      upsert: false,
    });

    if (error) {
      throw error;
    }

    // Get public Url
    const publicUrl = supabase.storage.from(this.bucketName).getPublicUrl(uniqueKey).data.publicUrl;

    // Supabase metadata is set post-upload on certain providers or via custom headers.
    // For general compatibility, we return the upload result schema directly.
    return {
      id: uniqueKey,
      filename: originalName,
      url: publicUrl,
      contentType: mimeType,
      size: fileBuffer.length,
      uploadedBy: username,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a signed upload URL for client-side uploads.
   */
  public async createSignedUploadUrl(
    filename: string,
    mimeType: string,
    size: number,
    username: string
  ): Promise<SignedUrlResult> {
    const fileExtension = filename.split('.').pop() || '';
    const uniqueKey = `${uuidv4()}.${fileExtension}`;

    const { data, error } = await supabase.storage.from(this.bucketName).createSignedUploadUrl(uniqueKey);

    if (error) {
      throw error;
    }

    const publicUrl = supabase.storage.from(this.bucketName).getPublicUrl(uniqueKey).data.publicUrl;

    return {
      uploadUrl: data.signedUrl,
      fileId: uniqueKey,
      filename,
      contentType: mimeType,
      size,
      uploadedBy: username,
      createdAt: new Date().toISOString(),
      url: publicUrl,
    };
  }

  /**
   * Hard-deletes a file from the bucket.
   */
  public async delete(id: string): Promise<void> {
    const { error } = await supabase.storage.from(this.bucketName).remove([id]);

    if (error) {
      throw error;
    }
  }
}

export const storageService = new StorageService();
