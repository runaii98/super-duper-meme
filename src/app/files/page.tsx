'use client';

import { FileManager } from '@/components/FileManager';

export default function FileManagerPage() {
  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          File Manager
        </h1>
        <p className="mt-2 text-gray-400">Manage your files and assets</p>
      </div>

      <div className="bg-black/50 border border-emerald-500/10 rounded-lg p-4">
        <FileManager
          isOpen={true}
          onClose={() => {}}
          bucketName="comfyui-storage"
          containerId="default"
        />
      </div>
    </div>
  );
} 