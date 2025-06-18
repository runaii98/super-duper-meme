import axios from 'axios';

export interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  path: string;
}

export interface FileManagerResponse {
  success: boolean;
  data: FileItem[];
  error?: string;
}

export class FileManagerService {
  private bucketName: string;

  constructor(bucketName: string) {
    this.bucketName = bucketName;
  }

  async listFiles(path: string): Promise<FileManagerResponse> {
    try {
      const response = await fetch(`/api/files/${this.bucketName}?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      return {
        success: true,
        data: data.files.map((file: any) => ({
          ...file,
          modified: new Date(file.modified)
        }))
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to list files'
      };
    }
  }

  async uploadFile(path: string, file: File): Promise<FileManagerResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/files/${this.bucketName}/upload?path=${encodeURIComponent(path)}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      return {
        success: true,
        data: [data]
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to upload file'
      };
    }
  }

  async downloadFile(path: string): Promise<Blob> {
    const response = await fetch(`/api/files/${this.bucketName}/download?path=${encodeURIComponent(path)}`);
    if (!response.ok) {
      throw new Error('Failed to download file');
    }
    return response.blob();
  }

  async deleteFile(path: string): Promise<boolean> {
    try {
      await fetch(`/api/files/${this.bucketName}/delete?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      return false;
    }
  }
} 