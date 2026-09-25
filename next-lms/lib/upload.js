import fs from 'fs';
import path from 'path';
import { uploadToS3 } from './s3Service';

/**
 * Handle image file from Next.js Request FormData
 * @param {File|null} file 
 * @returns {Promise<string>} Uploaded file URL or path
 */
export async function handleFileUpload(file) {
  if (!file || !(file instanceof Blob) || file.size === 0) {
    return '';
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = file.name || 'image.jpg';
  const mimeType = file.type || 'image/jpeg';

  // Use S3 with local fallback
  return await uploadToS3(buffer, fileName, mimeType);
}

/**
 * Safely delete local upload file
 * @param {string} filePath 
 */
export function deleteLocalFile(filePath) {
  try {
    if (!filePath || !filePath.startsWith('/uploads/')) return;
    const localPath = path.join(process.cwd(), 'public', filePath);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch (err) {
    console.error('Error deleting local file:', err.message);
  }
}
