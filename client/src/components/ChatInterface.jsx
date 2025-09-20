"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useResponsive } from "../hooks/useResponsive"
import Sidebar from "./Sidebar"
import MessageArea from "./MessageArea"
import Settings from "./Settings"

const ChatInterface = () => {
  const { user, logout } = useAuth()
  const { isMobile } = useResponsive()
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedChat, setSelectedChat] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState("rooms")
  // Default to collapsed on mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile)
  const handleRoomSelect = useCallback((room) => {
    setSelectedRoom(room)
    setSelectedChat(null)
    setShowSettings(false)
  }, [])

  const handleChatSelect = useCallback((chat) => {
    setSelectedChat(chat)
    setSelectedRoom(null)
    setShowSettings(false)
  }, [])

  const handleSettingsOpen = useCallback(() => {
    setShowSettings(true)
    setSelectedRoom(null)
    setSelectedChat(null)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }, [logout])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev)
  }, [])

  // Handle responsive changes
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }, [isMobile])

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = useCallback(() => {
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }, [isMobile])

  const currentConversation = useMemo(() => {
    if (selectedRoom) {
      return {
        type: "room",
        data: selectedRoom,
        title: selectedRoom.name,
        subtitle: `${selectedRoom.members?.length || 0} members`,
        avatar: selectedRoom.avatar || null,
        isOnline: true,
      }
    }
    if (selectedChat) {
      return {
        type: "chat",
        data: selectedChat,
        title: selectedChat.user.username,
        subtitle: selectedChat.user.status || "offline",
        avatar: selectedChat.user.avatar || null,
        isOnline: selectedChat.user.status === "online",
      }
    }
    return null
  }, [selectedRoom, selectedChat])

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-black font-sans relative overflow-hidden">
      <div className="absolute inset-0">
        {/* Enhanced gradient foundation */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-800 to-black"></div>

        {/* Improved color overlays with more vibrant colors */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.18),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.15),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.08),transparent_70%)]"></div>

        {/* Enhanced mesh pattern with slightly higher opacity */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuNCIvPgo8L3N2Zz4=')] bg-repeat"></div>
        </div>

        {/* More dynamic floating elements with enhanced animations */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-indigo-400/40 rounded-full animate-pulse delay-300"></div>
        <div className="absolute top-40 right-32 w-1.5 h-1.5 bg-violet-400/50 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-40 w-1 h-1 bg-indigo-400/45 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-20 w-2.5 h-2.5 bg-violet-400/35 rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-[30%] right-[15%] w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-pulse delay-1200"></div>
        <div className="absolute bottom-[25%] left-[20%] w-2 h-2 bg-purple-400/25 rounded-full animate-pulse delay-900"></div>
      </div>

      <div className="flex w-full relative z-10 min-h-0">
        {/* Mobile Sidebar Overlay - shown when sidebar is open on mobile */}
        {!sidebarCollapsed && isMobile && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={handleOverlayClick}
          />
        )}
        
        <div
          className={`relative flex-shrink-0 transition-all duration-500 ease-out z-10 ${
            sidebarCollapsed 
              ? "w-16 md:w-20" 
              : isMobile 
                ? "fixed inset-y-0 left-0 w-80 md:relative md:w-96 lg:w-[400px]" 
                : "w-80 md:w-96 lg:w-[400px]"
          }`}
        >
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-700/50 to-transparent"></div>

          <Sidebar
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedRoom={selectedRoom}
            selectedChat={selectedChat}
            showSettings={showSettings}
            onRoomSelect={handleRoomSelect}
            onChatSelect={handleChatSelect}
            onSettingsOpen={handleSettingsOpen}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        </div>

        <div className="flex-1 flex flex-col relative min-w-0 min-h-0">
          {showSettings ? (
            <Settings
              user={user}
              onLogout={handleLogout}
            />
          ) : (
            <MessageArea
              user={user}
              selectedRoom={selectedRoom}
              selectedChat={selectedChat}
              activeTab={activeTab}
              currentConversation={currentConversation}
              onToggleSidebar={toggleSidebar}
              sidebarCollapsed={sidebarCollapsed}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatInterface

