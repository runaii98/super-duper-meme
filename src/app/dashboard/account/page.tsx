'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Shield, 
  Key, 
  Globe, 
  Moon,
  Save,
  Camera,
  ChevronRight
} from 'lucide-react';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-black/10">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Account Settings</h1>
            <p className="text-gray-400 text-sm">Manage your account settings and preferences</p>
          </div>
          <button className="px-4 py-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-600 transition-all duration-200 flex items-center gap-2 font-medium">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3 space-y-6">
            {/* Profile Card */}
            <div className="bg-black/20 backdrop-blur-xl rounded-xl border border-emerald-500/10 overflow-hidden">
              <div className="p-6">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <img
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=John&backgroundColor=059669"
                    alt="Profile"
                    className="rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-black/20"
                  />
                  <button className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-500 text-black hover:bg-emerald-600 transition-all duration-200 shadow-lg">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center">
                  <h3 className="text-white font-medium text-lg">John Doe</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-emerald-500/10 rounded-full text-xs font-medium text-emerald-400">Pro Plan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-black/20 backdrop-blur-xl rounded-xl border border-emerald-500/10 overflow-hidden">
              <nav className="p-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between group transition-all duration-200 ${
                    activeTab === 'profile'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-gray-400 hover:bg-emerald-500/5 hover:text-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'profile' ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between group transition-all duration-200 ${
                    activeTab === 'security'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-gray-400 hover:bg-emerald-500/5 hover:text-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4" />
                    <span>Security</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'security' ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between group transition-all duration-200 ${
                    activeTab === 'preferences'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-gray-400 hover:bg-emerald-500/5 hover:text-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4" />
                    <span>Preferences</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'preferences' ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <div className="bg-black/20 backdrop-blur-xl rounded-xl border border-emerald-500/10 overflow-hidden">
              {activeTab === 'profile' && (
                <div className="p-8">
                  <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-400" />
                    Profile Information
                  </h2>
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Full Name</label>
                        <input
                          type="text"
                          defaultValue="John Doe"
                          className="w-full px-4 py-2.5 bg-black/40 border border-emerald-500/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Email</label>
                        <input
                          type="email"
                          defaultValue="john.doe@example.com"
                          className="w-full px-4 py-2.5 bg-black/40 border border-emerald-500/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400">Bio</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-2.5 bg-black/40 border border-emerald-500/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200 resize-none"
                        placeholder="Write a short bio..."
                      />
                      <p className="text-xs text-gray-500">Brief description for your profile.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="p-8">
                  <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Security Settings
                  </h2>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400">Current Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2.5 bg-black/40 border border-emerald-500/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">New Password</label>
                        <input
                          type="password"
                          className="w-full px-4 py-2.5 bg-black/40 border border-emerald-500/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Confirm New Password</label>
                        <input
                          type="password"
                          className="w-full px-4 py-2.5 bg-black/40 border border-emerald-500/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="p-6 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-white flex items-center gap-2">
                            <Key className="w-4 h-4 text-emerald-400" />
                            Two-Factor Authentication
                          </h3>
                          <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                        </div>
                        <button className="px-4 py-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-600 transition-all duration-200 font-medium">
                          Enable
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="p-8">
                  <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    Preferences
                  </h2>
                  <div className="space-y-6">
                    <div className="p-6 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-white flex items-center gap-2">
                            <Bell className="w-4 h-4 text-emerald-400" />
                            Email Notifications
                          </h3>
                          <p className="text-sm text-gray-400">Receive email updates about your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-emerald-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-emerald-500 after:border-emerald-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    </div>
                    <div className="p-6 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-white flex items-center gap-2">
                            <Moon className="w-4 h-4 text-emerald-400" />
                            Dark Mode
                          </h3>
                          <p className="text-sm text-gray-400">Toggle dark mode theme</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-emerald-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-emerald-500 after:border-emerald-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 