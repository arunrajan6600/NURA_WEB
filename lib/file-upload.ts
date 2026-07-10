// File upload utility that automatically chooses the best upload method
// Uses regular upload for files < 5MB, pre-signed URL for larger files

interface UploadOptions {
  file: File;
  token: string;
  apiBaseUrl: string;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  id: string;
  filename: string;
  url: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

const SMALL_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB

export async function uploadFileOptimal({ 
  file, 
  token, 
  apiBaseUrl, 
  onProgress 
}: UploadOptions): Promise<UploadResult> {
  
  if (file.size <= SMALL_FILE_THRESHOLD) {
    // Use regular multipart upload for smaller files
    return uploadFileRegular({ file, token, apiBaseUrl, onProgress });
  } else {
    // Use pre-signed URL for larger files
    return uploadFilePresigned({ file, token, apiBaseUrl, onProgress });
  }
}

async function uploadFileRegular({ 
  file, 
  token, 
  apiBaseUrl, 
  onProgress 
}: UploadOptions): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result.files[0]); // Assuming single file upload
        } catch {
          reject(new Error('Invalid response format'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.open('POST', `${apiBaseUrl}/files/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

async function uploadFilePresigned({ 
  file, 
  token, 
  apiBaseUrl, 
  onProgress 
}: UploadOptions): Promise<UploadResult> {
  
  // Step 1: Get pre-signed URL
  if (onProgress) onProgress(10);
  
  const presignedResponse = await fetch(`${apiBaseUrl}/files/presigned-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  // Get response text once and reuse it
  const responseText = await presignedResponse.text();
  
  if (!presignedResponse.ok) {
    console.error('Pre-signed URL error response:', responseText);
    console.error('Response status:', presignedResponse.status);
    console.error('Response headers:', Object.fromEntries(presignedResponse.headers.entries()));
    
    try {
      const error = JSON.parse(responseText);
      throw new Error(error.error || 'Failed to get upload URL');
    } catch (parseError) {
      // Log the parse error for debugging
      console.error('JSON parse error:', parseError);
      // If it's not JSON, throw the raw response with more context
      throw new Error(`Server error (${presignedResponse.status}): ${responseText}`);
    }
  }

  let presignedData;
  try {
    presignedData = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Invalid JSON response from presigned URL:', responseText);
    console.error('JSON parse error:', parseError);
    console.error('Response status:', presignedResponse.status);
    console.error('Response headers:', Object.fromEntries(presignedResponse.headers.entries()));
    throw new Error(`Invalid response format (${presignedResponse.status}): ${responseText}`);
  }
  if (onProgress) onProgress(20);

  // Step 2: Upload directly to S3
  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        // Progress from 20% to 100%
        const uploadProgress = 20 + (e.loaded / e.total) * 80;
        onProgress(uploadProgress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          id: presignedData.fileId,
          filename: presignedData.filename,
          url: presignedData.url,
          contentType: presignedData.contentType,
          size: presignedData.size,
          uploadedBy: presignedData.uploadedBy,
          createdAt: presignedData.createdAt,
        });
      } else {
        reject(new Error('Failed to upload file to S3'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during S3 upload'));
    });

    xhr.open('PUT', presignedData.uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

export default uploadFileOptimal;
