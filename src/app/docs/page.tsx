import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation - ComfyUI',
  description: 'Learn how to use ComfyUI to deploy and scale your applications.',
};

export default function DocsPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">
            Welcome to ComfyUI Documentation
          </h1>
          <p className="text-xl text-gray-400 mb-12">
            The most developer-friendly platform for deploying and scaling applications worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Getting Started */}
          <div className="bg-[#111111] rounded-xl p-6 border border-[#222222] hover:border-emerald-500/20 hover:shadow-[0_0_1rem_0_rgba(28,254,186,0.1)] transition-all duration-300">
            <h2 className="text-2xl font-semibold text-white mb-4">Getting Started</h2>
            <ul className="space-y-3">
              <li>
                <a href="/docs/getting-started/quickstart" className="text-emerald-400 hover:text-emerald-300 block py-1">
                  Quick Start Guide
                </a>
              </li>
              <li>
                <a href="/docs/getting-started/installation" className="text-emerald-400 hover:text-emerald-300 block py-1">
                  Installation
                </a>
              </li>
              <li>
                <a href="/docs/getting-started/concepts" className="text-emerald-400 hover:text-emerald-300 block py-1">
                  Core Concepts
                </a>
              </li>
            </ul>
          </div>

          {/* API Reference */}
          <div className="bg-[#111111] rounded-xl p-6 border border-[#222222] hover:border-emerald-500/20 hover:shadow-[0_0_1rem_0_rgba(28,254,186,0.1)] transition-all duration-300">
            <h2 className="text-2xl font-semibold text-white mb-4">API Reference</h2>
            <ul className="space-y-3">
              <li>
                <a href="/docs/api/rest" className="text-emerald-400 hover:text-emerald-300 block py-1">
                  REST API
                </a>
              </li>
              <li>
                <a href="/docs/api/graphql" className="text-emerald-400 hover:text-emerald-300 block py-1">
                  GraphQL API
                </a>
              </li>
              <li>
                <a href="/docs/api/websocket" className="text-emerald-400 hover:text-emerald-300 block py-1">
                  WebSocket API
                </a>
              </li>
            </ul>
          </div>

          {/* Examples */}
          <div className="bg-[#111111] rounded-xl p-6 border border-[#222222] hover:border-emerald-500/20 hover:shadow-[0_0_1rem_0_rgba(28,254,186,0.1)] transition-all duration-300">
            <h2 className="text-2xl font-semibold text-white mb-4">Examples</h2>
            <ul className="space-y-3">
              <li>
                <a href="/docs/examples/basic-deployment" className="text-emerald-400 hover:text-emerald-300 block py-1">
                  Basic Deployment
                </a>
              </li>
              <li>
                <a href="/docs/examples/ai-model-serving" className="text-emerald-400 hover:text-emerald-300 block py-1">
                  AI Model Serving
                </a>
              </li>
              <li>
                <a href="/docs/examples/real-time-apps" className="text-emerald-400 hover:text-emerald-300 block py-1">
                  Real-time Applications
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#111111] rounded-xl p-6 border border-[#222222] hover:border-emerald-500/20 hover:shadow-[0_0_1rem_0_rgba(28,254,186,0.1)] transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-4">GPU Acceleration</h3>
              <ul className="space-y-2 text-gray-400">
                <li>• NVIDIA T4 GPUs</li>
                <li>• L4/A40 GPUs for advanced computing</li>
                <li>• A100/H100 GPUs for enterprise workloads</li>
              </ul>
            </div>
            <div className="bg-[#111111] rounded-xl p-6 border border-[#222222] hover:border-emerald-500/20 hover:shadow-[0_0_1rem_0_rgba(28,254,186,0.1)] transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-4">Auto-scaling</h3>
              <ul className="space-y-2 text-gray-400">
                <li>• Zero to production in seconds</li>
                <li>• Horizontal and vertical scaling</li>
                <li>• Load balancing included</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 