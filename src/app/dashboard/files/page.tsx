'use client';

import { FileManager } from '@/components/FileManager';

export default function FilesPage() {
  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
          File Manager
        </h1>
        <p className="mt-2 text-gray-400">
          Manage your models, images, and other files
        </p>
      </div>

      <div className="bg-[#1a1b26] rounded-lg overflow-hidden border border-gray-800 h-[calc(100vh-12rem)]">
        <FileManager 
          isOpen={false} 
          onClose={() => {}} 
          bucketName="comfyui-storage"
          containerId="default"
        />
      </div>
    </div>
  );
} 