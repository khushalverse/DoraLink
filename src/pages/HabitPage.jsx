import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, PauseCircle, PlayCircle, Check, X, ChevronDown, StickyNote, Target } from 'lucide-react';

export default function HabitPage() {
  const [habits, setHabits] = useState([]);
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Default');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [celebration, setCelebration] = useState(null);
  
  const [progressTab, setProgressTab] = useState('This Week');
  const [showAddModal, setShowAddModal] = useState(false);
  const [notesModal, setNotesModal] = useState(null);
  const [showEmojiGrid, setShowEmojiGrid] = useState(false);
  
  const [newHabit, setNewHabit] = useState({
    name: '', emoji: '💪', category: 'Health 🏥', 
    color: '#00A8D6', notes: ''
  });
  const [editingNotes, setEditingNotes] = useState('');

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
    const saved = localStorage.getItem('doralink_habits');
    if (saved) {
      setHabits(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('doralink_habits', JSON.stringify(habits));
  }, [habits]);

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
    const today = getTodayStr();
    setHabits(prev => prev.map(h => {
      if (h.id !== id || h.isPaused) return h;
      
      const done = h.completedDates?.includes(today);
      const newDates = done
        ? h.completedDates.filter(d => d !== today)
        : [...(h.completedDates || []), today];
        
      const streak = calculateStreak(newDates);
      
      if (!done) {
        const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        setCelebration({ emoji: h.emoji, quote });
        setTimeout(() => setCelebration(null), 1500);
      }
      
      return {
        ...h,
        completedDates: newDates,
        streak,
        bestStreak: Math.max(h.bestStreak || 0, streak),
        totalCompletions: done 
          ? Math.max(0, h.totalCompletions - 1)
          : (h.totalCompletions || 0) + 1
      };
    }));
  };

  const addHabit = () => {
    if (!newHabit.name.trim()) return;
    const habit = {
      id: Date.now(),
      ...newHabit,
      streak: 0,
      bestStreak: 0,
      totalCompletions: 0,
      completedDates: [],
      isPaused: false,
      frequency: "daily",
      createdAt: new Date().toISOString()
    };
    setHabits(prev => [habit, ...prev]);
    setNewHabit({
      name: '', emoji: '💪', category: 'Health 🏥',
      color: '#00A8D6', notes: ''
    });
    setShowEmojiGrid(false);
    setShowAddModal(false);
  };

  const togglePause = (id) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, isPaused: !h.isPaused } : h));
  };

  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

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
              <button onClick={() => setShowAddModal(true)}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#00A8D6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,168,214,0.3)'
                }}>
                <Plus size={20} color="white" />
              </button>
            </div>

            <div className="max-w-2xl mx-auto w-full px-4" style={{ animation: 'fadeUp 0.4s ease both' }}>
                
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
                        <div className="relative">
                            <button onClick={() => setShowSortDropdown(!showSortDropdown)}
                                className="flex items-center gap-1 bg-white border border-[#00A8D6] rounded-full px-3 py-1.5 text-[14px] text-[#00A8D6] shadow-sm">
                                {sort.split(' ')[0] === 'By' ? sort : sort} <ChevronDown size={14} />
                            </button>
                            {showSortDropdown && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-[#E0F4FB] rounded-xl shadow-lg z-20 py-1 w-36 overflow-hidden">
                                     {["Default", "By Streak 🔥", "By Name 📝"].map(s => (
                                         <button key={s} onClick={() => { setSort(s); setShowSortDropdown(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#F0F9FF] hover:text-[#00A8D6]">
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

      </div>
    </>
  );
}
