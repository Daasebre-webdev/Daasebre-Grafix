'use client'
import { useState, useRef, useEffect, useCallback } from 'react' // Added useCallback
import { useUser } from '../context/UserContext'
import styles from './chat.module.css'

interface Message {
  id: string;
  sender: 'user' | 'ai' | 'error';
  text: string;
  timestamp: Date;
  isEditing?: boolean;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

export default function PremiumChat() {
  const { user } = useUser()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInputActive, setIsInputActive] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash')
  const [temperature, setTemperature] = useState(0.7)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Gemini Models available
  const availableModels = [
    { id: 'gemini-1.5-flash', name: 'Gemini Flash', description: 'Fastest response time' },
    { id: 'gemini-1.5-pro', name: 'Gemini Pro', description: 'Balanced performance' },
  ]

  // Generate unique IDs
  const generateId = () => Math.random().toString(36).substring(2, 11)

  // Get user-specific storage key - wrapped in useCallback to memoize
  const getStorageKey = useCallback(() => {
    return user ? `chatHistory-${user.id}` : 'chatHistory-anonymous';
  }, [user]); // Now depends on user

  // Load history from localStorage for current user
  useEffect(() => {
    if (!user) {
      setChatHistory([]);
      return;
    }
    
    const storageKey = getStorageKey();
    const savedHistory = localStorage.getItem(storageKey)
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        setChatHistory(Array.isArray(parsed) ? parsed : [])
      } catch (error) {
        console.error('Failed to load chat history:', error)
      }
    } else {
      setChatHistory([])
    }
  }, [user, getStorageKey]) // Added getStorageKey to dependencies

  // Clear messages when user logs out
  useEffect(() => {
    if (!user) {
      setMessages([]);
    }
  }, [user]);

  // Save history to localStorage for current user
  const saveHistory = (newMessages: Message[]) => {
    if (!user) return; // Don't save history if no user is logged in
    
    const newHistoryItem: ChatHistoryItem = {
      id: generateId(),
      title: newMessages[0]?.text.substring(0, 30) || 'New Chat',
      date: new Date().toISOString(),
      messages: newMessages
    }
    
    const updatedHistory = [...chatHistory, newHistoryItem]
    setChatHistory(updatedHistory)
    
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
  }


  // Message actions
  const startEditing = (id: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? {...msg, isEditing: true} : msg
    ))
    setEditContent(messages.find(msg => msg.id === id)?.text || '')
  }

  const cancelEdit = (id: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? {...msg, isEditing: false} : msg
    ))
  }

  const saveEdit = (id: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? {...msg, text: editContent, isEditing: false} : msg
    ))
  }

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const clearHistory = () => {
    if (confirm('Clear all chat history for your account?')) {
      setChatHistory([])
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isPaused || isLoading) return

    const userMessage: Message = {
      id: generateId(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`
        },
        body: JSON.stringify({ 
          message: input,
          history: messages.slice(-6).map(m => m.text),
          model: selectedModel,
          temperature: temperature
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Request failed (${response.status})`)
      }
      
      const data = await response.json()
      const aiMessage: Message = {
        id: generateId(),
        sender: 'ai',
        text: data.text,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
      saveHistory([...messages, userMessage, aiMessage])

    } catch (error) {
      setMessages(prev => [...prev, {
        id: generateId(),
        sender: 'error',
        text: `Error: ${error instanceof Error ? error.message : 'Request failed'}. Please try again.`,
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  // Auto-scroll and focus handling
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isInputActive) {
      inputRef.current?.focus()
    }
  }, [isInputActive])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`
    }
  }, [input])

  return (
    <div className={styles.container}>
      {/* App Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={styles.hamburgerButton}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Chat History</span>
          </button>
          
          <div className={styles.titleContainer}>
            <h1 className={styles.title}>Project Pulse</h1>
            <p className={styles.subtitle}>
              {user ? `Welcome, ${user.name}` : 'Premium AI Assistant'}
            </p>
          </div>
          
          <div className={styles.controls}>
            <div className={styles.modelSelector}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={styles.modelButton}
              >
                <span>{availableModels.find(m => m.id === selectedModel)?.name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isMenuOpen && (
                <div className={styles.modelMenu}>
                  <div className={styles.modelHeader}>AI Model</div>
                  {availableModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id)
                        setIsMenuOpen(false)
                      }}
                      className={`${styles.modelOption} ${
                        selectedModel === model.id ? styles.modelOptionActive : ''
                      }`}
                    >
                      <div className={styles.modelName}>{model.name}</div>
                      <div className={styles.modelDescription}>{model.description}</div>
                    </button>
                  ))}
                  <div className={styles.temperatureControl}>
                    <div className={styles.temperatureLabel}>
                      <span>Creativity: {temperature.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className={styles.temperatureSlider}
                    />
                    <div className={styles.temperatureLabels}>
                      <span>Precise</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className={`${styles.pauseButton} ${isPaused ? styles.pauseButtonActive : ''}`}
              title={isPaused ? 'Resume chat' : 'Pause chat'}
            >
              {isPaused ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Mobile Overlay */}
        {showHistory && (
          <div 
            className={styles.sidebarOverlay}
            onClick={() => setShowHistory(false)}
          />
        )}
        
        {/* Sidebar History */}
        <div className={`${styles.sidebar} ${showHistory ? styles.open : ''}`}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>Your Chats</h3>
            <div className={styles.sidebarActions}>
              <button 
                onClick={() => {
                  setMessages([])
                  setShowHistory(false)
                  setIsInputActive(true)
                }}
                className={styles.sidebarButton}
                title="New Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button 
                onClick={clearHistory}
                className={`${styles.sidebarButton} ${styles.clearButton}`}
                title="Clear All"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            {/* Mobile Close Button */}
            <button 
              className={styles.sidebarClose}
              onClick={() => setShowHistory(false)}
              title="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className={styles.historyList}>
            {chatHistory.length > 0 ? (
              [...chatHistory].reverse().map((history) => (
                <button
                  key={history.id}
                  className={styles.historyItem}
                  onClick={() => {
                    setMessages(history.messages)
                    setShowHistory(false)
                  }}
                >
                  <div className={styles.historyTitle}>{history.title}</div>
                  <div className={styles.historyDate}>
                    {new Date(history.date).toLocaleString()}
                  </div>
                </button>
              ))
            ) : (
              <div className={styles.emptyHistory}>
                No chat history yet
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={styles.chatArea}>
          {/* Messages Container */}
          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.welcomeContainer}>
                <div className={styles.welcomeCard}>
                  <div className={styles.welcomeIcon}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className={styles.welcomeTitle}>Project Pulse</div>
                  <div className={styles.welcomeSubtitle}>
                    {user ? `Welcome, ${user.name}` : 'Premium AI Assistant'}
                  </div>
                  <p className={styles.welcomeText}>Ask me anything about your project, tasks, or team updates</p>
                  <div className={styles.suggestionGrid}>
                    <button
                      onClick={() => {
                        setIsInputActive(true)
                        setInput('Can you help me analyze this project timeline?')
                      }}
                      className={styles.suggestionButton}
                    >
                      Project Analysis
                    </button>
                    <button
                      onClick={() => {
                        setIsInputActive(true)
                        setInput('What are the best practices for task prioritization?')
                      }}
                      className={styles.suggestionButton}
                    >
                      Task Prioritization
                    </button>
                    <button
                      onClick={() => {
                        setIsInputActive(true)
                        setInput('Generate a status report for our current sprint')
                      }}
                      className={styles.suggestionButton}
                    >
                      Status Report
                    </button>
                    <button
                      onClick={() => {
                        setIsInputActive(true)
                        setInput('Suggest some team collaboration improvements')
                      }}
                      className={styles.suggestionButton}
                    >
                      Team Collaboration
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.messages}>
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`${styles.messageContainer} ${
                      msg.sender === 'user' ? styles.userMessageContainer : styles.aiMessageContainer
                    }`}
                  >
                    <div 
                      className={`${styles.messageBubble} ${
                        msg.sender === 'user' 
                          ? styles.userMessageBubble 
                          : msg.sender === 'error'
                            ? styles.errorMessageBubble
                            : styles.aiMessageBubble
                      }`}
                    >
                      {msg.isEditing ? (
                        <div className={styles.editContainer}>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className={styles.editTextarea}
                            rows={3}
                            autoFocus
                          />
                          <div className={styles.editActions}>
                            <button 
                              onClick={() => saveEdit(msg.id)}
                              className={styles.saveButton}
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => cancelEdit(msg.id)}
                              className={styles.cancelEditButton}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={styles.messageContent}>{msg.text}</div>
                          <div className={styles.messageFooter}>
                            <span className={styles.messageTime}>
                              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <div className={styles.messageActions}>
                              {msg.sender === 'user' ? (
                                <>
                                  <button 
                                    onClick={() => startEditing(msg.id)}
                                    className={styles.actionButton}
                                    title="Edit"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => deleteMessage(msg.id)}
                                    className={styles.actionButton}
                                    title="Delete"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <button 
                                  onClick={() => copyToClipboard(msg.text)}
                                  className={styles.actionButton}
                                  title="Copy"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className={styles.typingIndicator}>
                    <div className={styles.typingBubble}>
                      <div className={styles.typingContent}>
                        <div className={styles.typingDots}>
                          <div className={styles.typingDot}></div>
                          <div className={styles.typingDot}></div>
                          <div className={styles.typingDot}></div>
                        </div>
                        <span className={styles.typingText}>AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {(isInputActive || messages.length > 0) && (
            <div className={styles.inputArea}>
              <form 
                onSubmit={handleSubmit}
                className={styles.inputForm}
              >
                <div className={styles.inputContainer}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isPaused ? "Chat is paused - click play to resume" : "Type your message..."}
                    className={styles.inputField}
                    disabled={isPaused || isLoading}
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                  />
                  <div className={styles.inputActions}>
                    <button
                      type="button"
                      onClick={() => setInput('')}
                      className={styles.clearInputButton}
                      disabled={!input.trim()}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      type="submit"
                      disabled={!input.trim() || isPaused || isLoading}
                      className={styles.submitButton}
                    >
                      {isLoading ? (
                        <div className={styles.spinner} />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className={styles.inputMeta}>
                  <span>
                    {selectedModel} · {temperature.toFixed(1)} creativity
                  </span>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}