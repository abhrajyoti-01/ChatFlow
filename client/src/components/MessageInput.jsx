import { useState, useRef, useEffect } from "react"
import { useSocket } from "../context/SocketContext"

const MessageInput = ({ onSendMessage, onFileUpload, disabled = false, selectedRoom }) => {
  const [message, setMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const emojiPickerRef = useRef(null)

  const { startTyping, stopTyping } = useSocket()

  const emojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
    "😏",
    "😒",
    "😞",
    "😔",
    "😟",
    "😕",
    "🙁",
    "☹️",
    "😣",
    "😖",
    "😫",
    "😩",
    "🥺",
    "😢",
    "😭",
    "😤",
    "😠",
    "😡",
    "🤬",
    "🤯",
    "😳",
    "🥵",
    "🥶",
    "😱",
    "😨",
    "😰",
    "😥",
    "😓",
    "🤗",
    "🤔",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "👍",
    "👎",
    "👏",
    "🙌",
    "👐",
    "🤝",
    "🙏",
    "💯",
    "🔥",
    "✨",
    "🎉",
    "🎊",
  ]

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim() || disabled) return

    // Stop typing indicator before sending
    if (isTyping && selectedRoom) {
      setIsTyping(false)
      stopTyping(selectedRoom._id)
    }

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    onSendMessage({
      content: { text: message.trim() },
      messageType: "text",
    })

    setMessage("")
    adjustTextareaHeight()
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Cleanup typing timeout on component unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTyping && selectedRoom) {
        stopTyping(selectedRoom._id)
      }
    }
  }, [selectedRoom, isTyping, stopTyping])

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragIn = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }

  const handleDragOut = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      handleFileUpload(file)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileUpload(file)
    }
    e.target.value = "" // Reset input
  }

  const handleFileUpload = (file) => {
    // File size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB")
      return
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    if (!allowedTypes.includes(file.type)) {
      alert("File type not supported. Please upload images, PDFs, or documents.")
      return
    }

    onFileUpload(file)
  }

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "3.5rem" // Reset to min-height
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 128 // 8rem in pixels
      const newHeight = Math.min(scrollHeight, maxHeight)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value)
    adjustTextareaHeight()

    // Handle typing indicators
    if (selectedRoom && e.target.value.trim() && !isTyping) {
      setIsTyping(true)
      startTyping(selectedRoom._id)
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && selectedRoom) {
        setIsTyping(false)
        stopTyping(selectedRoom._id)
      }
    }, 1000) // Stop typing after 1 second of inactivity
  }

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-50 border-t-2 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-3xl px-6 py-6 ${dragActive ? "from-indigo-900/60 via-violet-800/50 to-indigo-900/60 border-t-indigo-400/70" : "border-t-slate-700/50"} shadow-2xl`}
      style={{ backdropFilter: "blur(32px)" }}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400/90 to-transparent"></div>
      <div className="absolute top-0.5 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent"></div>

      {dragActive && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-violet-800/50 to-indigo-900/60 backdrop-blur-2xl flex items-center justify-center z-20 rounded-t-3xl border-2 border-dashed border-indigo-400/70 animate-fade-in shadow-2xl"
          style={{ backdropFilter: "blur(24px)" }}
        >
          <div className="text-center animate-fade-in-scale">
            <div className="relative mb-6">
              <div className="text-6xl animate-bounce">📎</div>
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <h3 className="text-white font-bold text-2xl mb-3 tracking-wide">Drop file to share</h3>
            <p className="text-indigo-200 text-base opacity-90 max-w-sm">
              Support for images, documents, PDFs and more
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0" ref={emojiPickerRef}>
            <button
              type="button"
              className="w-14 h-14 rounded-xl bg-slate-800/80 hover:bg-indigo-500/30 flex items-center justify-center text-gray-300 hover:text-indigo-300 transition-all duration-300 backdrop-blur-sm border border-slate-600/40 hover:border-indigo-400/40 shadow-lg hover:shadow-indigo-500/30 group relative"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Add Emoji"
            >
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-xl bg-indigo-400/0 group-hover:bg-indigo-400/10 transition-colors duration-300"></div>
              
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="relative z-10">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z" />
              </svg>
            </button>

            {showEmojiPicker && (
              <div
                className="absolute bottom-full left-0 mb-4 p-5 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-2xl z-30 w-96 overflow-hidden animate-fade-in-scale"
                style={{ backdropFilter: "blur(24px)" }}
              >
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-bold text-white/95 flex items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                        className="text-indigo-400"
                      >
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z" />
                      </svg>
                      <span>Choose an emoji</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(false)}
                      className="w-8 h-8 rounded-xl bg-slate-800/70 hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all duration-200 border border-white/10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-10 gap-2.5 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent pr-2">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-10 h-10 text-xl flex items-center justify-center rounded-xl hover:bg-indigo-500/20 transition-all duration-200 hover:scale-110"
                        onClick={() => handleEmojiSelect(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="w-14 h-14 rounded-xl bg-slate-800/80 hover:bg-violet-500/30 flex items-center justify-center text-gray-300 hover:text-violet-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-slate-600/40 hover:border-violet-400/40 shadow-lg hover:shadow-violet-500/30 group relative flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            title="Attach File"
            disabled={disabled}
          >
            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-xl bg-violet-400/0 group-hover:bg-violet-400/10 transition-colors duration-300"></div>
            
            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <div className="flex-1 relative group">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full px-6 py-4 bg-gradient-to-br from-slate-800/80 via-slate-700/70 to-slate-800/80 backdrop-blur-3xl border-2 border-slate-600/50 focus:border-indigo-400/80 hover:border-slate-500/70 rounded-2xl text-white/95 placeholder-gray-400 focus:placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 resize-none shadow-xl focus:shadow-indigo-500/20 focus:shadow-2xl min-h-[3.5rem] max-h-[8rem] text-base leading-relaxed font-medium focus:bg-gradient-to-br focus:from-slate-800/90 focus:via-slate-700/80 focus:to-slate-800/90"
              style={{ backdropFilter: "blur(32px)" }}
              disabled={disabled}
              rows={1}
            />

            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400/0 via-indigo-400/12 to-indigo-400/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-400/0 via-transparent to-indigo-400/8 opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="absolute -bottom-1 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>

            {message.length > 0 && (
              <div className="absolute bottom-3 right-4 text-xs text-gray-400 bg-slate-900/60 px-2 py-1 rounded-lg backdrop-blur-sm">
                {message.length}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg relative overflow-hidden group flex-shrink-0 ${
              !message.trim() || disabled
                ? "bg-slate-700/70 text-gray-500 cursor-not-allowed opacity-60"
                : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700 hover:shadow-indigo-500/40 transform hover:scale-105 active:scale-95"
            }`}
            disabled={!message.trim() || disabled}
            title="Send Message"
          >
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {/* Circle pulse animation on hover */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-150 transition-all duration-700"></div>
            </div>
            
            {disabled ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white relative z-10"></div>
            ) : (
              <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {(isTyping || message.length > 0) && (
          <div className="flex items-center justify-between text-sm text-gray-300 px-1 pt-4">
            <div className="flex items-center gap-2">
              {isTyping && (
                <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-full shadow-inner border border-slate-700/50">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce shadow-sm shadow-indigo-400/50"></div>
                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-100 shadow-sm shadow-violet-400/50"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200 shadow-sm shadow-indigo-400/50"></div>
                  </div>
                  <span className="text-indigo-300 font-medium">typing...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {message.length > 500 && (
                <span className={`font-medium px-2 py-0.5 rounded-md ${message.length > 1000 ? "text-amber-300 bg-amber-900/30" : "text-gray-300 bg-slate-800/60"}`}>
                  {message.length}/2000
                </span>
              )}
              <span className="text-gray-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/40">Press Enter to send</span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.doc,.docx,.csv,.xls,.xlsx"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </form>
    </div>
  )
}

export default MessageInput


