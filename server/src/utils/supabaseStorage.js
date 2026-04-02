import { getSupabaseAdmin } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'documents';

/**
 * Upload file to Supabase Storage
 * @param {string} filePath - Local file path
 * @param {string} originalName - Original filename
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<{path: string, url: string, fileName: string}>}
 */
export async function uploadFileToSupabase(filePath, originalName, userId) {
  try {
    const supabase = getSupabaseAdmin();

    // Generate unique filename
    const fileExt = path.extname(originalName);
    const fileName = `${uuidv4()}${fileExt}`;

    // Organize files by user ID
    const storagePath = `${userId}/${fileName}`;

    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: getMimeType(fileExt),
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    console.log(`✅ File uploaded to Supabase Storage: ${storagePath}`);

    return {
      path: storagePath,
      url: urlData.publicUrl,
      fileName: fileName
    };
  } catch (err) {
    console.error('Supabase Storage upload failed:', err.message);
    throw err;
  }
}

/**
 * Delete file from Supabase Storage
 * @param {string} storagePath - Path in storage
 */
export async function deleteFileFromSupabase(storagePath) {
  try {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .storage
      .from(bucketName)
      .remove([storagePath]);

    if (error) throw error;

    console.log(`✅ File deleted from Supabase Storage: ${storagePath}`);
  } catch (err) {
    console.error('Supabase Storage delete failed:', err.message);
    throw err;
  }
}

/**
 * Get signed URL for private file access
 * @param {string} storagePath - Path in storage
 * @param {number} expiresIn - Expiry in seconds (default 3600 = 1 hour)
 */
export async function getSignedUrl(storagePath, expiresIn = 3600) {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(storagePath, expiresIn);

    if (error) throw error;

    return data.signedUrl;
  } catch (err) {
    console.error('Failed to generate signed URL:', err.message);
    throw err;
  }
}

/**
 * Get MIME type from file extension
 * @param {string} ext - File extension
 * @returns {string} - MIME type
 */
function getMimeType(ext) {
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.tex': 'application/x-tex',
    '.latex': 'application/x-latex',
    '.rtf': 'application/rtf',
    '.json': 'application/json',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}
