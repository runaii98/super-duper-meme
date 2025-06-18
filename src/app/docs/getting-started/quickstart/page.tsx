import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quick Start Guide - ComfyUI Documentation',
  description: 'Get started with ComfyUI in minutes.',
};

export default function QuickStartPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">
          Quick Start Guide
        </h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-400 text-xl mb-8">
            Get started with ComfyUI in minutes. This guide will help you deploy your first application.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Prerequisites</h2>
          <ul className="space-y-2 text-gray-400 mb-8">
            <li>• Node.js 18 or later</li>
            <li>• npm or yarn package manager</li>
            <li>• A ComfyUI account</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Installation</h2>
          <div className="bg-[#111111] rounded-xl p-6 mb-8">
            <pre className="text-gray-300">
              <code>npm install -g @comfyui/cli</code>
            </pre>
          </div>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Authentication</h2>
          <div className="bg-[#111111] rounded-xl p-6 mb-8">
            <pre className="text-gray-300">
              <code>comfy login</code>
            </pre>
          </div>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Create a New Project</h2>
          <div className="bg-[#111111] rounded-xl p-6 mb-8">
            <pre className="text-gray-300">
              <code>{`comfy create my-app\ncd my-app`}</code>
            </pre>
          </div>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Deploy Your App</h2>
          <div className="bg-[#111111] rounded-xl p-6 mb-8">
            <pre className="text-gray-300">
              <code>comfy deploy</code>
            </pre>
          </div>
          <p className="text-gray-400 mb-8">
            Your app will be available at <code className="text-emerald-400">https://my-app.comfyui.app</code>
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Next Steps</h2>
          <ul className="space-y-3 mb-8">
            <li>
              <a href="/docs/getting-started/configuration" className="text-emerald-400 hover:text-emerald-300">
                Configure your application
              </a>
            </li>
            <li>
              <a href="/docs/getting-started/domains" className="text-emerald-400 hover:text-emerald-300">
                Add custom domains
              </a>
            </li>
            <li>
              <a href="/docs/getting-started/env-vars" className="text-emerald-400 hover:text-emerald-300">
                Set up environment variables
              </a>
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Example: Deploy a Next.js App</h2>
          <div className="bg-[#111111] rounded-xl p-6 mb-8">
            <pre className="text-gray-300">
              <code>{`# Create a new Next.js project\nnpx create-next-app@latest my-nextjs-app\ncd my-nextjs-app\n\n# Initialize ComfyUI\ncomfy init\n\n# Deploy globally\ncomfy deploy --prod`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
} 