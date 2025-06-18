'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileManagerService, FileItem } from '@/services/FileManagerService';
import { Dialog } from '@headlessui/react';
import {
  FolderIcon,
  DocumentIcon,
  CloudArrowUpIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  Squares2X2Icon,
  FolderPlusIcon,
} from '@heroicons/react/24/outline';
import { formatBytes, formatDate } from '../utils/format';

export interface FileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  bucketName: string;
  containerId: string;
}

// Demo files for initial state
const demoFiles: FileItem[] = [
  {
    name: 'ComfyUI Workflows',
    type: 'directory',
    size: 0,
    modified: new Date(),
    path: '/ComfyUI Workflows'
  },
  {
    name: 'Generated Images',
    type: 'directory',
    size: 0,
    modified: new Date(),
    path: '/Generated Images'
  },
  {
    name: 'stable_diffusion_1.5.ckpt',
    type: 'file',
    size: 7496857600, // 7.5 GB
    modified: new Date(),
    path: '/stable_diffusion_1.5.ckpt'
  },
  {
    name: 'landscape_v1.png',
    type: 'file',
    size: 2097152, // 2 MB
    modified: new Date(),
    path: '/landscape_v1.png'
  },
  {
    name: 'portrait_v2.png',
    type: 'file',
    size: 3145728, // 3 MB
    modified: new Date(),
    path: '/portrait_v2.png'
  }
];

// Storage quota information
const storageQuota = {
  total: 107374182400, // 100 GB
  used: 80740147200,  // 75.2 GB
  available: 26634035200 // 24.8 GB
};

export function FileManager({ isOpen, onClose, bucketName, containerId }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>(demoFiles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const fileManager = new FileManagerService(bucketName);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen, currentPath]);

  useEffect(() => {
    const paths = currentPath.split('/').filter(Boolean);
    setBreadcrumbs(['Home', ...paths]);
  }, [currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fileManager.listFiles(currentPath);
      if (response.success) {
        // For demo purposes, only show demo files at root
        setFiles(currentPath === '/' ? demoFiles : response.data);
      } else {
        setError(response.error || 'Failed to load files');
      }
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const response = await fileManager.uploadFile(currentPath, file);
      if (response.success) {
        await loadFiles();
      } else {
        setError(response.error || 'Failed to upload file');
      }
    } catch (err) {
      setError('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const blob = await fileManager.downloadFile(file.path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download file');
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;

    setLoading(true);
    try {
      const success = await fileManager.deleteFile(file.path);
      if (success) {
        await loadFiles();
        setSelectedFile(null);
      } else {
        setError('Failed to delete file');
      }
    } catch (err) {
      setError('Failed to delete file');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (file: FileItem) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
    }
  };

  const handleBack = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parentPath);
    setSelectedFile(null);
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === 0) {
      setCurrentPath('/');
    } else {
      setCurrentPath('/' + breadcrumbs.slice(1, index + 1).join('/'));
    }
    setSelectedFile(null);
  };

  const Content = () => (
    <div className="flex h-full bg-black">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-500/10 bg-black">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              disabled={currentPath === '/'}
              className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRightIcon className="w-4 h-4 text-emerald-500/50" />}
                  <button
                    onClick={() => navigateToBreadcrumb(index)}
                    className="px-2 py-1 text-sm text-gray-300 hover:text-emerald-400 rounded"
                  >
                    {crumb}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-400 hover:bg-emerald-500/10'
              }`}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-400 hover:bg-emerald-500/10'
              }`}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-emerald-500/10" />
            <label className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 cursor-pointer">
              <CloudArrowUpIcon className="w-5 h-5" />
              <input type="file" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : viewMode === 'list' ? (
            <div className="rounded-lg border border-emerald-500/10 overflow-hidden bg-black/50">
              <table className="w-full">
                <thead className="bg-emerald-500/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Modified</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-emerald-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/10">
                  {files.map((file) => (
                    <tr
                      key={file.path}
                      onClick={() => handleNavigate(file)}
                      className={`${
                        selectedFile?.path === file.path ? 'bg-emerald-500/10' : 'hover:bg-emerald-500/5'
                      } cursor-pointer transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          {file.type === 'directory' ? (
                            <FolderIcon className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <DocumentIcon className="w-5 h-5 text-emerald-400/70" />
                          )}
                          <span className="text-gray-300">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-emerald-400/70">
                        {file.type === 'file' ? formatBytes(file.size) : '--'}
                      </td>
                      <td className="px-4 py-3 text-sm text-emerald-400/70">
                        {formatDate(file.modified)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end space-x-2">
                          {file.type === 'file' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(file);
                                }}
                                className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(file);
                                }}
                                className="p-1 rounded text-red-400 hover:bg-red-500/10"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file) => (
                <motion.div
                  key={file.path}
                  layoutId={file.path}
                  onClick={() => handleNavigate(file)}
                  className={`p-4 rounded-lg border ${
                    selectedFile?.path === file.path
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-emerald-500/10 hover:border-emerald-500/30 bg-black/50'
                  } cursor-pointer group transition-colors`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    {file.type === 'directory' ? (
                      <FolderIcon className="w-12 h-12 text-emerald-400" />
                    ) : (
                      <DocumentIcon className="w-12 h-12 text-emerald-400/70" />
                    )}
                    <span className="text-sm text-gray-300 truncate w-full">{file.name}</span>
                    {file.type === 'file' && (
                      <>
                        <span className="text-xs text-emerald-400/70">{formatBytes(file.size)}</span>
                        <div className="opacity-0 group-hover:opacity-100 flex space-x-2 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                            className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file);
                            }}
                            className="p-1 rounded text-red-400 hover:bg-red-500/10"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - File Details */}
      {selectedFile && (
        <div className="w-64 bg-black border-l border-emerald-500/10 p-4">
          <div className="space-y-4">
            <div className="flex justify-center">
              {selectedFile.type === 'directory' ? (
                <FolderIcon className="w-16 h-16 text-emerald-400" />
              ) : (
                <DocumentIcon className="w-16 h-16 text-emerald-400/70" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-300">{selectedFile.name}</h3>
              {selectedFile.type === 'file' && (
                <p className="text-sm text-emerald-400/70">{formatBytes(selectedFile.size)}</p>
              )}
            </div>
            <div className="pt-4 border-t border-emerald-500/10">
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-emerald-400/70">Type</dt>
                  <dd className="text-sm text-gray-300 capitalize">{selectedFile.type}</dd>
                </div>
                <div>
                  <dt className="text-xs text-emerald-400/70">Modified</dt>
                  <dd className="text-sm text-gray-300">{formatDate(selectedFile.modified)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-emerald-400/70">Path</dt>
                  <dd className="text-sm text-gray-300 break-all">{selectedFile.path}</dd>
                </div>
              </dl>
            </div>
            {selectedFile.type === 'file' && (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleDownload(selectedFile)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => handleDelete(selectedFile)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (isOpen) {
    return (
      <Dialog open={true} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
        <div className="fixed inset-0">
          <Dialog.Panel className="h-full">
            <Content />
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  return (
    <div className="h-full">
      <Content />
    </div>
  );
} 