"use client"

import { useState } from "react"

const Settings = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState("profile")

  const getInitials = (name) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U"
  }

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-xl">
              {getInitials(user?.username)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-800 bg-emerald-400 shadow-md"></div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.username}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-emerald-400 font-medium">Active now</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-200 hover:bg-slate-700/50 rounded-xl transition-all duration-200 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Edit Profile</div>
              <div className="text-xs text-slate-400">Update your profile information</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  const renderPrivacySection = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Privacy & Security
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
            <div>
              <div className="text-sm font-medium text-white">Two-Factor Authentication</div>
              <div className="text-xs text-slate-400">Add an extra layer of security</div>
            </div>
            <button className="px-3 py-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
              Enable
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
          Appearance
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              <button className="p-2 rounded-lg bg-slate-900 border-2 border-indigo-500 text-xs text-white">Dark</button>
              <button className="p-2 rounded-lg bg-slate-700 border-2 border-transparent hover:border-slate-600 text-xs text-white">Light</button>
              <button className="p-2 rounded-lg bg-slate-700 border-2 border-transparent hover:border-slate-600 text-xs text-white">Auto</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5a6 6 0 10-12 0v5l-5 5h5m7 0a3 3 0 11-6 0" />
          </svg>
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
            <div>
              <div className="text-sm font-medium text-white">Push Notifications</div>
              <div className="text-xs text-slate-400">Receive notifications for new messages</div>
            </div>
            <button className="w-10 h-6 bg-indigo-500 rounded-full relative transition-colors">
              <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 transition-transform"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const sections = [
    { id: "profile", name: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { id: "privacy", name: "Privacy", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    { id: "appearance", name: "Appearance", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" },
    { id: "notifications", name: "Notifications", icon: "M15 17h5l-5 5v-5a6 6 0 10-12 0v5l-5 5h5m7 0a3 3 0 11-6 0" }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection()
      case "privacy":
        return renderPrivacySection()
      case "appearance":
        return renderAppearanceSection()
      case "notifications":
        return renderNotificationsSection()
      default:
        return renderProfileSection()
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-900 via-gray-800 to-black relative">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Settings</h1>
              <p className="text-sm text-slate-400">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800/30 backdrop-blur-sm border-r border-slate-700/50 p-4">
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ${
                  activeSection === section.id
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                </svg>
                <span className="font-medium">{section.name}</span>
              </button>
            ))}
            
            {/* Sign Out Button */}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 mt-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Sign Out</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default Settings