import { useState, useEffect, useRef } from "react"
import apiService from "../services/api"
import { useSocket } from "../context/SocketContext"
import MessageInput from "./MessageInput"

const MessageArea = ({
  user,
  selectedRoom,
  selectedChat,
  activeTab,
  currentConversation,
  onToggleSidebar,
  sidebarCollapsed,
}) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingError, setLoadingError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [showDropdown, setShowDropdown] = useState(false)
  const messagesEndRef = useRef(null)
  const dropdownRef = useRef(null)

  const {
    joinRoom,
    leaveRoom,
    onRoomMessage,
    onPrivateMessage,
    onUserJoinedRoom,
    onUserLeftRoom,
    getTypingUsersForRoom,
  } = useSocket()

  const typingUsers = selectedRoom ? getTypingUsersForRoom(selectedRoom._id) : []

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Load messages when room or chat changes
  useEffect(() => {
    if (selectedRoom || selectedChat) {
      loadMessages(true)

      // Join room for real-time updates
      if (selectedRoom) {
        joinRoom(selectedRoom._id)
      }
    } else {
      setMessages([])
    }

    // Cleanup: leave room when component unmounts or room changes
    return () => {
      if (selectedRoom) {
        leaveRoom(selectedRoom._id)
      }
    }
  }, [selectedRoom, selectedChat, joinRoom, leaveRoom])

  // Set up real-time message listeners
  useEffect(() => {
    const unsubscribeRoomMessage = onRoomMessage((messageData) => {
      if (selectedRoom && messageData.roomId === selectedRoom._id) {
        setMessages((prev) => [
          ...prev,
          {
            _id: messageData.timestamp,
            sender: {
              _id: messageData.senderId,
              username: messageData.senderUsername,
              avatar: null,
            },
            content: { text: messageData.message },
            messageType: messageData.messageType,
            createdAt: messageData.timestamp,
          },
        ])
      }
    })

    const unsubscribePrivateMessage = onPrivateMessage((messageData) => {
      if (
        selectedChat &&
        (messageData.senderId === selectedChat.user._id || messageData.recipientId === selectedChat.user._id)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            _id: messageData.timestamp,
            sender: {
              _id: messageData.senderId,
              username: messageData.senderUsername,
              avatar: null,
            },
            content: { text: messageData.message },
            messageType: messageData.messageType,
            createdAt: messageData.timestamp,
            isPrivate: true,
          },
        ])
      }
    })

    return () => {
      unsubscribeRoomMessage()
      unsubscribePrivateMessage()
    }
  }, [selectedRoom, selectedChat, onRoomMessage, onPrivateMessage])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async (reset = false) => {
    if (loading) return

    try {
      setLoading(true)
      setLoadingError(null)
      const currentPage = reset ? 1 : page
      let response

      if (selectedRoom) {
        response = await apiService.getRoomMessages(selectedRoom._id, currentPage)
      } else if (selectedChat) {
        response = await apiService.getPrivateMessages(selectedChat.user._id, currentPage)
      }

      if (response) {
        if (reset) {
          setMessages(response.messages || [])
          setPage(2)
        } else {
          setMessages((prev) => [...(response.messages || []), ...prev])
          setPage((prev) => prev + 1)
        }
        setHasMore(response.hasMore || false)
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
      setLoadingError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
  }

  const handleSendMessage = async (messageData) => {
    try {
      let response

      if (selectedRoom) {
        response = await apiService.sendRoomMessage(selectedRoom._id, messageData)
      } else if (selectedChat) {
        response = await apiService.sendPrivateMessage(selectedChat.user._id, messageData)
      }

      if (response && response.data) {
        setMessages((prev) => [...prev, response.data])
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  const handleFileUpload = async (file) => {
    try {
      const roomId = selectedRoom?._id
      const recipientId = selectedChat?.user._id

      const response = await apiService.uploadFile(file, roomId, recipientId)

      if (response && response.data) {
        setMessages((prev) => [...prev, response.data])
      }
    } catch (error) {
      console.error("Failed to upload file:", error)
      alert("Failed to upload file. Please try again.")
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) {
      // Less than 1 minute
      return "just now"
    } else if (diff < 3600000) {
      // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`
    } else if (diff < 86400000) {
      // Less than 1 day
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString()
    }
  }

  const renderMessage = (message) => {
    const isOwn = message.sender._id === user._id
    const messageTime = formatTime(message.createdAt)

    return (
      <div
        key={message._id}
        className={`flex mb-6 ${isOwn ? "justify-end" : "justify-start"} group animate-fade-in transition-all duration-300`}
      >
        {!isOwn && (
          <div className="mr-4 flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 shadow-xl ring-2 ring-white/10 overflow-hidden hover:ring-indigo-400/40 transition-all duration-300 group-hover:shadow-indigo-500/30">
              <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {message.sender.avatar ? (
                <img
                  src={message.sender.avatar || "/placeholder.svg"}
                  alt={message.sender.username}
                  className="w-full h-full rounded-2xl object-cover"
                  onError={(e) => {
                    e.target.style.display = "none"
                    e.target.parentNode.innerHTML = `<div class="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">${message.sender.username.charAt(0).toUpperCase()}</div>`
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
                  {message.sender.username.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Add subtle shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            </div>
          </div>
        )}

        <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
          {!isOwn && selectedRoom && (
            <div className="text-sm font-semibold text-indigo-300 mb-2 ml-1 tracking-wide flex items-center">
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{message.sender.username}</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-400/20">member</span>
            </div>
          )}

          <div
            className={`relative rounded-2xl px-6 py-4 shadow-xl backdrop-blur-sm transition-all duration-300 ${
              isOwn
                ? "rounded-tr-sm bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50"
                : "rounded-tl-sm bg-gradient-to-br from-slate-800/95 via-slate-750/95 to-slate-700/95 text-gray-100 border border-slate-600/60 backdrop-blur-xl shadow-slate-900/50 hover:border-slate-500/80"
            }`}
          >
            {/* Add inner glow effect for own messages */}
            {isOwn && (
              <div className="absolute inset-0 rounded-2xl rounded-tr-sm bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            )}
            {/* Add subtle highlight for other's messages */}
            {!isOwn && (
              <div className="absolute inset-0 rounded-2xl rounded-tl-sm bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            )}
            {message.messageType === "text" && (
              <div className="break-words leading-relaxed text-base font-medium tracking-wide">{message.content.text}</div>
            )}

            {message.messageType === "image" && message.content.file && (
              <div className="w-full overflow-hidden rounded-xl">
                <img
                  src={message.content.file.url || "/placeholder.svg"}
                  alt={message.content.file.originalName}
                  onClick={() => window.open(message.content.file.url, "_blank")}
                  className="w-full h-auto max-h-80 object-contain cursor-pointer transition-opacity duration-200 rounded-xl"
                />
                <div className="text-xs mt-2 opacity-80 font-medium">{message.content.file.originalName}</div>
              </div>
            )}

            {message.messageType === "file" && message.content.file && (
              <div className="flex items-center p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-colors duration-200">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center group-hover/item:from-blue-500/30 group-hover:item:to-indigo-500/30 group-hover:item:border-indigo-400/30 transition-all duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 ml-4">
                  <div className="text-sm font-medium truncate">{message.content.file.originalName}</div>
                  <div className="text-xs opacity-75">{(message.content.file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <a
                  href={message.content.file.url}
                  download={message.content.file.originalName}
                  className="ml-3 p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            )}

            <div className={`text-xs mt-2 ${isOwn ? "text-right text-white/80" : "text-left text-gray-400"}`}>
              <span className={`px-2 py-0.5 rounded-full ${isOwn ? "bg-white/10" : "bg-slate-700/60"} inline-flex items-center`}>
                <svg className="w-3 h-3 mr-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {messageTime}
                {message.isEdited && <span className="ml-1 italic">(edited)</span>}
              </span>
            </div>
          </div>

          <div
            className={`absolute ${isOwn ? "-left-16" : "-right-16"} top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10`}
          >
            <div className="flex flex-col gap-2">
              <button className="p-2.5 bg-slate-800/90 hover:bg-indigo-500/20 rounded-xl shadow-lg text-gray-400 hover:text-indigo-400 transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-indigo-400/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
              </button>
              <button className="p-2.5 bg-slate-800/90 hover:bg-violet-500/20 rounded-xl shadow-lg text-gray-400 hover:text-violet-400 transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-violet-400/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 16H5a2 2 0 01-2-2v-6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="relative mb-16">
        <div className="w-48 h-48 bg-gradient-to-br from-indigo-500/20 via-violet-600/20 to-indigo-600/20 rounded-3xl flex items-center justify-center text-8xl shadow-2xl shadow-indigo-500/20 animate-fade-in relative overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-transparent to-white/5 rounded-3xl"></div>
          <span className="relative z-10 drop-shadow-lg text-white/90">💬</span>
        </div>
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-violet-500/30 to-indigo-600/30 rounded-2xl animate-pulse shadow-xl flex items-center justify-center">
          <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      <div className="max-w-2xl space-y-8">
        <h3 className="text-6xl font-bold bg-gradient-to-r from-white via-indigo-200 to-violet-200 bg-clip-text text-transparent mb-8 text-balance animate-fade-in leading-tight">
          Welcome to ChatFlow!
        </h3>
        <p className="text-gray-300 text-xl leading-relaxed font-medium animate-fade-in px-4 max-w-xl mx-auto">
          {activeTab === "rooms"
            ? "Select a room to start chatting with the community and connect with others in real-time conversations."
            : "Select a conversation or start a new private chat to begin your messaging experience."}
        </p>

        <div className="mt-16 space-y-6">
          <div className="relative flex justify-center gap-8">
            <div className="w-4 h-4 bg-gradient-to-r from-indigo-500/80 to-indigo-600/80 rounded-full animate-bounce shadow-lg shadow-indigo-500/40"></div>
            <div className="w-4 h-4 bg-gradient-to-r from-violet-500/80 to-violet-600/80 rounded-full animate-bounce delay-100 shadow-lg shadow-violet-500/40"></div>
            <div className="w-4 h-4 bg-gradient-to-r from-indigo-500/80 to-violet-500/80 rounded-full animate-bounce delay-200 shadow-lg shadow-purple-500/40"></div>
            <div className="absolute -z-10 w-28 h-1.5 bg-gradient-to-r from-indigo-500/40 via-violet-500/40 to-indigo-500/40 blur-md rounded-full top-8"></div>
          </div>

          <div className="text-base text-gray-300 font-medium mt-4">
            {activeTab === "rooms" ? "Join a room to get started" : "Start a conversation"}
          </div>
        </div>
      </div>
    </div>
  )

  const renderChatHeader = () => {
    if (!selectedRoom && !selectedChat) return null

    return (
      <div
        className="p-6 border-b border-slate-700/60 flex justify-between items-center shadow-xl bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-2xl relative"
        style={{
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Add subtle highlight line at top of header */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
        
        <div className="flex items-center gap-4">
          <button
            className={`p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-500/30 transition-all duration-200 text-gray-300 hover:text-indigo-300 backdrop-blur-sm border border-white/10 hover:border-indigo-400/40 shadow-md ${
              sidebarCollapsed ? 'block' : 'md:hidden'
            }`}
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="relative group">
            {selectedRoom ? (
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl relative ring-4 ring-white/10 animate-pulse-glow overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 transition-opacity duration-300">{selectedRoom.name.charAt(0).toUpperCase()}</span>
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-indigo-400/0 group-hover:bg-indigo-400/20 transition-colors duration-500"></div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl overflow-hidden ring-4 ring-white/10 group-hover:ring-indigo-400/30 transition-all duration-300">
                {selectedChat.user.avatar ? (
                  <img
                    src={selectedChat.user.avatar || "/placeholder.svg"}
                    alt={selectedChat.user.username}
                    className="w-full h-full object-cover rounded-2xl transition-opacity duration-500"
                    onError={(e) => {
                      e.target.style.display = "none"
                      e.target.parentNode.innerHTML = `<span class="transition-opacity duration-300">${selectedChat.user.username.charAt(0).toUpperCase()}</span>`
                    }}
                  />
                ) : (
                  <span className="transition-opacity duration-300">{selectedChat.user.username.charAt(0).toUpperCase()}</span>
                )}
                
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-violet-400/0 group-hover:bg-violet-400/20 transition-colors duration-500"></div>
              </div>
            )}
            {selectedChat && (
              <div
                className={`absolute -bottom-1 -right-1 w-5 h-5 border-3 border-slate-900 rounded-full shadow-lg animate-pulse ${
                  selectedChat.user.status === "online"
                    ? "bg-emerald-500"
                    : selectedChat.user.status === "away"
                      ? "bg-amber-500"
                      : selectedChat.user.status === "busy"
                        ? "bg-red-500"
                        : "bg-gray-400"
                }`}
              ></div>
            )}
          </div>

          <div>
            <h3 className="font-bold text-white text-xl mb-1 bg-gradient-to-r from-white via-indigo-100 to-white bg-clip-text text-transparent">
              {selectedRoom ? selectedRoom.name : selectedChat.user.username}
            </h3>
            <div className="flex items-center gap-2">
              {selectedRoom ? (
                <div className="flex items-center gap-2 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30">
                  <svg className="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-indigo-200 font-medium">{selectedRoom.members?.length || 0} members</span>
                </div>
              ) : (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  selectedChat.user.status === "online" 
                    ? "bg-emerald-500/20 border border-emerald-400/30" 
                    : "bg-slate-700/60 border border-slate-600/40"
                }`}>
                  {selectedChat.user.status === "online" ? (
                    <>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                      <span className="text-sm text-emerald-200 font-medium">Active now</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-slate-300 font-medium">Last seen {formatTime(selectedChat.user.lastSeen)}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              className="p-3.5 bg-slate-800/80 hover:bg-indigo-500/30 rounded-xl transition-all duration-300 text-gray-300 hover:text-indigo-300 backdrop-blur-sm border border-slate-600/40 hover:border-indigo-400/40 shadow-md group"
              onClick={() => setShowDropdown(!showDropdown)}
              title="More options"
            >
              {/* Inner glow effect on hover */}
              <div className="absolute inset-0 rounded-xl bg-indigo-400/0 group-hover:bg-indigo-400/10 transition-colors duration-300"></div>
              
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="relative z-10 transition-opacity duration-300">
                <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
              </svg>
            </button>

            {showDropdown && (
              <div
                className="absolute right-0 mt-2 w-full sm:w-64 max-w-[90vw] py-3 bg-gradient-to-br from-slate-900/98 via-slate-800/96 to-slate-900/98 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl z-50 animate-fade-in-scale transition-all duration-400 overflow-hidden md:mt-3 left-0 sm:left-auto sm:right-0"
                style={{ backdropFilter: "blur(32px)" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-violet-500/5 to-indigo-600/8 pointer-events-none rounded-2xl"></div>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>

                <div className="relative z-10 space-y-0.5 px-3">
                  <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10 mb-2">
                    Chat Options
                  </div>

                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-indigo-500/20 hover:via-violet-500/15 hover:to-indigo-500/20 hover:text-indigo-200 rounded-xl flex items-center gap-3 transition-all duration-300 group/item hover:shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center group-hover/item:from-blue-500/30 group-hover/item:to-indigo-500/30 group-hover/item:border-indigo-400/30 transition-all duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Chat Info</div>
                      <div className="text-xs text-gray-400 group-hover:item:text-gray-300">
                        View conversation details
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:item:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-indigo-500/20 hover:via-purple-500/15 hover:to-indigo-500/20 hover:text-indigo-200 rounded-xl flex items-center gap-3 transition-all duration-300 group/item hover:transform hover:translate-x-1 hover:shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center group-hover/item:from-violet-500/30 group-hover/item:to-purple-500/30 group-hover/item:border-violet-400/30 transition-all duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Search Messages</div>
                      <div className="text-xs text-gray-400 group-hover:item:text-gray-300">Find content quickly</div>
                    </div>
                    <div className="opacity-0 group-hover:item:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-indigo-500/20 hover:via-purple-500/15 hover:to-indigo-500/20 hover:text-indigo-200 rounded-xl flex items-center gap-3 transition-all duration-300 group/item hover:transform hover:translate-x-1 hover:shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-white/10 flex items-center justify-center group-hover/item:from-emerald-500/30 group-hover/item:to-green-500/30 group-hover/item:border-emerald-400/30 transition-all duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Mark as Read</div>
                      <div className="text-xs text-gray-400 group-hover:item:text-gray-300">Clear notifications</div>
                    </div>
                    <div className="opacity-0 group-hover:item:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {/* Elegant divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-3 mx-4"></div>

                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-amber-500/20 hover:via-orange-500/15 hover:to-amber-500/20 hover:text-amber-200 rounded-xl flex items-center gap-4 transition-all duration-300 group/item hover:shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center group-hover:item:from-amber-500/30 group-hover:item:to-orange-500/30 group-hover:item:border-amber-400/30 transition-all duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Report Issue</div>
                      <div className="text-xs text-gray-400 group-hover:item:text-gray-300">
                        Flag inappropriate content
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:item:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {selectedRoom && (
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gradient-to-r hover:from-red-500/20 hover:via-rose-500/15 hover:to-red-500/20 hover:text-red-200 rounded-xl flex items-center gap-4 transition-all duration-300 group/item hover:shadow-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center group-hover/item:from-red-500/30 group-hover:item:to-rose-500/30 group-hover:item:border-red-400/30 transition-all duration-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">Leave Room</div>
                        <div className="text-xs text-gray-400 group-hover:item:text-gray-300">
                          Exit this conversation
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:item:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="p-4 bg-gradient-to-br from-slate-800/70 to-slate-700/60 hover:from-indigo-500/90 hover:to-violet-600/90 rounded-2xl transition-all duration-300 shadow-lg text-gray-300 hover:text-white backdrop-blur-xl border border-white/10 hover:border-indigo-400/30 hover:shadow-indigo-500/25"
            title="Search messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  if (!selectedRoom && !selectedChat) {
    return (
      <div className="flex-1 flex flex-col h-screen bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <div className="relative z-10 flex-1 flex items-center justify-center backdrop-blur-sm">{renderWelcome()}</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/6 via-violet-500/3 to-indigo-600/6"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-slate-800/40"></div>

        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
      </div>

      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500/60 via-violet-500/80 to-indigo-600/60"></div>

      <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 flex flex-col h-full min-h-0 backdrop-blur-sm pb-32">
        {renderChatHeader()}

        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-slate-600/60 scrollbar-track-transparent hover:scrollbar-thumb-indigo-500/40 transition-colors duration-500 scrollbar-w-1.5">
          {loadingError && (
            <div className="mx-auto mb-6 p-4 bg-red-500/20 backdrop-blur-xl border border-red-400/40 text-red-100 rounded-xl text-center">
              <div className="text-sm font-medium mb-2">Failed to load messages</div>
              <div className="text-xs text-red-200/80 mb-3">{loadingError}</div>
              <button
                onClick={() => loadMessages(true)}
                className="px-4 py-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          )}
          
          {hasMore && (
            <button
              className="mx-auto mb-10 py-4 px-8 bg-gradient-to-r from-indigo-500/80 to-violet-600/80 hover:from-indigo-500 hover:to-violet-600 backdrop-blur-xl border border-white/20 text-white rounded-xl transition-all duration-300 font-semibold shadow-xl hover:shadow-indigo-500/30 text-sm group relative overflow-hidden"
              style={{ backdropFilter: "blur(20px)" }}
              onClick={() => loadMessages()}
              disabled={loading}
            >
              {/* Background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/0 via-white/10 to-indigo-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {loading ? (
                <div className="flex items-center gap-3 relative z-10">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/40 border-t-white"></div>
                  <span>Loading messages...</span>
                </div>
              ) : (
                "Load More Messages"
              )}
            </button>
          )}

          <div className="flex-1 flex flex-col space-y-4">
            {messages.length === 0 && selectedRoom ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center bg-slate-800/30 rounded-2xl backdrop-blur-sm border border-slate-700/40">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/30">
                  <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Welcome to {selectedRoom.name}!</h3>
                <p className="text-gray-300 mb-6 max-w-md">This room is empty. Be the first to start the conversation!</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => document.querySelector('textarea')?.focus()}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-indigo-500/25"
                  >
                    Start Chatting
                  </button>
                  <button 
                    onClick={() => {}}
                    className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700/70 text-gray-300 rounded-xl font-medium transition-all duration-200 border border-slate-600/40"
                  >
                    Invite Members
                  </button>
                </div>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            <div ref={messagesEndRef} />
          </div>

          {typingUsers.length > 0 && (
            <div
              className="flex items-center gap-4 py-4 px-6 text-sm text-slate-300 bg-slate-800/50 backdrop-blur-xl mx-4 rounded-2xl border border-slate-700/30 animate-fade-in shadow-md mt-4"
              style={{ backdropFilter: "blur(20px)" }}
            >
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-150"></span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
              </div>
              <span className="font-medium">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </span>
            </div>
          )}
        </div>

      </div>
      
      <MessageInput
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        disabled={loading}
        selectedRoom={selectedRoom}
        selectedChat={selectedChat}
      />
    </div>
  )
}

export default MessageArea

