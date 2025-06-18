'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 7H7v6h6V7z" />
                  <path fillRule="evenodd" d="M7 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H7zm4 0H9v2h2V2z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to manage your container</p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl text-white mb-2">Coming Soon</h2>
              <p className="text-gray-400">This feature is currently under development.</p>
              <Link href="/" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Platform Features */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-8">
        <div className="w-full max-w-lg mx-auto flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white mb-4">Cloud Platform</h2>
          <p className="text-gray-400 text-lg mb-12">Deploy and scale your applications with ease</p>

          <div className="space-y-8">
            <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Seamless deployment</h3>
              <p className="text-gray-400">Build and deploy anything from web apps to inference with native HTTP/2, WebSocket, and gRPC support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 