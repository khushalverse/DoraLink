import React, { useState, useEffect, useRef } from 'react';
import { callAI, buildSystemPrompt } from '../services/aiService';
import { useNavigate } from 'react-router-dom';
import {
  Menu, SquarePen, BarChart2, Wrench, Search,
  RotateCcw, BookOpen, Lightbulb, PenLine, FileText,
  Plus, Mic, ArrowUp, ChevronDown, MoreVertical, LogOut, Trash2, Camera, ImageIcon, X, Paperclip
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveChat, saveMessage, getUserChats, getChatMessages, deleteChat, saveMemory, getUserMemory } from '../services/supabase';

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userName = user?.user_metadata?.full_name 
    || user?.email?.split('@')[0] 
    || 'friend';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [userMemory, setUserMemory] = useState([]);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);
  const [showMicPermission, setShowMicPermission] = useState(false);

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedPreview, setAttachedPreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsRef = useRef(null);

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(
    localStorage.getItem('doralink_custom_key') || ''
  );

  useEffect(() => {
    const handleClick = (e) => {
      if(settingsRef.current && 
         !settingsRef.current.contains(e.target)) {
        setShowSettingsMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, []);

  const openCamera = () => {
    cameraRef.current.click();
    setShowAttachMenu(false);
  };
  const openGallery = () => {
    galleryRef.current.click();
    setShowAttachMenu(false);
  };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    setAttachedFile(file);
    if(file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => 
        setAttachedPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setAttachedPreview(null);
    }
  };

  const startVoiceInput = async () => {
    try {
      await navigator.mediaDevices.getUserMedia(
        { audio: true }
      )
    } catch(err) {
      setShowMicPermission(true)
      return
    }

    const SpeechRecognition = 
      window.SpeechRecognition || 
      window.webkitSpeechRecognition
      
    if(!SpeechRecognition) {
      alert('Chrome browser use karo voice ke liye!')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    setIsListening(true)

    recognition.onresult = (event) => {
      let transcript = ''
      for(let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInputValue(transcript)
      recognition.stop()
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (e) => {
      console.log('Voice error:', e.error)
      setIsListening(false)
      if(e.error === 'not-allowed') {
        alert('Mic permission denied! Phone settings mein allow karo.')
      }
    }

    recognition.start()
  };

  useEffect(() => {
    if (user) {
      loadUserChats();
      loadUserMemory();
    }
  }, [user]);

  const loadUserMemory = async () => {
    try {
      const memories = await getUserMemory(user.id);
      setUserMemory(memories);
    } catch(err) {
      console.error(err);
    }
  };

  const loadUserChats = async () => {
    try {
      const dbChats = await getUserChats(user.id);
      setSavedChats(dbChats);
    } catch (err) {
      console.error('Error loading chats:', err);
    }
  };

  const loadChat = async (chat) => {
    try {
      const msgs = await getChatMessages(chat.id);
      const formatted = msgs.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content
      }));
      setMessages(formatted);
      setCurrentChatId(chat.id);
      setIsSidebarOpen(false);
    } catch(err) {
      console.error('Error loading chat messages:', err);
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation()
    try {
      await deleteChat(chatId)
      setSavedChats(prev => 
        prev.filter(c => c.id !== chatId)
      )
      if(currentChatId === chatId) {
        setMessages([])
        setCurrentChatId(null)
        setIsSidebarOpen(false)
      }
    } catch(err) {
      console.error('Delete failed:', err)
    }
  };

  // Synchronous lock to prevent duplicate API calls (state updates are async)
  const isLoadingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const stopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
    isLoadingRef.current = false;
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatAIMessage = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '');
  };

  const handleScroll = (e) => {
    const el = e.target;
    // If user is within 50px of bottom, consider them NOT scrolled up
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setUserScrolled(!isAtBottom);
  };

  useEffect(() => {
    if (!userScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, userScrolled]);

  const sendToGemini = async (userMessage, history) => {
    const userName = user?.user_metadata?.full_name 
      || user?.email?.split('@')[0] 
      || 'friend'
    const systemPrompt = buildSystemPrompt(userName)
    return await callAI(userMessage, systemPrompt, history)
  }


  const parseAndSaveMemory = async (response) => {
    const memoryRegex = /\[MEMORY:(\w+)=([^\]]+)\]/g;
    let match;
    while((match = memoryRegex.exec(response)) !== null) {
      await saveMemory(user.id, match[1], match[2]);
    }
    const memories = await getUserMemory(user.id);
    setUserMemory(memories);
    return response.replace(/\[MEMORY:[^\]]+\]/g, '').trim();
  };

  const typeMessage = async (msgId, fullText, allMessages) => {
    let displayed = ''
    for(let i = 0; i < fullText.length; i++) {
      displayed += fullText[i]
      setMessages(prev => prev.map(m => 
        m.id === msgId 
          ? { ...m, content: displayed } 
          : m
      ))
      await new Promise(r => setTimeout(r, 15))
    }
  }

  const handleSend = async (textToUse) => {
    let text = typeof textToUse === 'string' ? textToUse.trim() : inputValue.trim();
    
    if(!text && !attachedFile) {
      setShowEmptyWarning(true)
      setTimeout(() => setShowEmptyWarning(false), 2000)
      return
    }

    // GUARD: Synchronous lock prevents any duplicate calls
    if (isLoadingRef.current) {
      console.log('[DoraLink] handleSend blocked - empty or already loading');
      return;
    }

    if (attachedFile) {
        text = text + "\n[Image attached: " + attachedFile.name + "]";
    }

    // Lock immediately (synchronous - unlike setState)
    isLoadingRef.current = true;
    setInputValue('');
    setIsTyping(true);
    setUserScrolled(false); // Reset scroll on new message

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      attachedPreview: attachedPreview
    };
    
    setAttachedFile(null);
    setAttachedPreview(null);
    setShowAttachMenu(false);

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      // Create new chat if first message
      let chatId = currentChatId;
      if (!chatId) {
        const newChat = await saveChat(user.id, text.slice(0, 40));
        chatId = newChat.id;
        setCurrentChatId(chatId);
        loadUserChats();
      }

      // Save user message
      await saveMessage(chatId, 'user', text);

      // Show typing dots indicator
      const typingMsg = { id: 'typing', role: 'typing', content: '' };
      setMessages([...updatedMessages, typingMsg]);

      // ONE API call - guarded by isLoadingRef
      const rawReply = await sendToGemini(text, updatedMessages);
      
      const reply = await parseAndSaveMemory(rawReply);

      // Save AI message
      await saveMessage(chatId, 'ai', reply);

      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        content: '' // starts empty, filled by typeMessage
      };
      
      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);

      // Reload chats
      loadUserChats();

      // Animate text in - uses functional setMessages to avoid stale state
      await typeMessage(aiMsg.id, reply, finalMessages);

    } catch (err) {
      console.error('[DoraLink] API Error:', err.message);
      
      let errorContent = "Oops! Network issue ho gaya! 😅 Dobara try karo!";
      if (err.message && err.message.includes('API_404')) {
        errorContent = "Oops! Wrong API endpoint hai! 😅 Model nahi mila.";
      } else if (err.message && err.message.includes('API_429')) {
        errorContent = "Bahut zyada requests! 😅 Thoda wait karo aur dobara try karo!";
      }

      const errorMsg = {
        id: Date.now() + 1,
        role: 'ai',
        content: errorContent
      };
      const finalErrMessages = [...updatedMessages, errorMsg];
      setMessages(finalErrMessages);
    } finally {
      // Always release the lock
      isLoadingRef.current = false;
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (text) => {
    handleSend(text);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setIsSidebarOpen(false);
  };

  return (
    <>
      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes slideInUp {
          from { transform: translateY(100%) }
          to { transform: translateY(0) }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
        .messages-container::-webkit-scrollbar {
            display: none;
          }
          .messages-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
      `}</style>

      <div className="bg-[#F0F9FF] text-[#1a1a1a] font-sans selection:bg-[#00A8D6] selection:text-white" style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden' }}>

        {/* OVERLAY - shown when sidebar open */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 40
            }}
          />
        )}

        {/* ATTACH MENU OVERLAY */}
        {showAttachMenu && (
          <div
            onClick={() => setShowAttachMenu(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 15 }}
          />
        )}

        {/* SIDEBAR */}
        <div className="shadow-2xl overflow-hidden" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '280px',
          background: 'white',
          zIndex: 50,
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          overflowY: 'auto'
        }}>
          {/* SIDEBAR DECORATIVE BACKGROUND */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute bg-[#00A8D6] opacity-[0.08]" style={{ width: '120px', height: '120px', borderRadius: '50%', top: '-40px', right: '-40px' }} />
            <div className="absolute bg-[#00A8D6] opacity-[0.06]" style={{ width: '150px', height: '150px', borderRadius: '40% 60% 50% 50%', bottom: '60px', left: '-60px' }} />
            <div className="absolute bg-[#00A8D6] opacity-[0.20]" style={{ width: '10px', height: '10px', borderRadius: '50%', top: '20%', right: '15%' }} />
            <div className="absolute bg-[#FFD700] opacity-[0.25]" style={{ width: '8px', height: '8px', borderRadius: '50%', top: '50%', right: '10%' }} />
            <div className="absolute bg-[#00A8D6] opacity-[0.15]" style={{ width: '12px', height: '12px', borderRadius: '50%', bottom: '25%', left: '10%' }} />
          </div>

          <div className="p-4 flex flex-col h-full relative z-10">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-[#F3F4F6] rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#00A8D6]"
              />
            </div>
            <button
              onClick={startNewChat}
              className="flex items-center justify-between w-full py-2 px-3 hover:bg-gray-100 rounded-lg group transition-colors"
            >
              <span className="font-medium text-sm">New Chat</span>
              <SquarePen className="w-5 h-5 text-[#6b7280] group-hover:text-[#1a1a1a]" />
            </button>
            <div className="my-4 border-t border-gray-100" />
            <div className="space-y-1 mb-6">
              <button onClick={() => navigate('/habits')} className="flex items-center w-full py-2 px-3 hover:bg-gray-100 rounded-lg text-[#1a1a1a]">
                <BarChart2 className="w-5 h-5 mr-3 text-[#6b7280]" />
                <span className="text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>Habit Tracker</span>
              </button>
              <button className="flex items-center w-full py-2 px-3 hover:bg-gray-100 rounded-lg text-[#1a1a1a]">
                <Wrench className="w-5 h-5 mr-3 text-[#6b7280]" />
                <span className="text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>Gadgets</span>
              </button>
            </div>
            <div className="my-2 border-t border-gray-100" />
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-xs font-semibold text-[#6b7280] px-3 mb-2 uppercase tracking-wider">Recent</h3>
              <div className="space-y-1 px-2">
                {savedChats.length === 0 ? (
                  <p style={{
                    fontSize:'13px',
                    color:'#9ca3af',
                    padding:'8px 12px'
                  }}>No chats yet</p>
                ) : (
                  savedChats.map(chat => (
                    <div key={chat.id}
                      onClick={() => loadChat(chat)}
                      style={{
                        padding:'10px 12px',
                        borderRadius:'10px',
                        cursor:'pointer',
                        fontSize:'14px',
                        color: currentChatId === chat.id ? '#00A8D6' : '#1a1a1a',
                        background: currentChatId === chat.id ? '#E0F4FB' : 'transparent',
                        whiteSpace:'nowrap',
                        overflow:'hidden',
                        textOverflow:'ellipsis',
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                        transition:'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='#F0F9FF'}
                      onMouseLeave={e => e.currentTarget.style.background = currentChatId === chat.id ? '#E0F4FB' : 'transparent'}
                    >
                      <span style={{
                        overflow:'hidden',
                        textOverflow:'ellipsis'
                      }}>
                        {chat.title}
                      </span>
                      <button
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        style={{
                          background:'none',
                          border:'none',
                          cursor:'pointer',
                          color:'#9ca3af',
                          padding:'2px',
                          flexShrink:0
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between px-2">
              <div className="flex items-center overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00A8D6] to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {(user?.user_metadata?.full_name || user?.email || 'K')[0].toUpperCase()}
                </div>
                <span className="ml-3 text-sm font-medium truncate" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || userName}
                </span>
              </div>
              <button 
                onClick={logout}
                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT - never moves */}
        <div className="flex flex-col h-screen overflow-hidden" 
          onTouchStart={(e) => {
            setTouchStartX(e.touches[0].clientX)
            setTouchStartY(e.touches[0].clientY)
          }}
          onTouchEnd={(e) => {
            const deltaX = e.changedTouches[0].clientX - touchStartX
            const deltaY = e.changedTouches[0].clientY - touchStartY
            
            // Only trigger if horizontal swipe and swipe started from left edge (0-50px)
            if(deltaX > 60 && Math.abs(deltaY) < 80 && touchStartX < 50) {
              setIsSidebarOpen(true)
            }
            // Swipe left to close sidebar
            if(deltaX < -60 && Math.abs(deltaY) < 80) {
              setIsSidebarOpen(false)
            }
          }}
          style={{
          width: '100%',
          minHeight: '100vh',
          position: 'relative',
          paddingTop: '70px'
        }}>

          {/* FIXED HEADER - ChatGPT pill-style */}
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: 'linear-gradient(to bottom, rgba(240,249,255,1) 0%, rgba(240,249,255,0.9) 50%, rgba(240,249,255,0) 100%)',
            pointerEvents: 'none'
          }}>
            {/* LEFT - Hamburger solid circle */}
            <button onClick={() => setIsSidebarOpen(true)}
              style={{
                width:'44px', height:'44px',
                borderRadius:'50%',
                background:'#E0F4FB',
                border:'1.5px solid #B8E4F5',
                cursor:'pointer',
                display:'flex', alignItems:'center',
                justifyContent:'center',
                pointerEvents: 'auto'
              }}>
              <Menu size={22} color="#00A8D6" />
            </button>

            {/* CENTER - DoraLink solid pill */}
            <div style={{
              display:'flex',
              alignItems:'center',
              gap:'6px',
              background:'#E0F4FB',
              border:'1.5px solid #B8E4F5',
              borderRadius:'28px',
              padding:'10px 18px',
              cursor:'pointer',
              pointerEvents: 'auto'
            }}>
              <span style={{
                fontFamily:"'Nunito', sans-serif",
                fontWeight:'800',
                fontSize:'17px',
                color:'#0078B8'
              }}>DoraLink</span>
              <ChevronDown size={15} color="#00A8D6" />
            </div>

            {/* RIGHT - Edit + Dots ONE solid pill */}
            <div style={{
              display:'flex',
              alignItems:'center',
              gap:'2px',
              background:'#E0F4FB',
              border:'1.5px solid #B8E4F5',
              borderRadius:'28px',
              padding:'6px 10px',
              pointerEvents: 'auto'
            }}>
              <button onClick={startNewChat}
                style={{
                  background:'none',
                  border:'none',
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  padding:'4px'
                }}>
                <SquarePen size={19} color="#00A8D6" />
              </button>
              
              <div ref={settingsRef} style={{position:'relative'}}>
                <button onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  style={{
                    width:'42px', height:'42px',
                    borderRadius:'50%',
                    background:'transparent',
                    border:'none',
                    cursor:'pointer',
                    display:'flex', alignItems:'center',
                    justifyContent:'center'
                  }}>
                  <MoreVertical size={19} color="#00A8D6" />
                </button>

                {showSettingsMenu && (
                  <div style={{
                    position:'absolute',
                    top:'48px', right:0,
                    background:'white',
                    borderRadius:'16px',
                    boxShadow:'0 8px 24px rgba(0,168,214,0.15)',
                    border:'1px solid #E0F4FB',
                    minWidth:'200px',
                    overflow:'hidden',
                    zIndex:50,
                    animation:'popIn 0.2s ease'
                  }}>
                    
                    {/* User info at top */}
                    <div style={{
                      padding:'14px 16px',
                      borderBottom:'1px solid #F0F9FF',
                      display:'flex',
                      alignItems:'center',
                      gap:'10px'
                    }}>
                      <div style={{
                        width:'36px', height:'36px',
                        borderRadius:'50%',
                        background:'#E0F4FB',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        fontSize:'16px'
                      }}>👤</div>
                      <div>
                        <div style={{
                          fontFamily:"'Nunito', sans-serif",
                          fontWeight:'700',
                          fontSize:'14px',
                          color:'#1a1a1a'
                        }}>{userName}</div>
                        <div style={{
                          fontSize:'11px',
                          color:'#9ca3af'
                        }}>{user?.email}</div>
                      </div>
                    </div>

                    {/* Menu items */}
                    {[
                      { 
                        icon:'🎨', 
                        label:'Theme', 
                        sub:'Blue & White',
                        onClick: () => {}
                      },
                      { 
                        icon:'🤖', 
                        label:'AI Model', 
                        sub:'Gemini 2.0 Flash',
                        onClick: () => {}
                      },
                      { 
                        icon:'🔑', 
                        label:'API Key', 
                        sub:'Manage your key',
                        onClick: () => setShowApiKeyModal(true)
                      },
                      { 
                        icon:'📊', 
                        label:'Habit Tracker', 
                        sub:'Track your habits',
                        onClick: () => {
                          window.location.href = '/habits'
                          setShowSettingsMenu(false)
                        }
                      },
                      { 
                        icon:'ℹ️', 
                        label:'About DoraLink', 
                        sub:'Version 1.0',
                        onClick: () => {}
                      },
                    ].map((item, i) => (
                      <button key={i}
                        onClick={() => {
                          item.onClick()
                          setShowSettingsMenu(false)
                        }}
                        style={{
                          width:'100%',
                          display:'flex',
                          alignItems:'center',
                          gap:'12px',
                          padding:'12px 16px',
                          background:'none',
                          border:'none',
                          cursor:'pointer',
                          borderBottom: i < 4 ? '1px solid #F0F9FF' : 'none',
                          textAlign:'left',
                          transition:'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background='#F0F9FF'}
                        onMouseLeave={e => e.currentTarget.style.background='none'}
                      >
                        <span style={{fontSize:'18px'}}>
                          {item.icon}
                        </span>
                        <div>
                          <div style={{
                            fontFamily:"'Nunito', sans-serif",
                            fontWeight:'700',
                            fontSize:'14px',
                            color:'#1a1a1a'
                          }}>{item.label}</div>
                          <div style={{
                            fontSize:'11px',
                            color:'#9ca3af'
                          }}>{item.sub}</div>
                        </div>
                      </button>
                    ))}

                    {/* Logout button */}
                    <button
                      onClick={async () => {
                        await logout()
                        setShowSettingsMenu(false)
                      }}
                      style={{
                        width:'100%',
                        display:'flex',
                        alignItems:'center',
                        gap:'12px',
                        padding:'12px 16px',
                        background:'none',
                        border:'none',
                        cursor:'pointer',
                        textAlign:'left',
                        borderTop:'1px solid #F0F9FF'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='#FFF0F0'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}
                    >
                      <span style={{fontSize:'18px'}}>🚪</span>
                      <div style={{
                        fontFamily:"'Nunito', sans-serif",
                        fontWeight:'700',
                        fontSize:'14px',
                        color:'#FF4444'
                      }}>Logout</div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DECORATIVE BACKGROUND ELEMENTS */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute bg-[#00A8D6]" style={{ width: '220px', height: '220px', borderRadius: '50%', top: '-80px', right: '-80px', opacity: 0.12, animation: 'floatSlow 7s ease-in-out infinite' }} />
            <div className="absolute bg-[#00A8D6]" style={{ width: '150px', height: '150px', borderRadius: '71% 29% 70% 30% / 30% 50% 50% 70%', top: '-30px', left: '-50px', opacity: 0.08 }} />
            <div className="absolute bg-[#00A8D6]" style={{ width: '250px', height: '250px', borderRadius: '40% 60% 30% 70% / 50% 40% 60% 50%', bottom: '80px', left: '-100px', opacity: 0.10, animation: 'floatSlow 9s ease-in-out infinite reverse' }} />
            <div className="absolute bg-[#00A8D6]" style={{ width: '160px', height: '160px', borderRadius: '50%', bottom: '-60px', right: '-60px', opacity: 0.08 }} />
            <div className="absolute bg-[#00A8D6]" style={{ width: '100px', height: '100px', borderRadius: '60% 40% 60% 40%', top: '40%', left: '-40px', opacity: 0.06 }} />
            <div className="absolute bg-[#00A8D6]" style={{ width: '14px', height: '14px', borderRadius: '50%', top: '15%', left: '10%', opacity: 0.25, animation: 'float 5s ease-in-out infinite', animationDelay: '0s' }} />
            <div className="absolute bg-[#00A8D6]" style={{ width: '10px', height: '10px', borderRadius: '50%', top: '25%', right: '12%', opacity: 0.20, animation: 'float 5s ease-in-out infinite', animationDelay: '0.8s' }} />
            <div className="absolute bg-[#FF0000]" style={{ width: '18px', height: '18px', borderRadius: '50%', top: '60%', right: '8%', opacity: 0.12, animation: 'float 5s ease-in-out infinite', animationDelay: '1.5s' }} />
            <div className="absolute bg-[#00A8D6]" style={{ width: '8px', height: '8px', borderRadius: '50%', bottom: '30%', left: '15%', opacity: 0.30, animation: 'float 5s ease-in-out infinite', animationDelay: '2s' }} />
            <div className="absolute bg-[#FFD700]" style={{ width: '12px', height: '12px', borderRadius: '50%', top: '70%', left: '5%', opacity: 0.20, animation: 'float 5s ease-in-out infinite' }} />
            <div className="absolute bg-[#FFD700]" style={{ width: '20px', height: '20px', borderRadius: '50%', top: '10%', right: '20%', opacity: 0.35 }} />
          </div>

          {/* MESSAGES / WELCOME AREA - fixed scrollable container */}
          <div className="messages-container" onScroll={handleScroll} style={{
            position:'fixed',
            top:'64px',
            bottom:'80px',
            left:0, right:0,
            overflowY:'auto',
            padding:'16px 12px',
            display:'flex',
            flexDirection:'column',
            gap:'16px',
            WebkitOverflowScrolling:'touch',
            zIndex: 1
          }}>
            {messages.length === 0 && !isTyping ? (
              <div className="flex flex-col items-center justify-center min-h-full max-w-2xl mx-auto px-4 w-full">
                <span className="text-[#00A8D6] text-xs font-semibold uppercase tracking-[3px] mb-2 relative z-10" style={{ animation: 'fadeDown 0.4s ease forwards', willChange: 'transform' }}>DoraLink</span>
                <img
                  src={`${import.meta.env.BASE_URL}dora-avatar.png`}
                  alt="DoraLink"
                  className="w-28 h-28 rounded-full object-cover mb-6 ring-4 ring-white shadow-md relative z-10"
                  style={{ animation: 'popIn 0.5s ease 0.1s both, float 4s ease-in-out 0.6s infinite', willChange: 'transform' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <h1 className="text-2xl font-bold text-center mb-10 text-[#1a1a1a]" style={{ fontFamily: "'Nunito', sans-serif", animation: 'fadeUp 0.4s ease 0.2s both' }}>
                  {userName} ke liye kya kar sakta hun?
                </h1>
                <div className="grid grid-cols-2 gap-3 w-full max-w-md relative z-10">
                  {[
                    { text: "Help me study for my upcoming test", icon: <BookOpen className="w-6 h-6 text-[#00A8D6] mb-3 self-start" />, label: "Study Help", delay: '0.3s' },
                    { text: "Make a study plan for the week", icon: <Lightbulb className="w-6 h-6 text-[#00A8D6] mb-3 self-start" />, label: "Make a plan", delay: '0.35s' },
                    { text: "Help me write a creative story", icon: <PenLine className="w-6 h-6 text-[#00A8D6] mb-3 self-start" />, label: "Help me write", delay: '0.4s' },
                    { text: "Summarize this long text for me", icon: <FileText className="w-6 h-6 text-[#00A8D6] mb-3 self-start" />, label: "Summarize this", delay: '0.45s' }
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(item.text)}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      className="flex flex-col items-start p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 hover:border-[#00A8D6]/30 transition-all duration-200 transform text-left min-h-[100px]"
                      style={{ animation: 'fadeUp 0.4s ease both', animationDelay: item.delay, transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                    >
                      {item.icon}
                      <span className="text-sm font-medium text-[#1a1a1a]" style={{ fontFamily: "'Nunito', sans-serif" }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-6 max-w-3xl mx-auto pt-4 w-full">
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', width: '100%', animation: 'fadeUp 0.3s ease forwards', willChange: 'transform' }}>
                    {msg.role === 'user' ? (
                      <div style={{ alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '75%' }}>
                        {msg.attachedPreview && (
                            <img src={msg.attachedPreview} style={{ width: '200px', borderRadius: '12px', marginBottom: '8px', objectFit: 'cover' }} alt="attachment" />
                        )}
                        <div style={{ background: '#00A8D6', color: 'white', borderRadius: '18px 18px 4px 18px', padding: '10px 14px', fontFamily: "'Nunito', sans-serif", fontSize: '15px', wordBreak: 'break-word' }}>
                          {msg.content.replace(/\n\[Image attached: .*?\]/, '')}
                        </div>
                      </div>
                    ) : msg.role === 'typing' ? (
                      <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '10px', alignItems: 'flex-start', maxWidth: '90%' }}>
                        <img src={`${import.meta.env.BASE_URL}dora-avatar.png`} alt="AI" className="w-8 h-8 rounded-full border border-gray-200 shrink-0 object-cover mt-2" onError={(e) => { e.target.style.display = 'none' }} />
                        <div style={{display:'flex', gap:'4px', 
                          padding:'12px 16px',
                          background:'white',
                          borderRadius:'18px',
                          width:'fit-content',
                          boxShadow:'0 2px 10px rgba(0,168,214,0.1)',
                          border:'1px solid rgba(0,168,214,0.12)'
                        }}>
                          {[0,1,2].map(i => (
                            <div key={i} style={{
                              width:'8px', height:'8px',
                              borderRadius:'50%',
                              background:'#00A8D6',
                              animation:'typingDot 1.2s ease infinite',
                              animationDelay:`${i * 0.15}s`
                            }}/>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '10px', alignItems: 'flex-start', maxWidth: '90%' }}>
                        <img src={`${import.meta.env.BASE_URL}dora-avatar.png`} alt="AI" className="w-8 h-8 rounded-full border border-gray-200 shrink-0 object-cover mt-2" onError={(e) => { e.target.style.display = 'none' }} />
                        <div style={{
                          background:'white',
                          borderRadius:'18px',
                          padding:'12px 16px',
                          boxShadow:'0 2px 10px rgba(0,168,214,0.1)',
                          border:'1px solid rgba(0,168,214,0.12)',
                          fontFamily:"'Nunito', sans-serif",
                          fontSize:'15px',
                          lineHeight:'1.6',
                          color:'#1a1a1a',
                          whiteSpace:'pre-wrap'
                        }}>
                          {formatAIMessage(msg.content)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* BOTTOM FADE for input bar area */}
          <div style={{
            position:'fixed',
            bottom:'80px',
            left:0, right:0,
            height:'40px',
            background:'linear-gradient(to top, rgba(240,249,255,0.98) 0%, rgba(240,249,255,0.7) 60%, rgba(240,249,255,0) 100%)',
            pointerEvents:'none',
            zIndex:10
          }} />

          {/* FIXED INPUT BAR */}
          <div style={{
            position:'fixed',
            bottom:0, left:0, right:0,
            padding:'8px 12px 20px 12px',
            background:'rgba(240,249,255,0.98)',
            zIndex:20
          }}>
            {isListening && (
              <div style={{
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:'8px',
                marginBottom:'8px',
                fontFamily:"'Nunito', sans-serif",
                fontSize:'13px',
                color:'#FF4444',
                fontWeight:'600'
              }}>
                <div style={{
                  width:'8px', height:'8px',
                  borderRadius:'50%',
                  background:'#FF4444',
                  animation:'pulse 1s infinite'
                }}/>
                Listening...
              </div>
            )}

            {attachedFile && (
              <div style={{
                margin:'0 auto 8px auto',
                maxWidth:'768px',
                background:'white',
                borderRadius:'12px',
                padding:'10px 12px',
                display:'flex',
                alignItems:'center',
                gap:'10px',
                boxShadow:'0 2px 8px rgba(0,168,214,0.1)',
                border:'1px solid #E0F4FB'
              }}>
                {attachedPreview ? (
                  <img src={attachedPreview} 
                    style={{width:'40px', height:'40px',
                    borderRadius:'8px', objectFit:'cover'}}/>
                ) : (
                  <FileText size={20} color="#00A8D6" />
                )}
                <span style={{
                  flex:1, fontSize:'13px',
                  fontFamily:"'Nunito', sans-serif",
                  color:'#1a1a1a', fontWeight:'600',
                  overflow:'hidden', textOverflow:'ellipsis',
                  whiteSpace:'nowrap'
                }}>{attachedFile?.name}</span>
                <button onClick={() => {
                  setAttachedFile(null)
                  setAttachedPreview(null)
                }} style={{background:'none', border:'none',
                  cursor:'pointer', color:'#9ca3af'}}>
                  <X size={16} />
                </button>
              </div>
            )}

            {showEmptyWarning && (
              <div style={{
                position: 'fixed',
                bottom: '90px',
                left: '0',
                right: '0',
                margin: '0 auto',
                width: 'fit-content',
                background: 'white',
                borderRadius: '50px',
                padding: '12px 24px',
                boxShadow: '0 8px 24px rgba(0,168,214,0.2)',
                border: '1.5px solid #E0F4FB',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'popIn 0.3s ease',
                whiteSpace: 'nowrap'
              }}>
                <span style={{fontSize: '20px'}}>😅</span>
                <span style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: '700',
                  fontSize: '14px',
                  color: '#1a1a1a'
                }}>Kuch toh likho ya photo do!</span>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'white',
              borderRadius: '28px',
              padding: '6px 6px 6px 8px',
              boxShadow: '0 2px 16px rgba(0,168,214,0.15)',
              border: '1.5px solid rgba(0,168,214,0.2)',
              gap: '6px',
              minHeight: '52px'
            }}>
              {showAttachMenu && (
                <>
                  <div
                    onClick={() => setShowAttachMenu(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      background: 'rgba(0,0,0,0.35)',
                      zIndex: 40
                    }}
                  />
                  <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'white',
                    borderRadius: '28px 28px 0 0',
                    paddingBottom: '32px',
                    zIndex: 50,
                    animation: 'slideInUp 0.3s ease',
                    boxShadow: '0 -8px 32px rgba(0,168,214,0.12)'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '4px',
                      background: '#E0F4FB',
                      borderRadius: '2px',
                      margin: '12px auto 20px auto'
                    }}/>
                    
                    <p style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: '800',
                      fontSize: '16px',
                      color: '#1a1a1a',
                      padding: '0 24px',
                      marginBottom: '16px'
                    }}>Add karo</p>

                    <button
                      onClick={openCamera}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '14px 24px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: '1px solid #F0F9FF',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #E0F4FB, #B8E4F5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        flexShrink: 0
                      }}>📷</div>
                      <div>
                        <div style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: '700',
                          fontSize: '16px',
                          color: '#1a1a1a'
                        }}>Camera se Photo lo</div>
                        <div style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontSize: '13px',
                          color: '#9ca3af',
                          marginTop: '2px'
                        }}>Abhi photo khicho aur bhejo</div>
                      </div>
                    </button>

                    <button
                      onClick={openGallery}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '14px 24px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        flexShrink: 0
                      }}>🖼️</div>
                      <div>
                        <div style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: '700',
                          fontSize: '16px',
                          color: '#1a1a1a'
                        }}>Gallery se Choose karo</div>
                        <div style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontSize: '13px',
                          color: '#9ca3af',
                          marginTop: '2px'
                        }}>Phone se photo select karo</div>
                      </div>
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={() => setShowAttachMenu(true)}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '14px',
                  background: '#E0F4FB',
                  border: '1.5px solid #B8E4F5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'transform 0.2s ease'
                }}
              >
                <Paperclip size={19} color="#00A8D6" />
              </button>

              <input 
                ref={cameraRef} 
                type="file" 
                accept="image/*" 
                capture="environment"
                style={{display:'none'}}
                onChange={handleFileSelect} 
              />

              <input 
                ref={galleryRef} 
                type="file" 
                accept="image/*,application/pdf,.doc,.docx"
                style={{display:'none'}}
                onChange={handleFileSelect} 
              />

              {/* Input */}
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(inputValue); }}
                style={{
                  flex:1,
                  border:'none', outline:'none',
                  fontFamily:"'Nunito', sans-serif",
                  fontSize:'15px', fontWeight:'500',
                  color:'#1a1a1a',
                  background:'transparent'
                }}
                placeholder="Ask DoraLink..."
              />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                flexShrink: 0,
                alignSelf: 'center'
              }}>
                {/* Mic button - hides when typing */}
                {!isTyping && (
                  <button
                    onClick={startVoiceInput}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isListening ? '#FF4444' : '#F0F9FF',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      opacity: inputValue.trim() ? 0 : 1,
                      transform: inputValue.trim()
                        ? 'scale(0) translateX(10px)'
                        : 'scale(1) translateX(0)',
                      transition: 'all 0.25s ease',
                      pointerEvents: inputValue.trim() ? 'none' : 'auto',
                      animation: isListening
                        ? 'pulse 1s ease-in-out infinite'
                        : 'none'
                    }}
                  >
                    <Mic size={15} color={
                      isListening ? "white" : "#00A8D6"
                    }/>
                  </button>
                )}

                {/* Stop OR Send button */}
                {isTyping ? (
                  <button
                    onClick={stopResponse}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: '#00A8D6',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: '12px',
                      height: '12px',
                      background: 'white',
                      borderRadius: '2px'
                    }}/>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend(inputValue)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: inputValue.trim()
                        ? '#00A8D6'
                        : '#E0F4FB',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <ArrowUp
                      size={18}
                      color={inputValue.trim() ? "white" : "#00A8D6"}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* API Key Modal */}
        {showApiKeyModal && (
          <div style={{
            position:'fixed', inset:0,
            background:'rgba(0,0,0,0.5)',
            zIndex:100,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            padding:'20px'
          }}>
            <div style={{
              background:'white',
              borderRadius:'24px',
              padding:'24px',
              width:'100%',
              maxWidth:'340px',
              animation:'popIn 0.2s ease'
            }}>
              <h3 style={{
                fontFamily:"'Nunito', sans-serif",
                color:'#00A8D6',
                fontWeight:'800',
                marginBottom:'8px'
              }}>🔑 Custom API Key</h3>
              <p style={{
                fontSize:'13px',
                color:'#9ca3af',
                marginBottom:'16px',
                fontFamily:"'Nunito', sans-serif"
              }}>Add your own Gemini API key 
              to avoid quota limits</p>
              <input
                value={customApiKey}
                onChange={e => setCustomApiKey(e.target.value)}
                placeholder="AIzaSy..."
                style={{
                  width:'100%',
                  padding:'12px',
                  borderRadius:'12px',
                  border:'1.5px solid #E0F4FB',
                  fontFamily:"'Nunito', sans-serif",
                  fontSize:'14px',
                  outline:'none',
                  marginBottom:'12px',
                  boxSizing:'border-box'
                }}
              />
              <button
                onClick={() => {
                  localStorage.setItem(
                    'doralink_custom_key', 
                    customApiKey)
                  setShowApiKeyModal(false)
                }}
                style={{
                  width:'100%',
                  padding:'12px',
                  background:'#00A8D6',
                  color:'white',
                  border:'none',
                  borderRadius:'50px',
                  fontFamily:"'Nunito', sans-serif",
                  fontWeight:'700',
                  fontSize:'15px',
                  cursor:'pointer',
                  marginBottom:'8px'
                }}>Save Key</button>
              <button
                onClick={() => setShowApiKeyModal(false)}
                style={{
                  width:'100%',
                  padding:'10px',
                  background:'none',
                  border:'none',
                  color:'#9ca3af',
                  fontFamily:"'Nunito', sans-serif",
                  cursor:'pointer'
                }}>Cancel</button>
            </div>
          </div>
        )}
        {showMicPermission && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '28px',
              padding: '28px 24px',
              width: '100%',
              maxWidth: '320px',
              textAlign: 'center',
              animation: 'popIn 0.3s ease'
            }}>
              <div style={{
                fontSize: '52px',
                marginBottom: '12px'
              }}>🎤</div>
              
              <h3 style={{
                fontFamily: "'Nunito', sans-serif",
                fontWeight: '800',
                fontSize: '18px',
                color: '#1a1a1a',
                marginBottom: '8px'
              }}>Mic Permission Chahiye!</h3>
              
              <p style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: '14px',
                color: '#9ca3af',
                marginBottom: '24px',
                lineHeight: '1.5'
              }}>
                Voice input ke liye DoraLink ko 
                microphone access chahiye. 
                Allow karo toh bolke bhi 
                pooch sakte ho! 😄
              </p>

              <button
                onClick={async () => {
                  setShowMicPermission(false)
                  try {
                    await navigator.mediaDevices
                      .getUserMedia({ audio: true })
                    startVoiceInput()
                  } catch(err) {
                    alert('Settings mein jaake manually allow karo!')
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#00A8D6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  marginBottom: '10px'
                }}
              >Allow Karo 🎤</button>

              <button
                onClick={() => setShowMicPermission(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'none',
                  border: 'none',
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '14px',
                  color: '#9ca3af',
                  cursor: 'pointer'
                }}
              >Abhi Nahi</button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
