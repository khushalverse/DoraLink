import React, { useState, useEffect, useRef } from 'react';
import { callAI } from '../services/aiService';
import { ArrowLeft, Plus, Trash2, PauseCircle, PlayCircle, Check, X, ChevronDown, StickyNote, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext'
import { 
  getUserHabits, 
  saveHabitToDb, 
  updateHabitInDb, 
  deleteHabitFromDb 
} from '../services/supabase'

export default function HabitPage() {
  const { user } = useAuth()
  const [habits, setHabits] = useState([]);
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Default');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef(null);
  const [celebration, setCelebration] = useState(null);
  
  const [progressTab, setProgressTab] = useState('This Week');
  const [showAddModal, setShowAddModal] = useState(false);
  const [notesModal, setNotesModal] = useState(null);
  const [showEmojiGrid, setShowEmojiGrid] = useState(false);
  
  const [newHabit, setNewHabit] = useState({
    name: '', emoji: '💪', category: 'Health 🏥', 
    color: '#00A8D6', notes: '', chainedTo: null
  });
  const [editingNotes, setEditingNotes] = useState('');
  
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('doralink_xp') || '0'));
  const [xpPopup, setXpPopup] = useState(null);
  
  const [moodList, setMoodList] = useState(() => {
    const saved = localStorage.getItem('doralink_mood');
    return saved ? JSON.parse(saved) : [];
  });
  const [todayMood, setTodayMood] = useState(null);

  // AI Habit Coach States
  const [showCoach, setShowCoach] = useState(false);
  const [coachMessage, setCoachMessage] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);

  // AI Roast Mode States
  const [roastMode, setRoastMode] = useState(false);
  const [hideRoastToday, setHideRoastToday] = useState(false);

  // Goal Mode States
  const [goal, setGoal] = useState(() => localStorage.getItem('doralink_goal') || '');
  const [showGoalInput, setShowGoalInput] = useState(false);

  const levels = [
    { level:1, name:"Beginner", minXp:0, emoji:"🌱", color:"#96CEB4" },
    { level:2, name:"Rising", minXp:100, emoji:"⭐", color:"#FFEAA7" },
    { level:3, name:"Consistent", minXp:300, emoji:"🔥", color:"#FF8B94" },
    { level:4, name:"Dedicated", minXp:600, emoji:"💪", color:"#45B7D1" },
    { level:5, name:"Champion", minXp:1000, emoji:"🏆", color:"#A29BFE" },
    { level:6, name:"Legend", minXp:1500, emoji:"👑", color:"#FD79A8" },
    { level:7, name:"Discipline Master", minXp:2500, emoji:"🧠", color:"#00A8D6" }
  ];

  const getCurrentLevel = (currentXp) => {
    let current = levels[0];
    for(let l of levels) if(currentXp >= l.minXp) current = l;
    return current;
  };
  const getNextLevel = (currentXp) => {
    return levels.find(l => l.minXp > currentXp) || levels[levels.length-1];
  };
  
  const handleMoodSelect = (m) => {
      setTodayMood(m);
      const newMoodList = [...moodList, { date: getTodayStr(), mood: m }];
      setMoodList(newMoodList);
      localStorage.setItem('doralink_mood', JSON.stringify(newMoodList));
  };
  const MOODS = ['😊', '😐', '😔', '😡', '😴'];

  const EMOJIS = ["💪","📚","🏃","💧","🧘","🎯","⭐","🌟","🔥","💡","🎨","🎵","🌱","❤️","😴","🍎","✍️","🧠","🏋️","🚴","🙏","💰","🌅","🎉"];
  const CATEGORIES = ["Health 🏥", "Study 📚", "Fitness 💪", "Personal ⭐", "Other 🎯"];
  const COLORS = ["#00A8D6","#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FF8B94","#A29BFE","#FD79A8"];
  const QUOTES = [
    "Every day is a step forward! 🚀",
    "Consistency is your superpower! ⚡",
    "Small steps, big results! 💪",
    "You're absolutely on fire! 🔥",
    "Progress over perfection! ✨",
    "Champions are made daily! 🏆",
    "Your future self thanks you! 🙏",
    "One habit at a time! 🎯",
    "Discipline = Freedom! 💎",
    "Keep showing up! 🌟"
  ];

  useEffect(() => {
    if(user) {
      loadHabitsFromDb()
    }
  }, [user])

  const loadHabitsFromDb = async () => {
    try {
      const data = await getUserHabits(user.id)
      // Convert snake_case from DB to camelCase
      const formatted = data.map(h => ({
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        category: h.category,
        color: h.color,
        streak: h.streak,
        bestStreak: h.best_streak,
        totalCompletions: h.total_completions,
        completedDates: h.completed_dates || [],
        isPaused: h.is_paused,
        notes: h.notes,
        createdAt: h.created_at
      }))
      setHabits(formatted)
    } catch(err) {
      console.error('Load habits error:', err)
    }
  }

  useEffect(() => {
    const handleClick = (e) => {
      if(sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, []);

  const getTodayStr = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const calculateStreak = (dates) => {
    if (!dates || dates.length === 0) return 0;
    const sortedDates = [...dates].sort().reverse();
    let streak = 0;
    let check = new Date();
    check.setHours(0,0,0,0);
    
    // Convert current check date to string format for comparison
    while (true) {
        check.setMinutes(check.getMinutes() - check.getTimezoneOffset());
        const checkStr = check.toISOString().split('T')[0];
        
        if (sortedDates.includes(checkStr)) {
            streak++;
            check.setDate(check.getDate() - 1); // Move to previous day
        } else {
            // Only break if it's missing today and missing yesterday. If missing today but yesterday was completed, it's a current ongoing streak.
            const todayDate = new Date();
            todayDate.setMinutes(todayDate.getMinutes() - todayDate.getTimezoneOffset());
            const todayStr = todayDate.toISOString().split('T')[0];
            
            if (checkStr === todayStr) {
                 check.setDate(check.getDate() - 1);
            } else {
                 break;
            }
        }
    }
    return streak;
  };

  const toggleComplete = (id) => {
    const today = new Date().toDateString()
    setHabits(prev => {
      const updated = prev.map(h => {
        if(h.id !== id || h.isPaused) return h
        const done = h.completedDates.includes(today)
        const newDates = done
          ? h.completedDates.filter(d => d !== today)
          : [...h.completedDates, today]
        const streak = calculateStreak(newDates)
        
        // XP logic
        if(!done) {
          let earnedXp = 20
          let xpMsg = "+20 XP 🌟"
          if(streak === 7) { earnedXp += 50; xpMsg = "+70 XP 🔥 7-Day Streak!" }
          if(streak === 30) { earnedXp += 200; xpMsg = "+220 XP 👑 30-Day!" }
          const newXp = xp + earnedXp
          setXp(newXp)
          localStorage.setItem('doralink_xp', newXp.toString())
          setXpPopup(xpMsg)
          setTimeout(() => setXpPopup(null), 1500)
          const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]
          setCelebration({ emoji: h.emoji, quote })
          setTimeout(() => setCelebration(null), 1500)
        }

        const updatedHabit = {
          ...h,
          completedDates: newDates,
          streak,
          bestStreak: Math.max(h.bestStreak, streak),
          totalCompletions: done 
            ? h.totalCompletions - 1 
            : h.totalCompletions + 1
        }

        // Save to Supabase in background
        updateHabitInDb(id, updatedHabit).catch(console.error)

        return updatedHabit
      })
      return updated
    })
  }

  const addHabit = async () => {
    if(!newHabit.name.trim()) return
    try {
      const saved = await saveHabitToDb(user.id, {
        ...newHabit,
        streak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        completedDates: [],
        isPaused: false
      })
      const formatted = {
        id: saved.id,
        name: saved.name,
        emoji: saved.emoji,
        category: saved.category,
        color: saved.color,
        streak: saved.streak,
        bestStreak: saved.best_streak,
        totalCompletions: saved.total_completions,
        completedDates: saved.completed_dates || [],
        isPaused: saved.is_paused,
        notes: saved.notes,
        createdAt: saved.created_at
      }
      setHabits(prev => [formatted, ...prev])
      setNewHabit({ 
        name:'', emoji:'💪', 
        category:'Health 🏥', 
        color:'#00A8D6', notes:'', chainedTo: null
      })
      setShowEmojiGrid(false);
      setShowAddModal(false)
    } catch(err) {
      console.error('Add habit error:', err)
    }
  }

  const togglePause = async (id) => {
    const habit = habits.find(h => h.id === id)
    if(!habit) return
    const updated = { ...habit, isPaused: !habit.isPaused }
    try {
      await updateHabitInDb(id, updated)
      setHabits(prev => prev.map(h => 
        h.id === id ? updated : h
      ))
    } catch(err) {
      console.error('Pause error:', err)
    }
  }

  const deleteHabit = async (id) => {
    try {
      await deleteHabitFromDb(id)
      setHabits(prev => prev.filter(h => h.id !== id))
    } catch(err) {
      console.error('Delete habit error:', err)
    }
  }

  const openNotes = (habit) => {
    setNotesModal(habit.id);
    setEditingNotes(habit.notes || '');
  };

  const saveNotes = () => {
    if (notesModal) {
      setHabits(prev => prev.map(h => h.id === notesModal ? { ...h, notes: editingNotes } : h));
      setNotesModal(null);
    }
  };

  // AI Utilities
  const getCoachAdvice = async (type) => {
      setCoachLoading(true);
      
      const todayStr = getTodayStr();
      const completedTdy = habits.filter(h => h.completedDates?.includes(todayStr)).length;
      const totHabits = habits.length;
      const avgStreak = habits.length > 0
        ? Math.round(habits.reduce((sum,h) => sum + h.streak, 0) / habits.length)
        : 0;
        
      const habitSummary = habits.map(h => 
        `${h.emoji} ${h.name} (${h.category}, streak: ${h.streak}, completed today: ${h.completedDates?.includes(todayStr)})`
      ).join('\\n');
      
      const prompts = {
        analyze: `You are DoraLink AI Coach - witty, smart, Hinglish-friendly.
          Analyze these habits and give SHORT (3-4 lines) insights:
          Habits: ${habitSummary}
          Completed today: ${completedTdy}/${totHabits}
          Average streak: ${avgStreak} days
          Current XP: ${xp}
          Be specific, encouraging, use emojis, Hinglish style.`,
        suggest: `You are DoraLink AI Coach.
          Based on these existing habits:
          ${habitSummary}
          Suggest ONE new powerful habit that complements these.
          Format: 
          "Habit: [name]
          Why: [1 line reason]
          Start with: [tiny first step]"
          Keep it SHORT, Hinglish, fun!`,
        streak: `You are DoraLink AI Coach.
          User has these habits:
          ${habitSummary}
          Average streak: ${avgStreak} days
          Give a SHORT motivational streak-building tip (3-4 lines).
          Be funny, Hinglish, like a best friend pushing them!`,
        struggling: `You are DoraLink AI Coach.
          User is struggling with habits:
          ${habitSummary}
          Completed today: ${completedTdy}/${totHabits}
          Give SHORT (3-4 lines) empathetic advice. Be supportive first, then give ONE practical tip.
          Hinglish, warm, friendly tone.`
      };
      
      try {
        const msg = await callAI(
          prompts[type], 
          '', 
          [], 
          200
        );
        setCoachMessage(msg);
      } catch(err) {
        setCoachMessage("Network issue! Thoda wait karo 😅");
      }
      setCoachLoading(false);
  };

  const getSuggestions = (habs) => {
      const cats = habs.map(h => h.category);
      const suggestions = [];
      if(!cats.find(c => c.startsWith('Health'))) suggestions.push({emoji:'💧', name:'Drink 8 glasses water', category:'Health 🏥', reason:'Most impactful health habit to start with'});
      if(!cats.find(c => c.startsWith('Fitness'))) suggestions.push({emoji:'🏃', name:'10 min morning walk', category:'Fitness 💪', reason:'Boosts energy and mood for the whole day'});
      if(!cats.find(c => c.startsWith('Study'))) suggestions.push({emoji:'📚', name:'Read 20 minutes', category:'Study 📚', reason:'Compound knowledge growth over time'});
      suggestions.push({emoji:'🧘', name:'5 min meditation', category:'Personal ⭐', reason:'Reduces stress, improves focus'});
      suggestions.push({emoji:'✍️', name:'Daily journaling', category:'Personal ⭐', reason:'Clarity of mind and self-awareness'});
      return suggestions.slice(0,3);
  };

  const addSuggestedHabit = (s) => {
      const habit = { id: Date.now(), name: s.name, emoji: s.emoji, category: s.category, color: '#00A8D6', streak: 0, bestStreak: 0, totalCompletions: 0, completedDates: [], isPaused: false, notes: s.reason, frequency: "daily", createdAt: new Date().toISOString() };
      setHabits(prev => [...prev, habit]);
  };

  const saveGoal = (val) => {
      setGoal(val);
      localStorage.setItem('doralink_goal', val);
      setShowGoalInput(false);
  };

  const getGoalHabits = (goalText) => {
      const g = goalText.toLowerCase();
      if(g.includes('jee') || g.includes('exam') || g.includes('study')) return [{emoji:'📚', name:'Study 2 hours daily', cat:'Study 📚'}, {emoji:'✍️', name:'Practice problems', cat:'Study 📚'}, {emoji:'😴', name:'Sleep by 11 PM', cat:'Health 🏥'}];
      if(g.includes('fit') || g.includes('gym') || g.includes('weight')) return [{emoji:'🏃', name:'Exercise 30 min', cat:'Fitness 💪'}, {emoji:'💧', name:'Drink 3L water', cat:'Health 🏥'}, {emoji:'🍎', name:'No junk food', cat:'Health 🏥'}];
      if(g.includes('code') || g.includes('dev') || g.includes('programming')) return [{emoji:'💻', name:'Code 1 hour daily', cat:'Study 📚'}, {emoji:'📚', name:'Read tech article', cat:'Study 📚'}, {emoji:'🎯', name:'Build one feature/day', cat:'Study 📚'}];
      return [{emoji:'🌅', name:'Wake up early', cat:'Personal ⭐'}, {emoji:'📝', name:'Plan your day', cat:'Study 📚'}, {emoji:'🔄', name:'Daily review', cat:'Personal ⭐'}];
  };

  const roasts = [
      "Bhai ek habit bhi nahi kiya aaj? Meri pocket mein shame hai tere liye 😑",
      "WiFi bhi zyada consistent hai tujhse 📶",
      "Even Newton's first law says 'object at rest stays at rest' — but that's not a compliment 😂",
      "Kal se pakka club ka lifetime member ban gaya kya? 🏆",
      "Doraemon ne gadgets diye the procrastination ke liye nahi 😭",
      "Bhai chal ek kaam kar — sirf EK habit complete kar aaj. Bas ek. Main wait kar raha hun 👀",
      "Your habits called. They said they miss you 😢"
  ];
  
  const showRoastCard = roastMode && !hideRoastToday && habits.length > 0 && habits.filter(h => h.completedDates?.includes(getTodayStr())).length === 0 && new Date().getHours() >= 12;
  const currentRoast = React.useMemo(() => roasts[Math.floor(Math.random() * roasts.length)], [showRoastCard]);

  // Stats
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completedDates?.includes(getTodayStr())).length;
  const bestStreakAll = habits.length > 0 ? Math.max(...habits.map(h => h.bestStreak || 0)) : 0;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  // Filter & Sort
  const filteredHabits = habits.filter(h => {
    if (filter === 'All') return true;
    return h.category.startsWith(filter.split(' ')[0]);
  }).sort((a, b) => {
    if (sort === 'By Streak 🔥') return b.streak - a.streak;
    if (sort === 'By Name 📝') return a.name.localeCompare(b.name);
    return b.id - a.id; // Default (newest)
  });

  // Week Progress Chart Logic
  const getWeekDates = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };
  
  const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  };
  const weekDates = getWeekDates();
  const formatDatesCompletion = weekDates.map(dateStr => {
    if (habits.length === 0) return { day: getDayName(dateStr).charAt(0), percent: 0, isToday: dateStr === getTodayStr(), fullDayInfo: getDayName(dateStr) };
    const completedThatDay = habits.filter(h => !h.isPaused && h.completedDates && h.completedDates.includes(dateStr)).length;
    const activeHabits = habits.filter(h => !h.isPaused).length;
    return {
        day: getDayName(dateStr).charAt(0),
        fullDayInfo: getDayName(dateStr),
        percent: activeHabits > 0 ? Math.round((completedThatDay / activeHabits) * 100) : 0,
        isToday: dateStr === getTodayStr()
    };
  });

  // Month Contribution Logic
  const getMonthDates = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const year = today.getFullYear();
    const month = today.getMonth();
    const startDate = new Date(year, month, 1);
    const firstDayIndex = startDate.getDay(); // 0(Sun) - 6(Sat)
    
    // Push empty slots for days before 1st of month
    const grid = Array(firstDayIndex).fill(null);
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const dateObj = new Date(year, month, i);
        dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
        grid.push(dateObj.toISOString().split('T')[0]);
    }
    return grid;
  };
  const monthGrid = getMonthDates();

  const getDayCompletionStyle = (dateStr) => {
      if (!dateStr) return { backgroundColor: 'transparent' };
      if (habits.length === 0) return { backgroundColor: '#EBEDF0' };
      const completedThatDay = habits.filter(h => !h.isPaused && h.completedDates && h.completedDates.includes(dateStr)).length;
      const activeHabits = habits.filter(h => !h.isPaused).length;
      const pct = activeHabits > 0 ? (completedThatDay / activeHabits) * 100 : 0;
      
      let baseStyle = { backgroundColor: '#EBEDF0' };
      if (pct > 0 && pct < 50) baseStyle.backgroundColor = '#B8E4F5';
      else if (pct >= 50 && pct < 100) baseStyle.backgroundColor = '#00A8D6';
      else if (pct === 100) baseStyle.backgroundColor = '#0078B8';
      
      if (dateStr === getTodayStr()) {
          baseStyle.border = '2px solid #FF6B35';
      }
      return baseStyle;
  };

  const getDayHoverText = (dateStr) => {
      if(!dateStr) return '';
      const completedThatDay = habits.filter(h => !h.isPaused && h.completedDates && h.completedDates.includes(dateStr)).length;
      return `${completedThatDay} habits done`;
  };

  const currentLvl = getCurrentLevel(xp);
  const nextLvl = getNextLevel(xp);
  const xpProgress = nextLvl.minXp > currentLvl.minXp 
    ? ((xp - currentLvl.minXp) / (nextLvl.minXp - currentLvl.minXp)) * 100 
    : 100;

  const prodHabits = habits.filter(h => h.category.startsWith('Study') || h.category.startsWith('Personal'));
  const healthHabits = habits.filter(h => h.category.startsWith('Health') || h.category.startsWith('Fitness'));
  
  const calcScore = (habs) => {
    if(habs.length === 0) return 0;
    let totalPct = 0;
    habs.forEach(h => {
        let hDone = 0;
        weekDates.forEach(d => { if(h.completedDates?.includes(d)) hDone++; });
        totalPct += (hDone / 7) * 100;
    });
    return Math.round(totalPct / habs.length);
  };
  
  const prodScore = calcScore(prodHabits);
  const healthScore = calcScore(healthHabits);
  const discScore = calcScore(habits);
  const lifeScore = habits.length === 0 ? 0 : Math.round((prodScore + healthScore + discScore) / 3);

  let lifeScoreText = "😔 Needs Work";
  if(lifeScore > 40) lifeScoreText = "😊 Getting Better";
  if(lifeScore > 70) lifeScoreText = "🔥 On Fire";
  if(lifeScore > 90) lifeScoreText = "👑 Legendary";

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px) }
          to { opacity:1; transform:translateY(0) }
        }
        @keyframes popIn {
          from { opacity:0; transform:scale(0.8) }
          to { opacity:1; transform:scale(1) }
        }
        @keyframes checkBounce {
          0% { transform:scale(1) }
          40% { transform:scale(1.4) }
          70% { transform:scale(0.9) }
          100% { transform:scale(1) }
        }
        @keyframes confettiFall {
          0% { transform:translateY(-50px) rotate(0deg); opacity:1 }
          100% { transform:translateY(110vh) rotate(720deg); opacity:0 }
        }
        @keyframes float {
          0%,100% { transform:translateY(0px) }
          50% { transform:translateY(-8px) }
        }
        @keyframes floatSlow {
          0%,100% { transform:translateY(0px) }
          50% { transform:translateY(-12px) }
        }
        @keyframes slideIn {
          from { transform:translateX(-100%) }
          to { transform:translateX(0) }
        }
        @keyframes pulse {
          0%,100% { transform:scale(1); opacity:0.8 }
          50% { transform:scale(1.05); opacity:1 }
        }
        @keyframes slideInRight {
          from { opacity:0; transform:translateX(100px) }
          to { opacity:1; transform:translateX(0) }
        }
        @keyframes slideInUp {
          from { opacity:0; transform:translateY(100%) }
          to { opacity:1; transform:translateY(0) }
        }
        @keyframes roastShake {
          0%,100% { transform:translateX(0) }
          25% { transform:translateX(-5px) }
          75% { transform:translateX(5px) }
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
      
      <div className="bg-[#F0F9FF] text-[#1a1a1a] font-sans selection:bg-[#00A8D6] selection:text-white" style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', fontFamily: "'Nunito', sans-serif" }}>
          
         {/* BACKGROUND BLOBS */}
         <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute bg-[#00A8D6]" style={{ width: '200px', height: '200px', borderRadius: '50%', top: '-80px', right: '-80px', opacity: 0.10, animation: 'floatSlow 7s ease-in-out infinite' }} />
            <div className="absolute bg-[#00A8D6]" style={{ width: '250px', height: '250px', borderRadius: '50%', bottom: '100px', left: '-100px', opacity: 0.08, animation: 'floatSlow 9s ease-in-out infinite reverse' }} />
            
            <div className="absolute bg-[#00A8D6]" style={{ width: '14px', height: '14px', borderRadius: '50%', top: '15%', left: '10%', opacity: 0.20 }} />
            <div className="absolute bg-[#00A8D6]" style={{ width: '10px', height: '10px', borderRadius: '50%', top: '25%', right: '12%', opacity: 0.20 }} />
            <div className="absolute bg-[#00A8D6]" style={{ width: '8px', height: '8px', borderRadius: '50%', bottom: '30%', left: '15%', opacity: 0.20 }} />
            <div className="absolute bg-[#00A8D6]" style={{ width: '12px', height: '12px', borderRadius: '50%', top: '70%', left: '5%', opacity: 0.20 }} />
            <div className="absolute bg-[#00A8D6]" style={{ width: '10px', height: '10px', borderRadius: '50%', bottom: '10%', right: '20%', opacity: 0.20 }} />
          </div>

          {/* MAIN CONTENT */}
          <div className="flex flex-col h-screen overflow-y-auto z-10 relative pb-20" style={{ paddingTop: '70px'}}>

            {/* HEADER */}
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'linear-gradient(to bottom, rgba(240,249,255,1) 0%, rgba(240,249,255,0.9) 60%, rgba(240,249,255,0) 100%)'
            }}>
              <button onClick={() => window.history.back()}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#E0F4FB', border: '1.5px solid #B8E4F5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}>
                <ArrowLeft size={20} color="#00A8D6" />
              </button>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#00A8D6' }}>Habit Tracker</span>
              <div className="flex items-center gap-2">
                  <button onClick={() => setRoastMode(!roastMode)}
                      className="flex items-center gap-1 bg-white border rounded-full px-2 py-1 text-[11px] shadow-sm font-bold transition-colors"
                      style={{ color: roastMode ? '#FF6B35' : '#9ca3af', borderColor: roastMode ? '#FF6B35' : '#E0F4FB' }}>
                      🔥 Roast {roastMode ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => setShowAddModal(true)}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: '#00A8D6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,168,214,0.3)'
                    }}>
                    <Plus size={20} color="white" />
                  </button>
              </div>
            </div>

            <div className="max-w-2xl mx-auto w-full px-4" style={{ animation: 'fadeUp 0.4s ease both' }}>
                
                {/* MOOD TRACKER */}
                <div className="mb-4 mt-2">
                    <p className="text-[13px] text-gray-500 font-bold mb-2 text-center">How are you feeling?</p>
                    <div className="flex justify-center gap-3">
                        {MOODS.map(m => (
                            <button key={m} onClick={() => handleMoodSelect(m)}
                                className="w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all bg-white shadow-sm"
                                style={{
                                    border: todayMood === m ? '2px solid #00A8D6' : '1px solid #E0F4FB',
                                    transform: todayMood === m ? 'scale(1.2)' : 'scale(1)'
                                }}>
                                <span className="text-[18px]">{m}</span>
                            </button>
                        ))}
                    </div>
                    {todayMood && <p className="text-center text-[#00A8D6] text-[12px] mt-2 font-bold" style={{ animation: 'slideInUp 0.3s ease' }}>Got it! Keep going 💙</p>}
                </div>

                {/* STATS ROW */}
                <div className="flex gap-3 mb-6 overflow-x-auto hide-scrollbar pb-2 pt-2 snap-x">
                    {[
                        {v: totalHabits, l: "Habits 📋"},
                        {v: completedToday, l: "Done ✅"},
                        {v: `${bestStreakAll}`, l: "Best 🔥"},
                        {v: `${completionRate}%`, l: "Rate 📊"}
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm p-3 flex flex-col items-center justify-center min-w-[76px] flex-1 snap-center">
                            <span className="text-[24px] font-bold text-[#00A8D6] leading-none mb-1">{stat.v}</span>
                            <span className="text-[11px] text-[#9ca3af] font-semibold tracking-wide whitespace-nowrap">{stat.l}</span>
                        </div>
                    ))}
                </div>

                {/* XP CARD */}
                <div className="bg-white rounded-[16px] shadow-sm p-[16px] mb-[12px]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="text-[28px] leading-none">{currentLvl.emoji}</div>
                            <div>
                                <div className="font-bold text-[#1a1a1a] text-[16px]">{currentLvl.name}</div>
                                <div className="text-[12px] text-gray-500">Level {currentLvl.level}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[14px] font-bold text-[#1a1a1a]">{xp} <span className="text-gray-400 text-[12px]">/ {nextLvl.minXp} XP</span></div>
                            <div className="text-[11px] text-gray-500">Next: {nextLvl.name}</div>
                        </div>
                    </div>
                    <div className="bg-[#F0F9FF] rounded-full h-[10px] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000"
                             style={{
                                 width: `${Math.min(100, xpProgress)}%`,
                                 background: 'linear-gradient(to right, #00A8D6, #0078B8)'
                             }} />
                    </div>
                </div>

                {/* LIFE SCORE CARD */}
                <div className="bg-white rounded-[16px] p-[16px] mb-[24px] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[16px] font-bold text-[#1a1a1a]">Life Score 📊</h2>
                        <div className="text-right">
                           <div className="text-[24px] font-bold leading-none" style={{ color: lifeScore > 70 ? '#FF6B35' : (lifeScore > 40 ? '#00A8D6' : '#FF8B94') }}>{lifeScore}</div>
                           <div className="text-[11px] text-gray-500">{lifeScoreText}</div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-[13px] mb-1">
                                <span className="text-gray-600 font-bold">Productivity</span>
                                <span className="text-[#A29BFE] font-bold">{prodScore}%</span>
                            </div>
                            <div className="h-[8px] bg-[#F0F9FF] rounded-full overflow-hidden">
                                <div className="h-full bg-[#A29BFE] transition-all" style={{ width: `${prodScore}%` }}/>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[13px] mb-1">
                                <span className="text-gray-600 font-bold">Health</span>
                                <span className="text-[#4ECDC4] font-bold">{healthScore}%</span>
                            </div>
                            <div className="h-[8px] bg-[#F0F9FF] rounded-full overflow-hidden">
                                <div className="h-full bg-[#4ECDC4] transition-all" style={{ width: `${healthScore}%` }}/>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[13px] mb-1">
                                <span className="text-gray-600 font-bold">Discipline</span>
                                <span className="text-[#FF8B94] font-bold">{discScore}%</span>
                            </div>
                            <div className="h-[8px] bg-[#F0F9FF] rounded-full overflow-hidden">
                                <div className="h-full bg-[#FF8B94] transition-all" style={{ width: `${discScore}%` }}/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MY GOAL SECTION */}
                <div className="bg-white rounded-[16px] p-[16px] mb-[24px] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-[16px] font-bold text-[#1a1a1a]">🎯 My Goal</h2>
                        {goal && <button onClick={() => setShowGoalInput(!showGoalInput)} className="text-[#9ca3af] hover:text-[#00A8D6] transition-colors"><StickyNote size={14}/></button>}
                    </div>
                    {!goal || showGoalInput ? (
                        <div className="mt-2" style={{ animation: 'fadeUp 0.3s ease' }}>
                            <p className="text-[12px] text-gray-500 mb-2">{goal ? "Update your big goal!" : "Set your big goal!"}</p>
                            <div className="flex gap-2">
                                <input id="goalInputId" type="text" placeholder="e.g. Crack JEE 2024" className="flex-1 border border-[#E0F4FB] rounded-lg px-3 py-1.5 text-[14px] outline-none focus:border-[#00A8D6]" defaultValue={goal} style={{fontFamily:"'Nunito', sans-serif"}}/>
                                <button onClick={() => saveGoal(document.getElementById('goalInputId').value)} className="bg-[#00A8D6] text-white px-3 py-1.5 rounded-lg text-[13px] font-bold">Save</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ animation: 'fadeUp 0.3s ease' }}>
                            <p className="text-[15px] font-bold text-[#00A8D6] mb-3 leading-snug">{goal}</p>
                            <p className="text-[11px] text-gray-500 font-bold mb-2 uppercase tracking-wider">AI Habit Roadmap</p>
                            <div className="flex flex-col gap-2">
                                {getGoalHabits(goal).map((gh, i) => (
                                    <div key={i} className="flex items-center justify-between bg-[#F0F9FF] p-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[16px]">{gh.emoji}</span>
                                            <span className="text-[13px] font-semibold text-[#1a1a1a]">{gh.name}</span>
                                        </div>
                                        <button onClick={() => addSuggestedHabit({emoji: gh.emoji, name: gh.name, category: gh.cat, reason: 'Goal roadmap'})} className="w-[24px] h-[24px] rounded-full bg-white text-[#00A8D6] flex items-center justify-center shadow-sm hover:scale-110 transition-transform"><Plus size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* FILTER + SORT BAR */}
                <div className="flex items-center gap-3 mb-6 relative">
                    <div className="flex-1 overflow-x-auto hide-scrollbar flex gap-2 pb-1 pr-12">
                        {["All", "Health 🏥", "Study 📚", "Fitness 💪", "Personal ⭐", "Other 🎯"].map(f => (
                           <button key={f}
                            onClick={() => setFilter(f.split(' ')[0] === 'All' ? 'All' : f)}
                            className="whitespace-nowrap rounded-full px-4 py-1.5 text-[14px] transition-colors"
                            style={{
                                backgroundColor: filter === f || (filter === 'All' && f === 'All') ? '#00A8D6' : 'white',
                                color: filter === f || (filter === 'All' && f === 'All') ? 'white' : '#00A8D6',
                                border: `1px solid ${filter === f || (filter === 'All' && f === 'All') ? '#00A8D6' : '#00A8D6'}`
                            }}>
                               {f}
                           </button> 
                        ))}
                    </div>
                    {/* SORT BUTTON */}
                    <div className="absolute right-0 bg-gradient-to-l from-[#F0F9FF] via-[#F0F9FF] to-transparent pl-8 h-full flex items-center">
                        <div className="relative" ref={sortRef}>
                            <button onClick={() => setShowSortDropdown(!showSortDropdown)}
                                className="flex items-center gap-1 bg-white border border-[#00A8D6] rounded-full px-3 py-1.5 text-[14px] text-[#00A8D6] shadow-sm">
                                {sort.split(' ')[0] === 'By' ? sort : sort} <ChevronDown size={14} />
                            </button>
                            {showSortDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    zIndex: 50,
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 24px rgba(0,168,214,0.15)',
                                    border: '1px solid #E0F4FB',
                                    minWidth: '140px',
                                    overflow: 'hidden',
                                    marginTop: '4px'
                                }}>
                                     {["Default", "By Streak 🔥", "By Name 📝"].map(s => (
                                         <button key={s} onClick={() => { setSort(s); setShowSortDropdown(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#F0F9FF] hover:text-[#00A8D6]"
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
                                            {s}
                                         </button>
                                     ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* HABITS LIST */}
                <div className="mb-8">
                    <h2 className="text-[16px] font-bold text-[#1a1a1a] mb-4">Today's Habits</h2>
                    
                    {habits.length === 0 ? (
                        <div className="text-center py-10 mt-8">
                            <div className="text-[80px] mb-4 leading-none" style={{ animation: 'float 4s ease-in-out infinite' }}>🎯</div>
                            <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">No habits yet!</h3>
                            <p className="text-gray-500 text-[14px] mb-6 max-w-[250px] mx-auto">Add your first habit and start building your best self!</p>
                            <button onClick={() => setShowAddModal(true)}
                                className="bg-[#00A8D6] justify-center text-white text-[15px] py-3 px-6 rounded-full inline-flex items-center gap-2 shadow-sm hover:-translate-y-0.5 transition-transform active:scale-95">
                                Add First Habit →
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {filteredHabits.map((habit, idx) => {
                                const checked = habit.completedDates?.includes(getTodayStr());
                                return (
                                <div key={habit.id} 
                                   className="bg-white rounded-[16px] p-[14px_16px] shadow-[0_2px_8px_rgba(0,168,214,0.08)] mb-[10px] transform hover:scale-[1.01] transition-transform duration-200 relative overflow-hidden"
                                   style={{ 
                                       animation: `fadeUp 0.3s ease ${idx * 0.05}s both`,
                                       opacity: habit.isPaused ? 0.55 : 1,
                                       backgroundColor: checked && !habit.isPaused ? '#E8F8FF' : 'white'
                                   }}>
                                   {habit.isPaused && (
                                       <div className="absolute top-2 right-2 bg-orange-100 text-[#FF6B35] font-bold text-[10px] px-2 py-0.5 rounded-full z-10">⏸ Paused</div>
                                   )}
                                   
                                   <div className="flex items-start">
                                        {/* Checkbox */}
                                        <button onClick={() => toggleComplete(habit.id)} disabled={habit.isPaused}
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                border: checked ? 'none' : `2px solid ${habit.color}`,
                                                backgroundColor: checked ? habit.color : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, transition: 'all 0.2s ease',
                                                animation: checked ? 'checkBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
                                                marginTop: '2px'
                                            }}
                                        >
                                            {checked && <Check size={20} color="white" />}
                                        </button>

                                        {/* Middle Details */}
                                        <div className="flex-1 ml-[12px] min-w-0">
                                            <h3 className="text-[15px] font-[700] truncate leading-tight mb-1"
                                                style={{ color: checked ? '#9ca3af' : '#1a1a1a', textDecoration: checked ? 'line-through' : 'none' }}>
                                                {habit.emoji} {habit.name}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-[6px] mb-0.5 mt-[2px]">
                                                <span className="text-[11px] px-[8px] py-[2px] rounded-full"
                                                    style={{ backgroundColor: `${habit.color}20`, color: habit.color }}>
                                                    {habit.category.split(' ')[0]}
                                                </span>
                                                {habit.streak > 0 && !habit.isPaused && (
                                                    <span className="text-[12px] text-[#FF6B35]">
                                                       🔥 {habit.streak} day streak
                                                    </span>
                                                )}
                                            </div>
                                            {habit.notes && (
                                                <p className="text-[12px] text-[#9ca3af] italic truncate mt-1">{habit.notes}</p>
                                            )}
                                            {habit.chainedTo && (
                                                <div className="flex items-center gap-1 mt-1 text-[11px] text-[#00A8D6] font-semibold bg-[#E8F8FF] px-2 py-0.5 rounded-full w-fit">
                                                    ↳ {habits.find(h => h.id === habit.chainedTo)?.name || "Deleted"}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-[2px] ml-2">
                                            <button onClick={() => openNotes(habit)} className="p-1.5 text-[#9ca3af] hover:text-[#00A8D6] transition-colors"><StickyNote size={18}/></button>
                                            <button onClick={() => togglePause(habit.id)} className="p-1.5 text-[#9ca3af] hover:text-orange-500 transition-colors">
                                                {habit.isPaused ? <PlayCircle size={18}/> : <PauseCircle size={18}/>}
                                            </button>
                                            <button onClick={() => deleteHabit(habit.id)} className="p-1.5 text-[#9ca3af] hover:text-[#FF6B6B] transition-colors"><Trash2 size={18}/></button>
                                        </div>
                                   </div>

                                   {/* Progress Dots Mon-Sun */}
                                   <div className="mt-4 flex items-center justify-between px-1">
                                       {weekDates.map((dateStr, i) => {
                                           const isDone = habit.completedDates?.includes(dateStr);
                                           const isTday = dateStr === getTodayStr();
                                           const isFuture = new Date(dateStr) > new Date();
                                           
                                           let dotColor = '#E5E7EB'; // missed
                                           if (isDone) dotColor = '#00A8D6';
                                           else if (isFuture) dotColor = '#F3F4F6';
                                           
                                           return (
                                               <div key={i} className="flex flex-col items-center gap-[4px]">
                                                   <div style={{
                                                       width:'8px', height:'8px', borderRadius:'50%',
                                                       backgroundColor: dotColor,
                                                       border: isTday && !isDone ? `1.5px solid #00A8D6` : 'none',
                                                   }} />
                                                   <span className="text-[9px] uppercase text-[#9ca3af]">{getDayName(dateStr).charAt(0)}</span>
                                               </div>
                                           )
                                       })}
                                   </div>
                                </div>
                            )})}
                        </div>
                    )}
                    
                    {/* ROAST CARD */}
                    {showRoastCard && (
                        <div className="bg-white border-2 border-[#FF8B94] rounded-[16px] p-[16px] mt-3 text-center" style={{ animation: 'roastShake 0.5s ease' }}>
                            <div className="text-[24px] mb-2">🔥</div>
                            <p className="text-[14px] font-bold text-[#1a1a1a] mb-3 leading-snug">"{currentRoast}"</p>
                            <button onClick={() => setHideRoastToday(true)} className="text-[12px] bg-[#F3F4F6] px-4 py-1.5 rounded-full text-gray-600 font-semibold hover:bg-gray-200">Okay okay I'll do it 😅</button>
                        </div>
                    )}
                </div>

                {/* WEEKLY AI REPORT CARD */}
                <div className="bg-white rounded-[16px] shadow-sm p-[16px] mb-[16px] mt-[16px] border-l-[4px] border-l-[#00A8D6]">
                    <h3 className="text-[16px] font-bold text-[#1a1a1a] mb-3">📊 Weekly Report</h3>
                    <div className="text-[13px] text-gray-600 space-y-1">
                        <p>• Habits completed: <span className="font-bold text-[#00A8D6]">{completedToday * 7}</span> (est)</p>
                        <p>• Current streak max: <span className="font-bold text-[#FF6B35]">{bestStreakAll} days 🔥</span></p>
                        <p>• Overall completion: <span className="font-bold text-[#4ECDC4]">{discScore}%</span></p>
                    </div>
                    <div className="mt-3 bg-[#F0F9FF] p-[10px] rounded-[8px] italic text-[12px] text-[#1a1a1a] font-semibold">
                        {discScore > 80 ? "You're absolutely crushing it! 🏆" : discScore > 60 ? "Solid week! Keep the momentum! 💪" : discScore > 40 ? "Room to grow — you've got this! 🌱" : "New week, fresh start! Let's go! 🚀"}
                    </div>
                </div>

                {/* AI PATTERNS */}
                <div className="bg-white rounded-[16px] shadow-sm p-[16px] mb-[16px] border-l-[4px] border-l-[#A29BFE]">
                    <h3 className="text-[16px] font-bold text-[#1a1a1a] mb-3">🧠 AI Patterns</h3>
                    
                    {(() => {
                        const dayStats = [0,1,2,3,4,5,6].map(i => {
                            const d = new Date(); d.setDate(d.getDate() - i); 
                            const dStr = d.toISOString().split('T')[0];
                            const dayName = new Date(dStr).toLocaleDateString('en',{weekday:'short'});
                            const done = habits.filter(h => h.completedDates?.includes(dStr)).length;
                            return { dayName, done, total: habits.length };
                        });
                        
                        let worstDay = { name: '-', misses: -1 };
                        let bestDay = { name: '-', done: -1 };
                        
                        const grouped = {};
                        dayStats.forEach(s => {
                            if(!grouped[s.dayName]) grouped[s.dayName] = { done:0, total:0, days:0 };
                            grouped[s.dayName].done += s.done;
                            grouped[s.dayName].total += s.total;
                            grouped[s.dayName].days += 1;
                        });
                        
                        Object.keys(grouped).forEach(k => {
                            const misses = grouped[k].total - grouped[k].done;
                            if(misses > worstDay.misses) { worstDay.misses = misses; worstDay.name = k; }
                            if(grouped[k].done > bestDay.done) { bestDay.done = grouped[k].done; bestDay.name = k; }
                        });
                        
                        const avgStr = habits.length > 0 ? Math.round(habits.reduce((s,h) => s + h.streak, 0) / habits.length) : 0;
                        const uniqueCats = new Set(habits.map(h => h.category.split(' ')[0]));
                        const missingCat = !uniqueCats.has('Health') ? 'Health' : (!uniqueCats.has('Study') ? 'Study' : null);

                        return (
                            <div className="space-y-2">
                                {worstDay.misses > 0 && (
                                    <div className="bg-[#F3F4F6] rounded-xl p-[10px] flex items-center gap-2">
                                        <span className="text-[16px]">📉</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-bold text-[#1a1a1a] truncate">Most missed: {worstDay.name}</p>
                                            <p className="text-[11px] text-gray-500 truncate">Consider reducing {worstDay.name} load</p>
                                        </div>
                                    </div>
                                )}
                                {bestDay.done > 0 && (
                                    <div className="bg-[#F3F4F6] rounded-xl p-[10px] flex items-center gap-2">
                                        <span className="text-[16px]">⭐</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-bold text-[#1a1a1a] truncate">Best consistency: {bestDay.name}!</p>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-[#F3F4F6] rounded-xl p-[10px] flex items-center gap-2">
                                    <span className="text-[16px] shrink-0">{avgStr < 3 ? '💡' : (avgStr <= 7 ? '🔥' : '🏆')}</span>
                                    <p className="text-[12px] font-semibold text-[#1a1a1a] flex-1 leading-tight">
                                        {avgStr < 3 ? "Tip: Start with just 1 habit per day to build momentum" : (avgStr <= 7 ? "You're building consistency! Push through!" : "Solid streak! You've built a real habit loop!")}
                                    </p>
                                </div>
                                {missingCat && (
                                    <div className="bg-[#F3F4F6] rounded-xl p-[10px] flex items-center gap-2">
                                        <span className="text-[16px]">💡</span>
                                        <p className="text-[12px] font-semibold text-[#1a1a1a] flex-1 leading-tight">Try adding a {missingCat} habit for balance</p>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* AI HABIT SUGGESTIONS */}
                <div className="mb-[24px]">
                    <h3 className="text-[16px] font-bold text-[#1a1a1a] mb-3">✨ Suggested for You</h3>
                    <div className="space-y-2">
                        {getSuggestions(habits).map((s, i) => (
                            <div key={i} className="bg-white rounded-xl p-[12px] shadow-sm flex items-center gap-3">
                                <div className="text-[32px]">{s.emoji}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[14px] text-[#1a1a1a] truncate">{s.name}</p>
                                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight mt-0.5">{s.reason}</p>
                                </div>
                                <button onClick={() => addSuggestedHabit(s)} className="w-[36px] h-[36px] bg-[#00A8D6] rounded-full text-white flex items-center justify-center shadow-sm hover:scale-105 transition-transform shrink-0">
                                    <Plus size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PROGRESS SECTION */}
                <div className="bg-white rounded-2xl shadow-sm p-[16px] mb-[16px] mt-[16px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex bg-[#F0F9FF] p-1 rounded-full gap-1">
                            {["This Week", "This Month"].map(tab => (
                                <button key={tab} onClick={() => setProgressTab(tab)}
                                    className="px-[12px] py-[6px] text-[12px] rounded-full transition-all"
                                    style={{
                                        backgroundColor: progressTab === tab ? '#00A8D6' : 'transparent',
                                        color: progressTab === tab ? 'white' : '#1a1a1a'
                                    }}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {progressTab === 'This Week' ? (
                        <div>
                            <h3 className="text-[16px] font-bold text-[#1a1a1a] mb-[16px]">Weekly Progress</h3>
                            <div className="flex items-end h-[100px] gap-[4px] px-1">
                                {formatDatesCompletion.map((curDay, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                                        <span className="text-[10px] text-[#9ca3af] mb-1">{curDay.percent}%</span>
                                        <div className="w-full rounded-t-[6px] transition-all duration-500" 
                                            style={{ 
                                                height: `${Math.max(4, curDay.percent)}%`, 
                                                backgroundColor: curDay.isToday ? '#00A8D6' : (curDay.percent > 0 ? '#B8E4F5' : '#F3F4F6'),
                                                minHeight: '4px'
                                            }} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between w-full mt-2 px-1 gap-[4px]">
                                {formatDatesCompletion.map((curDay, i) => (
                                    <span key={i} className="flex-1 text-center text-[12px] pt-[4px]" style={{ color: curDay.isToday ? '#00A8D6' : '#9ca3af', fontWeight: curDay.isToday ? 'bold' : 'normal' }}>{curDay.fullDayInfo.substring(0,3)}</span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-[16px] font-bold text-[#1a1a1a] mb-[16px]">Monthly Progress</h3>
                             <div className="grid grid-cols-7 gap-[2px]">
                                {["S", "M", "T", "W", "T", "F", "S"].map((d,i) => (
                                    <div key={i} className="text-[12px] text-[#9ca3af] text-center mb-1">{d}</div>
                                ))}
                                {monthGrid.map((dateStr, i) => (
                                    <div key={i} className="w-[28px] h-[28px] rounded-[4px] m-[2px] relative group mx-auto"
                                        style={getDayCompletionStyle(dateStr)}>
                                        {/* Tooltip */}
                                        {dateStr && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                                                {getDayHoverText(dateStr)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}
                </div>

            </div>
          </div>

          {[...Array(20)].map((_, i) => {
              if (!celebration) return null;
              const colors = ["#00A8D6","#FF6B6B","#4ECDC4","#FFE66D","#A8E6CF","#FF8B94"];
              const config = {
                  left: `${Math.random() * 100}%`,
                  size: `${6 + Math.random() * 6}px`,
                  bg: colors[Math.floor(Math.random() * colors.length)],
                  animDelay: `${Math.random() * 0.5}s`
              };
              return (
                  <div key={`confetti-${i}`} className="fixed top-0 rounded-full z-[110]"
                  style={{
                      left: config.left, width: config.size, height: config.size, backgroundColor: config.bg,
                      animation: `confettiFall 1.5s ease forwards`, animationDelay: config.animDelay
                  }}/>
              )
          })}

          {/* CELEBRATION OVERLAY */}
          {celebration && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-[24px] p-[32px] text-center" style={{ animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                      <div className="text-[64px] mb-2 leading-none" style={{ animation: 'checkBounce 0.6s ease' }}>{celebration.emoji}</div>
                      <h2 className="text-[24px] font-bold text-[#00A8D6] mb-2">🎉 Amazing!</h2>
                      <p className="text-[14px] text-[#9ca3af] italic max-w-[220px] mx-auto">{celebration.quote}</p>
                  </div>
              </div>
          )}

          {/* ADD HABIT MODAL */}
          {showAddModal && (
            <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center">
                <div className="bg-white w-full max-w-sm rounded-t-[24px] sm:rounded-[24px] p-[24px] max-h-[90vh] overflow-y-auto hide-scrollbar relative"
                     style={{ animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                    <h2 className="text-[20px] font-bold text-[#00A8D6] text-center mb-[24px]">New Habit ✨</h2>
                    
                    {/* Emoji Select */}
                    <div className="flex justify-center mb-4">
                        <button onClick={() => setShowEmojiGrid(!showEmojiGrid)}
                            className="w-[56px] h-[56px] bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[28px] flex items-center justify-center hover:bg-gray-50 transition-colors">
                            {newHabit.emoji}
                        </button>
                    </div>

                    {showEmojiGrid && (
                        <div className="mb-6 bg-[#F0F9FF] p-3 rounded-[16px] grid grid-cols-6 gap-2 place-items-center" style={{ animation: 'fadeUp 0.2s ease' }}>
                            {EMOJIS.map(e => (
                                <button key={e} onClick={() => { setNewHabit({...newHabit, emoji: e}); setShowEmojiGrid(false); }}
                                    className="w-[40px] h-[40px] text-[20px] rounded-xl flex items-center justify-center hover:bg-white transition-colors"
                                    style={{ border: newHabit.emoji === e ? '2px solid #00A8D6' : 'none', backgroundColor: newHabit.emoji === e ? 'white' : 'transparent' }}>
                                    {e}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Name */}
                    <div className="mb-5">
                        <input value={newHabit.name} onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                            className="w-full bg-white border-[1.5px] border-[#E0F4FB] rounded-[12px] px-[16px] py-[12px] text-[15px] font-normal focus:outline-none focus:border-[#00A8D6] transition-colors"
                            placeholder="What's the habit? e.g. Read 30 min" style={{fontFamily:"'Nunito', sans-serif"}}/>
                    </div>

                    {/* Category */}
                    <div className="mb-5">
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(c => (
                                <button key={c} onClick={() => setNewHabit({...newHabit, category: c})}
                                    className="px-[12px] py-[6px] rounded-[16px] text-[14px] transition-all"
                                    style={{
                                        backgroundColor: newHabit.category === c ? '#00A8D6' : 'white',
                                        color: newHabit.category === c ? 'white' : '#00A8D6',
                                        border: `1.5px solid #00A8D6`
                                    }}>{c}</button>
                            ))}
                        </div>
                    </div>

                    {/* Chain After */}
                    {habits.length > 0 && (
                        <div className="mb-5">
                            <label className="block text-[13px] font-bold text-gray-500 mb-2">Chain after habit: (optional)</label>
                            <select value={newHabit.chainedTo || ""} onChange={e => setNewHabit({...newHabit, chainedTo: e.target.value ? parseInt(e.target.value) : null})}
                                className="w-full bg-white border-[1.5px] border-[#E0F4FB] rounded-[12px] px-[16px] py-[10px] text-[14px] focus:outline-none focus:border-[#00A8D6] text-gray-700"
                                style={{fontFamily:"'Nunito', sans-serif"}}>
                                <option value="">None</option>
                                {habits.map(h => (
                                    <option key={h.id} value={h.id}>{h.emoji} {h.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Color picker */}
                    <div className="mb-5">
                        <div className="flex items-center gap-2 flex-wrap">
                             {COLORS.map(c => (
                                 <button key={c} onClick={() => setNewHabit({...newHabit, color: c})}
                                    className="w-[32px] h-[32px] rounded-full flex items-center justify-center transition-transform hover:scale-110"
                                    style={{ backgroundColor: c }}>
                                        {newHabit.color === c && <div className="w-[12px] h-[12px] rounded-full border-[2px] border-white text-white flex items-center justify-center"><Check size={8} /></div>}
                                 </button>
                             ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-[24px]">
                        <textarea value={newHabit.notes} onChange={e => setNewHabit({...newHabit, notes: e.target.value})}
                            className="w-full bg-white border-[1.5px] border-[#E0F4FB] rounded-[12px] px-[16px] py-[12px] text-[15px] focus:outline-none focus:border-[#00A8D6] transition-colors resize-none"
                            placeholder="Add a note... (optional)" rows="3" style={{fontFamily:"'Nunito', sans-serif"}}/>
                    </div>

                    <button onClick={addHabit}
                        className="w-full bg-[#00A8D6] text-white font-bold py-[14px] rounded-full shadow-lg hover:-translate-y-0.5 transition-all text-[16px] mb-3">
                        Add Habit 🎯
                    </button>
                    <button onClick={() => setShowAddModal(false)} className="w-full text-[#9ca3af] text-[15px] py-2">
                        Cancel
                    </button>
                </div>
            </div>
          )}

          {/* NOTES MODAL */}
          {notesModal && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
                  <div className="bg-white rounded-[16px] p-[20px] w-[85%] max-w-[340px] mx-auto" style={{ animation: 'popIn 0.2s ease' }}>
                      <h3 className="font-bold text-[#1a1a1a] mb-[12px] flex items-center gap-2 text-[16px]">
                          {habits.find(h => h.id === notesModal)?.emoji} Notes
                      </h3>
                      <textarea value={editingNotes} onChange={e => setEditingNotes(e.target.value)}
                          className="w-full border border-gray-200 rounded-[8px] p-[12px] text-[14px] outline-none focus:border-[#00A8D6] transition-colors resize-none mb-[16px]"
                          autoFocus rows="4"/>
                      <div className="flex gap-2 justify-end">
                           <button onClick={() => setNotesModal(null)} className="px-4 py-2 text-[#9ca3af] text-[15px]">Close</button>
                           <button onClick={saveNotes} className="px-[16px] py-[8px] bg-[#00A8D6] text-white rounded-[8px] text-[15px] shadow-sm">Save</button>
                      </div>
                  </div>
              </div>
          )}

          {/* XP POPUP */}
          {xpPopup && (
              <div className="fixed top-[80px] right-[16px] z-[120] bg-white rounded-xl py-[10px] px-[16px] shadow-[0_8px_24px_rgba(0,168,214,0.15)] border border-[#E0F4FB] pointer-events-none"
                   style={{ animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                  <span className="text-[#00A8D6] font-bold text-[15px]">{xpPopup}</span>
              </div>
          )}

          {/* AI COACH BUTTON */}
          <button onClick={() => setShowCoach(true)}
              className="fixed bottom-[90px] right-[16px] z-40 w-[52px] h-[52px] bg-[#00A8D6] rounded-full flex items-center justify-center text-[24px]"
              style={{ boxShadow: '0 4px 16px rgba(0,168,214,0.4)', animation: 'float 3s ease-in-out infinite' }}>
              🤖
          </button>

          {/* AI COACH MODAL */}
          {showCoach && (
              <div className="fixed inset-0 z-[80] bg-black/50 flex flex-col justify-end">
                  <div className="bg-white w-full rounded-t-[24px] p-[24px] max-h-[70vh] flex flex-col pt-4" style={{ animation: 'slideInUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                      <div className="flex justify-between items-center mb-4 shrink-0">
                          <h2 className="text-[18px] font-bold text-[#00A8D6] flex items-center gap-2 opacity-100">🤖 DoraLink Coach</h2>
                          <button onClick={() => setShowCoach(false)} className="bg-gray-100 p-1.5 rounded-full text-gray-500 border-none transition-transform hover:scale-110"><X size={18}/></button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto hide-scrollbar mb-4 min-h-[140px]">
                          <div className="bg-[#E8F8FF] rounded-2xl p-[16px] min-h-[100px] flex flex-col justify-center">
                              {coachLoading ? (
                                  <div className="flex items-center justify-center h-full gap-2 py-4">
                                      <div className="w-2.5 h-2.5 bg-[#00A8D6] rounded-full animate-bounce"></div>
                                      <div className="w-2.5 h-2.5 bg-[#00A8D6] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                      <div className="w-2.5 h-2.5 bg-[#00A8D6] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                  </div>
                              ) : coachMessage ? (
                                  <p className="text-[14px] text-[#1a1a1a] leading-relaxed whitespace-pre-line" style={{fontFamily:"'Nunito', sans-serif"}}>{coachMessage}</p>
                              ) : (
                                  <p className="text-[14px] text-[#00A8D6] font-semibold italic text-center mt-2" style={{fontFamily:"'Nunito', sans-serif"}}>I'm your AI Coach! How can I help you today?</p>
                              )}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 shrink-0">
                          <button onClick={() => getCoachAdvice('analyze')} className="bg-white border-[1.5px] border-[#00A8D6] rounded-xl p-[12px] text-[13px] text-[#00A8D6] font-bold active:bg-[#F0F9FF] transition-colors shadow-sm outline-none">📊 Analyze my habits</button>
                          <button onClick={() => getCoachAdvice('suggest')} className="bg-white border-[1.5px] border-[#00A8D6] rounded-xl p-[12px] text-[13px] text-[#00A8D6] font-bold active:bg-[#F0F9FF] transition-colors shadow-sm outline-none">💡 Suggest new habit</button>
                          <button onClick={() => getCoachAdvice('streak')} className="bg-white border-[1.5px] border-[#00A8D6] rounded-xl p-[12px] text-[13px] text-[#00A8D6] font-bold active:bg-[#F0F9FF] transition-colors shadow-sm outline-none">🔥 Boost my streak</button>
                          <button onClick={() => getCoachAdvice('struggling')} className="bg-white border-[1.5px] border-[#00A8D6] rounded-xl p-[12px] text-[13px] text-[#00A8D6] font-bold active:bg-[#F0F9FF] transition-colors shadow-sm outline-none">😔 I'm struggling</button>
                      </div>
                  </div>
              </div>
          )}

      </div>
    </>
  );
}
