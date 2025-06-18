import { useState } from 'react';

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="bg-[#1e1e1e] border-b border-[#2a2a2a]">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center">
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Search..."
                className="w-full input"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            <button className="btn-secondary">
              <span className="text-sm">Join Discord</span>
            </button>
            <button className="btn-primary">
              <span className="text-sm">Get 50GB Free Storage</span>
            </button>
            <div className="flex items-center gap-3">
              <button className="text-gray-400 hover:text-white">
                <span className="text-xl">🎁</span>
              </button>
              <button className="text-gray-400 hover:text-white">
                <span className="text-xl">🔔</span>
              </button>
              <button className="text-gray-400 hover:text-white">
                <span className="text-xl">💬</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 