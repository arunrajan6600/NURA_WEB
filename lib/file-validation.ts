export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'text/*'
  ];
  
  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
  }
  
  // Check file type
  const isAllowed = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });
  
  if (!isAllowed) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  return { valid: true };
}
