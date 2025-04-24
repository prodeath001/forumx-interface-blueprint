import { v2 as cloudinary } from 'cloudinary';

// Backend API URL
const API_URL = 'http://localhost:5001/api/cloudinary';

// Types
export type UploadResponse = {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  resourceType: 'image' | 'video';
};

export type CloudinaryUploadOptions = {
  folder?: string;
  resourceType?: 'image' | 'video' | 'auto';
  tags?: string[];
  overwrite?: boolean;
};

class CloudinaryService {
  private defaultOptions: CloudinaryUploadOptions = {
    folder: 'forumx-conference',
    resourceType: 'auto',
    overwrite: true
  };

  /**
   * Upload a file from a URL
   */
  public async uploadFromUrl(
    url: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<UploadResponse> {
    try {
      const response = await fetch(`${API_URL}/upload-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data: url,
          folder: options.folder || this.defaultOptions.folder,
          resourceType: options.resourceType || this.defaultOptions.resourceType
        })
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading to Cloudinary from URL:', error);
      throw error;
    }
  }

  /**
   * Upload a file from a base64 string
   */
  public async uploadFromBase64(
    base64Data: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<UploadResponse> {
    try {
      const response = await fetch(`${API_URL}/upload-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data,
          folder: options.folder || this.defaultOptions.folder,
          resourceType: options.resourceType || this.defaultOptions.resourceType
        })
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading to Cloudinary from base64:', error);
      throw error;
    }
  }

  /**
   * Upload a file from a blob/file
   */
  public async uploadFromBlob(
    file: File,
    options: CloudinaryUploadOptions = {}
  ): Promise<UploadResponse> {
    try {
      // For conference-specific uploads
      const conferenceId = options.folder?.includes('forumx-conference/') 
        ? options.folder.split('/')[1] 
        : null;
      
      const type = options.folder?.includes('/') 
        ? options.folder.split('/')[2] 
        : null;
      
      // Use specific conference route if available
      const url = conferenceId && type 
        ? `${API_URL}/upload/${conferenceId}/${type}`
        : `${API_URL}/upload`;
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading to Cloudinary from blob:', error);
      throw error;
    }
  }

  /**
   * Upload a media stream recording (video/audio)
   */
  public async uploadMediaRecording(
    stream: MediaStream,
    duration: number = 10000, // Default 10 seconds
    options: CloudinaryUploadOptions = {}
  ): Promise<UploadResponse> {
    try {
      // Create a MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      // Set up recording promise
      const recordingPromise = new Promise<Blob>((resolve, reject) => {
        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          const mimeType = mediaRecorder.mimeType;
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };
        
        mediaRecorder.onerror = (e) => {
          reject(e);
        };
      });
      
      // Start recording
      mediaRecorder.start();
      
      // Stop after specified duration
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, duration);
      
      // Wait for recording to complete
      const blob = await recordingPromise;
      
      // Convert blob to File
      const file = new File([blob], `recording-${Date.now()}.${blob.type.includes('video') ? 'mp4' : 'webm'}`, {
        type: blob.type
      });
      
      // Upload the file
      return this.uploadFromBlob(file, options);
    } catch (error) {
      console.error('Error recording and uploading media stream:', error);
      throw error;
    }
  }

  /**
   * Delete a resource by public ID
   */
  public async delete(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/delete/${publicId}?resourceType=${resourceType}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Generate a signed URL for the resource with security
   */
  public generateSecureUrl(publicId: string, options: { 
    resourceType?: 'image' | 'video';
    transformation?: string;
  } = {}): string {
    return `${options.resourceType || 'image'}/upload/${options.transformation || ''}/${publicId}`;
  }
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();
export default cloudinaryService; 