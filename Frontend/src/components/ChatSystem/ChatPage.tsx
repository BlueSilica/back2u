import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'

interface ChatPartner {
  roomId: string
  partnerEmail: string
  partnerName: string
  createdAt: string
  status: string
}

interface Message {
  messageId: string
  roomId: string
  senderEmail: string
  receiverEmail: string
  message: string
  timestamp: string
  status: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  contentType?: string
}

export default function ChatPage() {
  const { user } = useAuth()
  const [topOffset, setTopOffset] = useState<number>(64)
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([])
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string>('0')
  const [isPolling, setIsPolling] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch chat partners for the current user
  useEffect(() => {
    const fetchChatPartners = async () => {
      if (!user?.email) {
        console.log('❌ No user email found:', user)
        setLoading(false)
        return
      }

      console.log('🔍 Fetching chat partners for user email:', user.email)

      try {
        const url = `http://localhost:8080/chat/users/${encodeURIComponent(user.email)}/rooms`
        console.log('📡 Making API request to:', url)
        
        const response = await fetch(url)
        console.log('📥 API response status:', response.status)
        
        if (!response.ok) {
          throw new Error('Failed to fetch chat partners')
        }

        const data = await response.json()
        console.log('📊 API response data:', data)
        
        if (data.status === 'success') {
          console.log('✅ Chat partners received:', data.chatPartners?.length || 0)
          setChatPartners(data.chatPartners || [])
          // Auto-select first partner if available
          if (data.chatPartners && data.chatPartners.length > 0) {
            setSelectedPartner(data.chatPartners[0])
            console.log('👤 Auto-selected first partner:', data.chatPartners[0].partnerName)
          }
        } else {
          console.log('❌ API returned error status:', data)
          setError('Failed to load chat partners')
        }
      } catch (err) {
        console.error('💥 Error fetching chat partners:', err)
        setError('Failed to connect to chat service')
      } finally {
        setLoading(false)
      }
    }

    fetchChatPartners()
  }, [user])

  useEffect(() => {
    function updateOffset() {
      const header = document.querySelector('header') as HTMLElement | null
      const h = header ? Math.ceil(header.getBoundingClientRect().height) : 64
      setTopOffset(h)
    }

    updateOffset()
    window.addEventListener('resize', updateOffset)
    // also observe mutations to header size (e.g., responsive changes)
    let ro: ResizeObserver | undefined
    const headerEl = document.querySelector('header') as HTMLElement | null
    const win = window as Window & { ResizeObserver?: typeof ResizeObserver }
    if (headerEl && typeof win.ResizeObserver === 'function') {
      // ResizeObserver is available
      ro = new win.ResizeObserver(() => updateOffset())
      ro.observe(headerEl)
    }

    return () => {
      window.removeEventListener('resize', updateOffset)
      if (ro && headerEl) ro.unobserve(headerEl)
    }
  }, [])

  // Fetch messages for selected partner
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedPartner) {
        setMessages([])
        setLastMessageTimestamp('0')
        return
      }

      setMessagesLoading(true)
      console.log('📨 Fetching messages for room:', selectedPartner.roomId)

      try {
        const response = await fetch(`http://localhost:8080/chat/rooms/${selectedPartner.roomId}/messages`)
        if (!response.ok) {
          throw new Error('Failed to fetch messages')
        }

        const data = await response.json()
        console.log('📥 Messages received:', data)
        
        if (data.status === 'success') {
          const fetchedMessages = data.messages || []
          setMessages(fetchedMessages)
          
          // Update last message timestamp for polling
          if (fetchedMessages.length > 0) {
            const latestMessage = fetchedMessages[fetchedMessages.length - 1]
            setLastMessageTimestamp(latestMessage.timestamp)
          }
        } else {
          console.error('Failed to load messages:', data)
        }
      } catch (err) {
        console.error('Error fetching messages:', err)
      } finally {
        setMessagesLoading(false)
      }
    }

    fetchMessages()
  }, [selectedPartner])

  // Start/stop real-time polling
  useEffect(() => {
    const pollForNewMessages = async () => {
      if (!selectedPartner || isPolling) return

      setIsPolling(true)
      try {
        const response = await fetch(`http://localhost:8080/chat/rooms/${selectedPartner.roomId}/messages/since/${lastMessageTimestamp}`)
        if (!response.ok) {
          console.warn('Failed to poll for new messages')
          return
        }

        const data = await response.json()
        if (data.status === 'success' && data.messages && data.messages.length > 0) {
          console.log('🆕 New messages received:', data.messages.length)
          setMessages(prevMessages => {
            const newMessages = [...prevMessages, ...data.messages]
            // Update timestamp to latest message
            const latestMessage = data.messages[data.messages.length - 1]
            setLastMessageTimestamp(latestMessage.timestamp)
            return newMessages
          })
        }
      } catch (err) {
        console.warn('Error polling for new messages:', err)
      } finally {
        setIsPolling(false)
      }
    }

    if (selectedPartner && lastMessageTimestamp !== '0') {
      console.log('🔄 Starting real-time polling for room:', selectedPartner.roomId)
      pollingIntervalRef.current = window.setInterval(pollForNewMessages, 2000) // Poll every 2 seconds

      return () => {
        if (pollingIntervalRef.current) {
          console.log('⏹️ Stopping real-time polling')
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    }
  }, [selectedPartner, lastMessageTimestamp, isPolling])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message function with API integration
  const sendMessage = async () => {
    if (!input.trim() || !selectedPartner || !user?.email) return

    const messageText = input
    setInput('') // Clear input immediately for better UX

    console.log('📤 Sending message:', messageText)

    try {
      const response = await fetch('http://localhost:8080/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: selectedPartner.roomId,
          senderEmail: user.email,
          receiverEmail: selectedPartner.partnerEmail,
          message: messageText
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      console.log('✅ Message sent successfully:', data)
      
      if (data.status === 'success') {
        // Add the message to local state immediately
        const timestamp = Date.now().toString()
        const newMessage: Message = {
          messageId: data.messageId,
          roomId: selectedPartner.roomId,
          senderEmail: user.email,
          receiverEmail: selectedPartner.partnerEmail,
          message: messageText,
          timestamp: timestamp,
          status: 'sent'
        }
        setMessages(prev => [...prev, newMessage])
        setLastMessageTimestamp(timestamp) // Update timestamp for polling
      }
    } catch (err) {
      console.error('💥 Error sending message:', err)
      setInput(messageText) // Restore input if sending failed
            // You could show an error message to the user here
    }
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('📎 File selected:', file.name, 'Size:', file.size)
      setSelectedFile(file)
      
      // Automatically upload and send the file
      uploadAndSendFile(file)
    }
  }

  // Upload and send file function
  const uploadAndSendFile = async (file: File) => {
    if (!selectedPartner || !user?.email) return

    setIsUploading(true)
    console.log('📤 Uploading file:', file.name)

    try {
      // First, upload the file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('uploadedBy', user.email)
      formData.append('category', 'chat')

      const uploadResponse = await fetch('http://localhost:8080/files', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      const uploadData = await uploadResponse.json()
      console.log('✅ File uploaded successfully:', uploadData)

      if (uploadData.status === 'success') {
        // Now send a message with the file info
        const fileMessage = `📎 ${file.name}`
        
        const messageResponse = await fetch('http://localhost:8080/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomId: selectedPartner.roomId,
            senderEmail: user.email,
            receiverEmail: selectedPartner.partnerEmail,
            message: fileMessage,
            fileUrl: uploadData.fileUrl,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type
          })
        })

        if (!messageResponse.ok) {
          throw new Error('Failed to send file message')
        }

        const messageData = await messageResponse.json()
        console.log('✅ File message sent successfully:', messageData)

        if (messageData.status === 'success') {
          // Add the file message to local state
          const timestamp = Date.now().toString()
          const newMessage: Message = {
            messageId: messageData.messageId,
            roomId: selectedPartner.roomId,
            senderEmail: user.email,
            receiverEmail: selectedPartner.partnerEmail,
            message: fileMessage,
            timestamp: timestamp,
            status: 'sent',
            fileUrl: uploadData.fileUrl,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type
          }
          setMessages(prev => [...prev, newMessage])
          setLastMessageTimestamp(timestamp)
        }
      }
    } catch (err) {
      console.error('💥 Error uploading/sending file:', err)
      // You could show an error message to the user here
    } finally {
      setIsUploading(false)
      setSelectedFile(null)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle file attach button click
  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [])

  // Show loading state
  if (loading) {
    return (
      <div className="fixed left-0 right-0 bottom-0 bg-gray-50 flex items-center justify-center" style={{ top: `${topOffset}px` }}>
        <div className="text-gray-500">Loading chat...</div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed left-0 right-0 bottom-0 bg-gray-50 flex items-center justify-center" style={{ top: `${topOffset}px` }}>
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  // Show no chats state
  if (chatPartners.length === 0) {
    return (
      <div className="fixed left-0 right-0 bottom-0 bg-gray-50 flex items-center justify-center" style={{ top: `${topOffset}px` }}>
        <div className="text-center">
          <div className="text-gray-500 mb-4">No chat rooms found</div>
          <div className="text-sm text-gray-400">Create a chat room first to start messaging</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 bg-gray-50" style={{ top: `${topOffset}px` }}>
      <div className="h-full flex">
        <aside className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b font-semibold">Your Chats ({chatPartners.length})</div>
          <ul className="flex-1 overflow-auto">
            {chatPartners.map(partner => (
              <li
                key={partner.roomId}
                className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${selectedPartner?.roomId === partner.roomId ? 'bg-gray-100' : ''}`}
                onClick={() => setSelectedPartner(partner)}
              >
                <div className="font-medium">{partner.partnerName}</div>
                <div className="text-sm text-gray-500">{partner.partnerEmail}</div>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex-1 flex flex-col min-h-0">
          {selectedPartner ? (
            <>
              <header className="p-4 border-b flex items-center justify-between bg-white">
                <div>
                  <div className="font-semibold">Chat with {selectedPartner.partnerName}</div>
                  <div className="text-sm text-gray-500">{selectedPartner.partnerEmail}</div>
                </div>
                <div className="text-sm text-green-600">Online</div>
              </header>

              <div className="p-6 flex-1 overflow-auto bg-gray-50 pb-6">
                <div className="flex flex-col gap-4 w-full">
                  {messagesLoading && <div className="text-gray-400">Loading messages...</div>}
                  {!messagesLoading && messages.length === 0 && <div className="text-gray-400">No messages yet. Say hello 👋</div>}
                  {!messagesLoading && messages.map((m) => {
                    const isCurrentUser = m.senderEmail === user?.email
                    const senderName = isCurrentUser ? 'You' : selectedPartner.partnerName
                    const timestamp = new Date(parseInt(m.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    const isFileMessage = m.fileUrl && m.fileName
                    
                    return (
                      <div key={m.messageId} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-[70%] ${isCurrentUser ? 'bg-primary-500 text-white' : 'bg-white shadow'}`}>
                          <div className={`text-xs mb-1 ${isCurrentUser ? 'text-purple-200' : 'text-gray-500'}`}>
                            {senderName} • {timestamp}
                          </div>
                          
                          {isFileMessage ? (
                            <div className="space-y-2">
                              <div>{m.message}</div>
                              <div className={`border rounded-lg p-3 ${isCurrentUser ? 'border-purple-300 bg-purple-400/20' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                  <div className="text-2xl">
                                    {m.contentType?.startsWith('image/') ? '🖼️' : 
                                     m.contentType?.startsWith('video/') ? '🎥' : 
                                     m.contentType?.startsWith('audio/') ? '🎵' : 
                                     m.contentType?.includes('pdf') ? '📄' : '📎'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{m.fileName}</div>
                                    <div className={`text-xs ${isCurrentUser ? 'text-purple-200' : 'text-gray-500'}`}>
                                      {m.fileSize ? `${(m.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                                    </div>
                                  </div>
                                  <a
                                    href={m.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`px-3 py-1 text-xs rounded ${
                                      isCurrentUser 
                                        ? 'bg-white text-purple-600 hover:bg-purple-50' 
                                        : 'bg-purple-600 text-white hover:bg-purple-700'
                                    } transition-colors`}
                                  >
                                    Download
                                  </a>
                                </div>
                                
                                {/* Preview for images */}
                                {m.contentType?.startsWith('image/') && (
                                  <div className="mt-2">
                                    <img 
                                      src={m.fileUrl} 
                                      alt={m.fileName} 
                                      className="max-w-full max-h-48 rounded object-cover cursor-pointer"
                                      onClick={() => window.open(m.fileUrl, '_blank')}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>{m.message}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <footer className="p-4 border-t bg-white flex-shrink-0">
                <div className="flex gap-2 w-full">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                  />
                  
                  {/* File attach button */}
                  <button
                    type="button"
                    onClick={handleAttachClick}
                    disabled={isUploading}
                    className="px-3 py-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg border border-gray-300 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Attach file"
                  >
                    {isUploading ? (
                      <div className="animate-spin w-5 h-5">⏳</div>
                    ) : (
                      <div className="w-5 h-5">📎</div>
                    )}
                  </button>
                  
                  <input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={isUploading}
                    className="flex-1 px-4 py-3 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" 
                    placeholder={isUploading ? 'Uploading file...' : `Message ${selectedPartner.partnerName}...`} 
                  />
                  <button
                    type="button"
                    aria-label="Send message"
                    onClick={sendMessage}
                    disabled={!input.trim() || isUploading}
                    className="px-5 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : 'Send'}
                  </button>
                </div>
                
                {/* Upload progress indicator */}
                {isUploading && (
                  <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                    <div className="animate-spin w-4 h-4">⏳</div>
                    Uploading {selectedFile?.name}...
                  </div>
                )}
              </footer>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-500">Select a chat to start messaging</div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
