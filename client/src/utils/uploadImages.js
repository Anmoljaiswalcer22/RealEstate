import { refreshSession } from '../api/client';

export const MAX_IMAGES = 6;
export const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

// Frontend check = instant feedback only. The server checks again (it can't trust this).
export function validateImageFile(file) {
  if (!file.type.startsWith('image/')) return `${file.name} is not an image`;
  if (file.size > MAX_SIZE) return `${file.name} is larger than 2 MB`;
  return null;
}

function sendFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(); // XHR (not fetch) because it reports upload progress
    xhr.open('POST', '/api/upload');
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON response */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data.urls[0]);
      else {
        const err = new Error(data.message || 'Upload failed');
        err.status = xhr.status;
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));

    const form = new FormData(); // multipart/form-data
    form.append('images', file);
    xhr.send(form);
  });
}

// Uploads ONE file, refreshing the session once if the access token expired
export async function uploadImage(file, onProgress) {
  try {
    return await sendFile(file, onProgress);
  } catch (err) {
    if (err.status === 401 && (await refreshSession())) return sendFile(file, onProgress);
    throw err;
  }
}

// Uploads all files AT THE SAME TIME (Promise.all) instead of one after another
export function uploadImages(files, onProgress) {
  return Promise.all(files.map((file, i) => uploadImage(file, (pct) => onProgress?.(i, pct))));
}
