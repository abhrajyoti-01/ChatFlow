"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useSocket } from "../context/SocketContext";
import apiService from "../services/api";
const Sidebar = ({
  user,
  activeTab,
  setActiveTab,
  selectedRoom,
  selectedChat,
  showSettings,
  onRoomSelect,
  onChatSelect,
  onSettingsOpen,
  onLogout,
  collapsed,
  onToggleCollapse,
}) => {
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState(null)

  const { rooms = [], directChats = [], conversations = [], createRoom } = useSocket()

  // Debounced search function
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      let results = []

      if (activeTab === "rooms") {
        const response = await apiService.searchRooms(query)
        results = response.rooms || []
      } else if (activeTab === "chats") {
        const response = await apiService.searchUsers(query)
        results = response.users || []
      }

      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [activeTab])

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      performSearch(searchQuery)
    }, 300) // 300ms debounce

    setSearchTimeout(timeout)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [searchQuery, performSearch])

  // Clear search results when search query is empty
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([])
    }
  }, [searchQuery])

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => room.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [rooms, searchQuery])

  const filteredChats = useMemo(() => {
    return conversations.filter((chat) => chat.user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [conversations, searchQuery])

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    setIsCreatingRoom(true)
    try {
      await createRoom({ name: newRoomName.trim() })
      setNewRoomName("")
      setShowRoomForm(false)
    } catch (error) {
      console.error("Failed to create room:", error)
    } finally {
      setIsCreatingRoom(false)
    }
  }

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

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-emerald-400"
      case "away":
        return "bg-amber-400"
      case "busy":
        return "bg-rose-400"
      default:
        return "bg-slate-400"
    }
  }

  if (collapsed) {
    return (
      <div className="h-full w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/60 flex flex-col items-center py-8 relative overflow-hidden backdrop-blur-sm">
        {/* Enhanced top gradient */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500/70 via-violet-500/70 to-indigo-500/70 animate-pulse"></div>
        <div className="absolute top-1.5 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-indigo-500/30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-violet-500/8"></div>

        {/* Subtle patterns */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuNCIvPgo8L3N2Zz4=')] bg-repeat"></div>
        </div>

        <div className="relative mb-10 z-10 group">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-semibold text-lg shadow-xl border border-slate-600/60 group-hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105">
            {getInitials(user?.username)}
            
            {/* Inner glow on hover */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/10 group-hover:to-violet-500/10 transition-all duration-300"></div>
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-800 ${getStatusColor("online")} shadow-md`}
          ></div>
        </div>

        {/* Toggle button for collapsed state - enhanced for mobile */}
        <div className="flex flex-col items-center mb-6 z-10">
          <button
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 hover:bg-gradient-to-br hover:from-indigo-500/20 hover:to-violet-500/20 hover:text-indigo-400 active:bg-gradient-to-br active:from-indigo-500/20 active:to-violet-500/20 active:text-indigo-400 transition-all duration-300 border border-slate-700/50 hover:border-indigo-500/30 active:border-indigo-500/30 group shadow-lg hover:shadow-indigo-500/30 active:shadow-indigo-500/30 hover:scale-105 active:scale-105"
            title="Collapse sidebar"
          >
            <span className="text-xl font-bold transition-transform duration-300 group-hover:scale-105 active:scale-105">‹</span>
          </button>
        </div>

        <div className="flex flex-col gap-6 z-10">
          <button
            className={`relative p-4 rounded-xl transition-all duration-300 group ${
              activeTab === "rooms"
                ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/30"
                : "bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700/90 hover:shadow-lg"
            }`}
            onClick={() => setActiveTab("rooms")}
            title="Rooms"
          >
            <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {/* Active indicator */}
            {activeTab === "rooms" && (
              <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full"></div>
            )}
            {/* Hover effect */}
            {activeTab !== "rooms" && (
              <>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-0 group-hover:h-4 bg-indigo-400/50 rounded-full transition-all duration-300"></div>
              </>
            )}
          </button>
          <button
            className={`relative p-4 rounded-xl transition-all duration-300 group ${
              activeTab === "chats"
                ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/30"
                : "bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700/90 hover:shadow-lg"
            }`}
            onClick={() => setActiveTab("chats")}
            title="Direct Messages"
          >
            <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {/* Active indicator */}
            {activeTab === "chats" && (
              <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full"></div>
            )}
            {/* Hover effect */}
            {activeTab !== "chats" && (
              <>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-0 group-hover:h-4 bg-indigo-400/50 rounded-full transition-all duration-300"></div>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 relative overflow-hidden backdrop-blur-sm">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5"></div>

      <div className="p-6 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-semibold text-base shadow-lg border border-slate-600/50 group-hover:shadow-indigo-500/20 transition-all duration-300">
                {getInitials(user?.username)}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${getStatusColor("online")} shadow-sm`}
              ></div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-base truncate">{user?.username}</h2>
              <p className="text-indigo-400 text-xs font-medium tracking-wide truncate flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"></span>
                Active now
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 hover:bg-gradient-to-br hover:from-indigo-500/20 hover:to-violet-500/20 hover:text-indigo-400 active:bg-gradient-to-br active:from-indigo-500/20 active:to-violet-500/20 active:text-indigo-400 transition-all duration-300 border border-slate-700/50 hover:border-indigo-500/30 active:border-indigo-500/30 group shadow-lg hover:shadow-indigo-500/30 active:shadow-indigo-500/30 hover:scale-105 active:scale-105"
              title="Collapse sidebar"
            >
              <span className="text-xl font-bold transition-transform duration-300 group-hover:scale-105 active:scale-105">‹</span>
            </button>

            <button
              onClick={onSettingsOpen}
              className={`flex items-center justify-center transition-all duration-300 border group ${
                showSettings 
                  ? "w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-indigo-500/60 shadow-xl shadow-indigo-500/40 scale-110 ring-2 ring-indigo-400/30"
                  : "w-10 h-10 bg-slate-800/80 text-slate-400 hover:bg-gradient-to-br hover:from-indigo-500/20 hover:to-violet-500/20 hover:text-indigo-400 border-slate-700/50 hover:border-indigo-500/30 hover:scale-105"
              }`}
              title="Settings"
            >
              <span className={`text-lg font-bold transition-all duration-300 ${showSettings ? 'rotate-45 scale-110' : 'group-hover:scale-110'}`}>⚙</span>
            </button>
          </div>
        </div>

        <div className="bg-black/40 rounded-xl p-1 flex mb-6 relative backdrop-blur-sm shadow-inner">
          <div
            className="absolute top-1 bottom-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg shadow-lg transition-all duration-300 ease-out"
            style={{
              width: "50%",
              transform: `translateX(${activeTab === "rooms" ? "0%" : "100%"})`,
            }}
          />
          <button
            className={`flex-1 py-3 px-3 rounded-lg z-10 relative transition-all duration-300 font-semibold text-sm focus:outline-none focus:ring-0 border-none bg-transparent ${
              activeTab === "rooms" ? "text-white" : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("rooms")}
            type="button"
          >
            <span className="flex items-center justify-center gap-2 relative z-10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Rooms</span>
            </span>
          </button>
          <button
            className={`flex-1 py-3 px-3 rounded-lg z-10 relative transition-all duration-300 font-semibold text-sm focus:outline-none focus:ring-0 border-none bg-transparent ${
              activeTab === "chats" ? "text-white" : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("chats")}
            type="button"
          >
            <span className="flex items-center justify-center gap-2 relative z-10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>Messages</span>
            </span>
          </button>
        </div>
      </div>

      <div className="px-6 pb-5 relative z-10">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 focus:border-indigo-500/50 hover:border-slate-600/70 rounded-xl text-white placeholder-slate-400 focus:placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-300 transition-colors duration-200"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {activeTab === "rooms" && (
          <button
            onClick={() => setShowRoomForm(true)}
            className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Room
          </button>
        )}
      </div>

      {/* Modern Content Area */}
      <div className="flex-1 overflow-hidden relative z-10">
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent px-3">
          {activeTab === "rooms" ? (
            <div className="space-y-2 pb-6">
              {/* Search Results */}
              {searchQuery && searchResults.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3 px-2">
                    Search Results
                  </h3>
                  {searchResults.map((room) => (
                    <div
                      key={room._id}
                      onClick={() => onRoomSelect(room)}
                      className="group flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/30 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer mb-2"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                        <span className="text-indigo-400 font-semibold text-sm">
                          {getInitials(room.name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{room.name}</p>
                        <p className="text-slate-400 text-xs truncate">
                          {room.members?.length || 0} members • {room.type}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                  ))}
                  {isSearching && (
                    <div className="text-center py-4">
                      <div className="inline-block w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Regular Rooms */}
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3 px-2">
                {searchQuery ? "Your Rooms" : "Rooms"}
              </h3>
              {filteredRooms.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-400 font-medium">No rooms found</p>
                  <p className="text-gray-500 text-sm mt-1">Create your first room to get started</p>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <div
                    key={room._id}
                    onClick={() => onRoomSelect(room)}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-800/60 border ${
                      selectedRoom?._id === room._id
                        ? "bg-teal-500/20 border-teal-500/40"
                        : "bg-gray-800/30 border-transparent hover:border-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-white font-semibold">
                          #
                        </div>
                        {room.hasUnread && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border border-[#1A2234] flex items-center justify-center text-[10px] text-white font-medium">
                            !
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium truncate ${selectedRoom?._id === room._id ? "text-teal-400" : "text-white"}`}
                        >
                          {room.name}
                        </h3>
                        <p className="text-xs text-gray-400 group-hover:text-gray-300 truncate">
                          {room.members?.length || 0} members • {room.lastActivity ? "Active" : "Inactive"}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 group-hover:text-gray-300">
                        {room.lastMessage &&
                          new Date(room.lastMessage.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2 pb-6">
              {/* Search Results for Users */}
              {searchQuery && searchResults.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3 px-2">
                    Search Results
                  </h3>
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => onChatSelect({ user, _id: user._id })}
                      className="group flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/30 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer mb-2"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                          <span className="text-indigo-400 font-semibold text-sm">
                            {getInitials(user.username)}
                          </span>
                        </div>
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${getStatusColor(user.status)}`}
                        ></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{user.username}</p>
                        <p className="text-slate-400 text-xs truncate">
                          {user.status === "online" ? "Online" : "Offline"}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400">
                        Start chat
                      </div>
                    </div>
                  ))}
                  {isSearching && (
                    <div className="text-center py-4">
                      <div className="inline-block w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Regular Direct Chats */}
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3 px-2">
                {searchQuery ? "Your Messages" : "Direct Messages"}
              </h3>
              {filteredChats.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-400 font-medium">No messages yet</p>
                  <p className="text-gray-500 text-sm mt-1">Start a conversation with someone</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => onChatSelect(chat)}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-800/60 border ${
                      selectedChat?._id === chat._id
                        ? "bg-teal-500/20 border-teal-500/40"
                        : "bg-gray-800/30 border-transparent hover:border-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-white font-medium">
                          {getInitials(chat.user.username)}
                        </div>
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-[#1A2234] ${getStatusColor(chat.user.status)}`}
                        ></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium truncate ${selectedChat?._id === chat._id ? "text-teal-400" : "text-white"}`}
                        >
                          {chat.user.username}
                        </h3>
                        <p className="text-xs text-gray-400 group-hover:text-gray-300 truncate">
                          {chat.lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 group-hover:text-gray-300">
                        {chat.lastMessage &&
                          new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Room Creation Modal */}
      {showRoomForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/20 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Create New Room</h3>
                <button
                  onClick={() => {
                    setShowRoomForm(false)
                    setNewRoomName("")
                  }}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">Room Name</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Enter room name..."
                    className="w-full px-4 py-3 bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 focus:border-indigo-500/70 hover:border-slate-500/70 rounded-xl text-white placeholder-slate-400 focus:placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all duration-300 text-sm"
                    disabled={isCreatingRoom}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoomForm(false)
                      setNewRoomName("")
                    }}
                    className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 font-semibold rounded-xl transition-all duration-200 border border-slate-600/50"
                    disabled={isCreatingRoom}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:from-indigo-500 disabled:hover:to-violet-600 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                    disabled={!newRoomName.trim() || isCreatingRoom}
                  >
                    {isCreatingRoom ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Room
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
