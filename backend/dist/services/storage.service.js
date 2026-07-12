"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.StorageService = void 0;
const supabase_1 = require("../config/supabase");
const env_1 = require("../config/env");
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const renamesFilePath = path_1.default.join(__dirname, '../../data/file-renames.json');
class StorageService {
    get bucketName() {
        return env_1.env.SUPABASE_STORAGE_BUCKET;
    }
    /**
     * Initializes the Supabase Storage bucket.
     * Creates the bucket with public access if it does not exist.
     */
    async initializeBucket() {
        try {
            console.log(`🔌 Checking if Supabase Storage bucket "${this.bucketName}" exists...`);
            const { data: buckets, error } = await supabase_1.supabase.storage.listBuckets();
            if (error) {
                throw error;
            }
            const exists = buckets?.some((b) => b.name === this.bucketName);
            if (!exists) {
                console.log(`🗄️  Bucket "${this.bucketName}" not found. Creating public bucket...`);
                const { error: createError } = await supabase_1.supabase.storage.createBucket(this.bucketName, {
                    public: true,
                    fileSizeLimit: 52428800, // 50MB
                });
                if (createError) {
                    throw createError;
                }
                console.log(`✅ Bucket "${this.bucketName}" created successfully.`);
            }
            else {
                console.log(`✅ Bucket "${this.bucketName}" is ready.`);
            }
        }
        catch (err) {
            console.error(`❌ Failed to initialize Supabase Storage bucket:`, err.message || err);
        }
    }
    /**
     * Lists all files in the bucket.
     */
    async list() {
        const { data: files, error } = await supabase_1.supabase.storage.from(this.bucketName).list('', {
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
        let renameRegistry = {};
        if (fs_1.default.existsSync(renamesFilePath)) {
            try {
                renameRegistry = JSON.parse(fs_1.default.readFileSync(renamesFilePath, 'utf-8'));
            }
            catch (err) {
                console.error('Error reading rename registry:', err);
            }
        }
        return files
            .filter((file) => file.name !== '.emptyFolderPlaceholder')
            .map((file) => {
            const publicUrl = supabase_1.supabase.storage.from(this.bucketName).getPublicUrl(file.name).data.publicUrl;
            // Custom metadata stored on Supabase Storage
            const metadata = (file.metadata || {});
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
                size: file.metadata?.size || 0,
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
    async rename(id, newName) {
        const dir = path_1.default.dirname(renamesFilePath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        let renameRegistry = {};
        if (fs_1.default.existsSync(renamesFilePath)) {
            try {
                renameRegistry = JSON.parse(fs_1.default.readFileSync(renamesFilePath, 'utf-8'));
            }
            catch (err) {
                console.error('Error reading rename registry on write:', err);
            }
        }
        renameRegistry[id] = newName;
        fs_1.default.writeFileSync(renamesFilePath, JSON.stringify(renameRegistry, null, 2), 'utf-8');
    }
    /**
     * Performs direct file upload.
     */
    async upload(fileBuffer, originalName, mimeType, username) {
        const fileExtension = originalName.split('.').pop() || '';
        const uniqueKey = `${(0, uuid_1.v4)()}.${fileExtension}`;
        // Upload object to storage bucket
        const { error } = await supabase_1.supabase.storage.from(this.bucketName).upload(uniqueKey, fileBuffer, {
            contentType: mimeType,
            duplex: 'half',
            upsert: false,
        });
        if (error) {
            throw error;
        }
        // Get public Url
        const publicUrl = supabase_1.supabase.storage.from(this.bucketName).getPublicUrl(uniqueKey).data.publicUrl;
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
    async createSignedUploadUrl(filename, mimeType, size, username) {
        const fileExtension = filename.split('.').pop() || '';
        const uniqueKey = `${(0, uuid_1.v4)()}.${fileExtension}`;
        const { data, error } = await supabase_1.supabase.storage.from(this.bucketName).createSignedUploadUrl(uniqueKey);
        if (error) {
            throw error;
        }
        const publicUrl = supabase_1.supabase.storage.from(this.bucketName).getPublicUrl(uniqueKey).data.publicUrl;
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
    async delete(id) {
        const { error } = await supabase_1.supabase.storage.from(this.bucketName).remove([id]);
        if (error) {
            throw error;
        }
    }
}
exports.StorageService = StorageService;
exports.storageService = new StorageService();
