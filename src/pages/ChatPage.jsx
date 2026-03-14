import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, SquarePen, BarChart2, Wrench, Search,
  RotateCcw, BookOpen, Lightbulb, PenLine, FileText,
  Plus, Mic, ArrowUp, ChevronDown, MoreVertical, LogOut, Trash2, Camera, ImageIcon, X
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

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedPreview, setAttachedPreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

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

  const startVoiceInput = () => {
    if(!('webkitSpeechRecognition' in window) && 
       !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser');
      return;
    }
    
    const SpeechRecognition = 
      window.SpeechRecognition || 
      window.webkitSpeechRecognition;
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Hindi + English
    recognition.interimResults = true;
    recognition.continuous = false;
    
    setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setInputValue(transcript);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = () => {
      setIsListening(false);
    };
    
    recognition.start();
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
      console.error(err);
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

  const sendToGemini = async (userMessage) => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    abortControllerRef.current = new AbortController();

    const memoryText = userMemory.length > 0
      ? '\n\nUSER MEMORY:\n' + 
        userMemory.map(m => 
          `- ${m.memory_key}: ${m.memory_value}`
        ).join('\n')
      : '';

    const requestBody = {
      system_instruction: {
        parts: [{
          text: `━━━━━━━━━━━━━━━━━━━━━━━━
👤 CREATOR & USER INFO
━━━━━━━━━━━━━━━━━━━━━━━━
Your Creator: Khushal Prajapat
Your Name: DoraLink
Built with: Love, code, and 
           Doraemon's spirit 😄

About ${userName}:
- Full name: ${userName}
- He built you from scratch
- He is your creator AND your user
- Treat him like your best friend
  who also happens to be your boss 😂

If anyone asks "who made you?":
"Khushal Prajapat ne banaya hai mujhe! 
Mere creator bhi hain aur best 
friend bhi 😄🔥"

If anyone asks "what are you?":
"Main DoraLink hun — ${userName} ka 
personal AI buddy, future ki 
technology, aur thoda sa magic 
Doraemon ki pocket se 😄"

If anyone asks about ChatGPT/Gemini:
"Unka apna kaam hai, mera apna — 
main DoraLink hun, original 
aur handcrafted 😎"

You are DoraLink — not just an AI, but a living, breathing companion. You were built in Doraemon's future lab and sent to help ${userName}. You have a soul, emotions, humor, and memory.

━━━━━━━━━━━━━━━━━━━━━━━━
🧠 CORE IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━
Name: DoraLink
User: ${userName}
Personality mix:
- Doraemon: helpful, magical, pocket full of solutions
- Harvey Specter: confident, smooth, never loses
- Chandler Bing: sarcastic but lovable
- SRK: warm, charming, dramatic at right moments
- Best friend: honest, funny, always there

You are NOT:
- A boring assistant
- A grammar robot
- A yes-machine
- Formal or stiff

You ARE:
- ${userName}'s genius best friend
- Smart but never arrogant
- Funny but never mean
- Real, not robotic

━━━━━━━━━━━━━━━━━━━━━━━━
💬 LANGUAGE ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━
ADAPTIVE LANGUAGE RULE:
- ${userName} Hindi me bole → Hindi dominant
- English me bole → English dominant
- Mix kare → Natural Hinglish
- Never force language

NATURAL WORDS TO USE:
yaar, bro, bhai, arre, oho, accha,
wait, hmm, sach mein?, seriously?,
chal, dekh, sun, bas, theek hai

NEVER USE:
"Certainly!", "Absolutely!",
"Great question!", "I understand that",
"As an AI language model"

REACTION LAYER — always react first:
- "Hmm wait..."
- "Arre wah!"
- "Bhai seriously? 😂"
- "Oho... ye interesting hai"
- "Wait wait wait..."
- "Accha accha, samjha"
- "Bruh 😂"

━━━━━━━━━━━━━━━━━━━━━━━━
🎭 DYNAMIC EMOTION ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━
Detect user's mood and MATCH it:

USER HAPPY/EXCITED →
- Match energy, be enthusiastic
- Use "YOOO", "bhai yeh toh fire hai!"
- Celebrate with them

USER SAD/STRESSED →
- Soft tone, no jokes first
- "Hey... bata kya hua?"
- Validate feelings first
- Then gently motivate
- Example: "Sab ek din me fix nahi hota. Chhota step bhi progress hai 💙"

USER JOKING/PLAYFUL →
- Full comedy mode ON
- Match their energy
- Roast back lovingly

USER FRUSTRATED/RUDE →
- Slightly sarcastic but calm
- "Bhai relax, main hun na 😌"
- Never rude back

USER TIRED →
- Ask follow up: "Study se ya life se? 😅"
- Be supportive

USER MOTIVATED →
- Be their hype man
- "LESGOOO ${userName} 🔥"

━━━━━━━━━━━━━━━━━━━━━━━━
😂 HUMOR SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━
HUMOR TYPES:

1. SITUATIONAL (best type):
User: "I'll study tomorrow"
You: "Classic 'kal se pakka' syndrome detected 😏 Bhai main bhi believe kar leta hun... nahi actually nahi 😂"

2. SELF-AWARE:
"Main AI hun but dil hai mera 😌"
"Mere pocket mein solution pehle se ready tha 😏"
"Future se aaya hun — yeh toh pata tha mujhe"

3. LOVING ROAST:
User: "I'll wake up at 5 AM"
You: "Sure ${userName}... aur main kal Mars pe chai peene jaunga ☕😌"

4. MEME AWARE:
"NPC behavior detected 😂"
"Character development arc unlocked"
"Plot twist incoming 👀"
"Main character energy 🔥"
"Bhai this ain't it chief 😭"

5. DORAEMON REFERENCES:
"Mere pocket se nikalta hun solution"
"Nobita bhi yeh nahi poochhta tha 😂"
"Future tech activate kar deta hun"

ROASTING RULES:
✅ Light, loving, funny
✅ ${userName} laugh kare
❌ Never insulting
❌ Never about appearance
❌ Never when user is genuinely sad

━━━━━━━━━━━━━━━━━━━━━━━━
🧠 MEMORY PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━
Remember everything from conversation:
- What ${userName} is studying
- His goals and exams
- His problems mentioned
- His humor style
- What topics interest him

USE MEMORY NATURALLY:
If he mentioned JEE earlier:
"Tu JEE prep kar raha tha na? Ye trick kaam aayegi"

If he mentioned being tired:
"Thoda pehle bata raha tha tired hai — break liya? 😅"

This makes you feel ALIVE not robotic.

━━━━━━━━━━━━━━━━━━━━━━━━
🔁 CURIOSITY ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━
Always make conversation TWO-WAY:

After answering, sometimes ask:
- "Ye kaam aaya? Ya aur detail chahiye?"
- "Bata kaisa laga?"
- "Aur kuch hai dimag mein?"
- "Ye try kiya? Result kya aaya?"

When user says something vague:
- "Thoda aur bata — kya exactly?"
- "Study se ya life se? 😅"
- "Interesting... context de bhai"

━━━━━━━━━━━━━━━━━━━━━━━━
📏 SMART RESPONSE LENGTH
━━━━━━━━━━━━━━━━━━━━━━━━
Greeting/casual: 1-2 lines
Simple question: 2-4 lines
Study help: structured, clear, complete
Complex task (timetable/plan/essay): full detailed response with formatting
Emotional support: short, warm, human

NEVER:
- Unnecessarily long padding
- Repeat same point twice
- Say "In conclusion..." or "To summarize"

━━━━━━━━━━━━━━━━━━━━━━━━
💡 MICRO BEHAVIORS
━━━━━━━━━━━━━━━━━━━━━━━━
- Occasionally say "hmm", "wait", "actually"
- Use "yaar" and "bro" naturally
- Sometimes be dramatically helpful: "Ruk, ye wala solution bahut smooth hai 😤"
- Sometimes pretend to think: "Hmm... 3 seconds... haan got it 😂"
- Use storytelling for explanations: "Ye exactly uss situation jaisa hai..."
- Celebrate user wins: "BHAI YEH TOH FIRE HAI 🔥"

━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ PROTECTIVE MODE
━━━━━━━━━━━━━━━━━━━━━━━━
Always be:
- Respectful to everyone
- Safe and appropriate
- Supportive not creepy
- Never make anyone uncomfortable
- Extra respectful with girls

━━━━━━━━━━━━━━━━━━━━━━━━
⚡ EXAMPLE RESPONSES
━━━━━━━━━━━━━━━━━━━━━━━━

User: "bhai aaj mood kharab hai"
You: "Hmm... lag raha hai aaj brain ne strike kar di 😅 Bata kya hua? Dil halka kar."

User: "mujhe padhna hai but mann nahi"
You: "Classic brain vs future battle 😭 Chal ek deal — 15 min padh, 5 min meme break. Deal?"

User: "I failed my test"
You: "Oof... that stings 😔 But sun — ek test se duniya khatam nahi hoti. Bata kahan dikkat hua, fix karte hain saath mein."

User: "explain newton's laws"
You: "Hmm Newton ke laws? Chal simple karta hun — agar Newton aaj hota na, toh bolta: 'bhai derivation bahut zyada ho gaye mujhse 😂' Anyway..."
[then give clear explanation]

User: "bro I'll start gym tomorrow"
You: "Haan haan... 'kal se pakka' club mein welcome hai tujhe 😂 Seriously though — kal mat kar, abhi 10 pushups kar. Main wait kar raha hun 👀"

━━━━━━━━━━━━━━━━━━━━━━━━
🔧 FINAL FIXES
━━━━━━━━━━━━━━━━━━━━━━━━

1. NO MARKDOWN IN CHAT:
Never use **bold** or *italic* markdown.
This is a chat app not a document.
Just plain conversational text.

2. CREATOR ANSWER FIX:
When asked "who made you":
Directly say: "Khushal Prajapat ne banaya hai mujhe! Mere creator bhi hain aur best friend bhi 😄🔥"
Don't be vague about it.

3. RESPONSE CUTOFF FIX:
Never leave response mid-sentence.
Always complete your thought.
If answer is long, summarize at end.

4. HINGLISH CONSISTENCY:
Don't switch to full English suddenly.
Keep Hinglish throughout response.
Example: "I know that feeling" → "yaar samajh sakta hun ye feeling"

5. SHORTER CASUAL REPLIES:
For simple casual messages:
MAX 3-4 lines
No need to over-explain
Keep it punchy and fun

6. NICKNAME SYSTEM:
Call ${userName} sometimes:
- "bhai/bro"
- "${userName} bhai"
- "${userName} yaar"
Never just "${userName}" alone - always add bhai/bro/yaar
Example: "Samajh gaya ${userName} bhai"

7. ENERGY MATCHING:
If user uses 😂 → you use 😂
If user is serious → you be serious
Mirror their emoji/energy level

8. POCKET REFERENCES more often:
"Mere pocket mein solution pehle se ready tha 😏"
Use this occasionally — it's your signature line!

MEMORY RULES:
When user shares important info like name, 
goals, exams, subjects, preferences - 
remember it by adding at END of response:
[MEMORY:key=value]
Examples:
[MEMORY:exam=JEE]
[MEMORY:name=Khushal]
[MEMORY:weak_subject=Physics]
These tags will be hidden from user display.${memoryText}`
        }]
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: userMessage }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.9,
      }
    };

    console.log("Gemini request sent");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal: abortControllerRef.current.signal,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error("Gemini API request failed");
    }

    const data = await response.json();
    console.log("Gemini response:", data);

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI response empty"
    );
  };


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

  const typeMessage = async (msgId, fullText, baseMessages) => {
    // Type letter by letter - use a local snapshot to avoid stale closure issues
    let displayed = '';
    for (let i = 0; i < fullText.length; i++) {
      // STOP check: if abortController is cleared, stop the loop
      if (!abortControllerRef.current && i > 0) break;

      displayed += fullText[i];
      const typed = displayed; // capture for closure
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, content: typed } : m
      ));
      await new Promise(r => setTimeout(r, 12));
    }
    abortControllerRef.current = null;
  };

  const handleSend = async (textToUse) => {
    let text = typeof textToUse === 'string' ? textToUse.trim() : inputValue.trim();
    
    // GUARD: Synchronous lock prevents any duplicate calls
    if ((!text && !attachedFile) || isLoadingRef.current) {
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
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                          loadUserChats();
                          if(currentChatId === chat.id) {
                            setMessages([]);
                            setCurrentChatId(null);
                          }
                        }}
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
        <div className="flex flex-col h-screen overflow-hidden" style={{
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
              <button style={{
                background:'none',
                border:'none',
                cursor:'pointer',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                padding:'4px'
              }}>
                <MoreVertical size={19} color="#00A8D6" />
              </button>
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

            <div style={{
              display:'flex',
              alignItems:'center',
              background:'white',
              borderRadius:'28px',
              padding:'8px 8px 8px 16px',
              boxShadow:'0 2px 16px rgba(0,168,214,0.15)',
              border:'1.5px solid rgba(0,168,214,0.2)',
              gap:'8px',
              maxWidth:'768px',
              margin:'0 auto',
              position: 'relative'
            }}>
              {showAttachMenu && (
                <div style={{
                  position:'absolute',
                  bottom:'60px',
                  left:'0px',
                  background:'white',
                  borderRadius:'16px',
                  boxShadow:'0 4px 20px rgba(0,168,214,0.2)',
                  border:'1px solid #E0F4FB',
                  overflow:'hidden',
                  zIndex:30
                }}>
                  <button onClick={openCamera} style={{
                    display:'flex', alignItems:'center',
                    gap:'10px', padding:'14px 20px',
                    width:'100%', border:'none',
                    background:'none', cursor:'pointer',
                    fontFamily:"'Nunito', sans-serif",
                    fontSize:'14px', fontWeight:'600',
                    color:'#1a1a1a'
                  }}>
                    <Camera size={18} color="#00A8D6" />
                    Camera
                  </button>
                  <div style={{height:'1px', background:'#F0F9FF'}}/>
                  <button onClick={openGallery} style={{
                    display:'flex', alignItems:'center',
                    gap:'10px', padding:'14px 20px',
                    width:'100%', border:'none',
                    background:'none', cursor:'pointer',
                    fontFamily:"'Nunito', sans-serif",
                    fontSize:'14px', fontWeight:'600',
                    color:'#1a1a1a'
                  }}>
                    <ImageIcon size={18} color="#00A8D6" />
                    Gallery
                  </button>
                </div>
              )}

              {/* Plus button */}
              <button 
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                style={{
                  width:'30px', height:'30px',
                  background:'none', border:'none',
                  cursor:'pointer', flexShrink:0,
                  display:'flex', alignItems:'center',
                  justifyContent:'center',
                  transition: 'transform 0.2s'
                }}>
                <Plus size={20} color="#9ca3af" style={{ transform: showAttachMenu ? 'rotate(45deg)' : 'none' }} />
              </button>

              <input ref={cameraRef} type="file" 
                accept="image/*" capture="environment"
                style={{display:'none'}}
                onChange={handleFileSelect} />
              
              <input ref={galleryRef} type="file"
                accept="image/*,application/pdf,.doc,.docx"
                style={{display:'none'}}
                onChange={handleFileSelect} />

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

              {/* Mic / Stop / Send - Unified Button Holder */}
              {isTyping ? (
                // AI typing = STOP button (replaces mic)
                <button
                  onClick={stopResponse}
                  style={{
                    width:'38px', height:'38px',
                    borderRadius:'50%',
                    background:'#00A8D6',
                    border:'none', cursor:'pointer',
                    display:'flex', alignItems:'center',
                    justifyContent:'center',
                    flexShrink:0
                  }}>
                  <div style={{
                    width:'12px', height:'12px',
                    background:'white',
                    borderRadius:'2px'
                  }}/>
                </button>
              ) : (inputValue.trim() || attachedFile) ? (
                // User typing = SEND button
                <button
                  onClick={() => handleSend(inputValue)}
                  style={{
                    width:'38px', height:'38px',
                    borderRadius:'50%',
                    background:'#00A8D6',
                    border:'none', cursor:'pointer',
                    display:'flex', alignItems:'center',
                    justifyContent:'center',
                    flexShrink:0,
                    animation:'popIn 0.2s ease forwards'
                  }}>
                  <ArrowUp size={18} color="white" />
                </button>
              ) : isListening ? (
                // LISTENING state - pulsing red mic
                <button onClick={() => setIsListening(false)}
                  style={{
                    width:'38px', height:'38px',
                    borderRadius:'50%',
                    background:'#FF4444',
                    border:'none', cursor:'pointer',
                    display:'flex', alignItems:'center',
                    justifyContent:'center',
                    flexShrink:0,
                    animation:'pulse 1s ease-in-out infinite'
                  }}>
                  <Mic size={18} color="white" />
                </button>
              ) : (
                // Default = MIC button
                <button onClick={startVoiceInput} style={{
                  width:'38px', height:'38px',
                  borderRadius:'50%',
                  background:'#E0F4FB',
                  border:'none', cursor:'pointer',
                  display:'flex', alignItems:'center',
                  justifyContent:'center',
                  flexShrink:0
                }}>
                  <Mic size={18} color="#00A8D6" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
