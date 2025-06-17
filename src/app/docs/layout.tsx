import Navbar from '@/components/Navbar';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="flex pt-[64px]">
        {/* Sidebar */}
        <div className="hidden lg:block w-64 bg-[#111111] border-r border-[#222222] fixed h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-6">
            <nav className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Getting Started
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/docs/getting-started/quickstart" className="text-gray-300 hover:text-emerald-400 block py-1">
                      Quick Start Guide
                    </a>
                  </li>
                  <li>
                    <a href="/docs/getting-started/installation" className="text-gray-300 hover:text-emerald-400 block py-1">
                      Installation
                    </a>
                  </li>
                  <li>
                    <a href="/docs/getting-started/concepts" className="text-gray-300 hover:text-emerald-400 block py-1">
                      Core Concepts
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  API Reference
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/docs/api/rest" className="text-gray-300 hover:text-emerald-400 block py-1">
                      REST API
                    </a>
                  </li>
                  <li>
                    <a href="/docs/api/graphql" className="text-gray-300 hover:text-emerald-400 block py-1">
                      GraphQL API
                    </a>
                  </li>
                  <li>
                    <a href="/docs/api/websocket" className="text-gray-300 hover:text-emerald-400 block py-1">
                      WebSocket API
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Examples
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/docs/examples/basic-deployment" className="text-gray-300 hover:text-emerald-400 block py-1">
                      Basic Deployment
                    </a>
                  </li>
                  <li>
                    <a href="/docs/examples/ai-model-serving" className="text-gray-300 hover:text-emerald-400 block py-1">
                      AI Model Serving
                    </a>
                  </li>
                  <li>
                    <a href="/docs/examples/real-time-apps" className="text-gray-300 hover:text-emerald-400 block py-1">
                      Real-time Applications
                    </a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:pl-64">
          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 