import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Trash2, Bell, X } from 'lucide-react';

export default function HabitPage() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState('#00A8D6');

  const colorOptions = ['#00A8D6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = () => {
    const saved = localStorage.getItem('doralink_habits');
    if (saved) {
      setHabits(JSON.parse(saved));
    } else {
      setHabits([]);
    }
  };

  const saveHabits = (updatedHabits) => {
    setHabits(updatedHabits);
    localStorage.setItem('doralink_habits', JSON.stringify(updatedHabits));
  };

  // Add habit
  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const habit = {
      id: Date.now(),
      name: newHabitName.trim(),
      color: newHabitColor,
      streak: 0,
      bestStreak: 0,
      completedDates: [],
      reminderOn: false,
      createdAt: new Date().toISOString()
    };
    saveHabits([...habits, habit]);
    setNewHabitName('');
    setNewHabitColor('#00A8D6');
    setIsModalOpen(false);
  };

  const deleteHabit = (id) => {
    saveHabits(habits.filter(h => h.id !== id));
  };

  const getTodayStr = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const calculateStreak = (completedDates) => {
    if (!completedDates || completedDates.length === 0) return 0;
    const sorted = [...completedDates].sort().reverse();
    const today = getTodayStr();
    let streak = 0;
    
    // Check if streak is active (meaning today or yesterday is completed)
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    yesterdayDate.setMinutes(yesterdayDate.getMinutes() - yesterdayDate.getTimezoneOffset());
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    if (!sorted.includes(today) && !sorted.includes(yesterday)) {
      return 0; // Streak broken
    }

    // Count backwards from most recent
    let currentDate = new Date(sorted[0]);
    for (let i = 0; i < sorted.length; i++) {
        // If it's consecutive (or same day, though we shouldn't have duplicates)
        const d = sorted[i];
        const expectedDateStr = currentDate.toISOString().split('T')[0];
        
        if (d === expectedDateStr) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1); // Move to previous day
        } else {
            break; // Gap found
        }
    }

    return streak;
  };

  const isCompletedToday = (habit) => {
    return habit.completedDates.includes(getTodayStr());
  };

  const toggleHabitComplete = (id) => {
    const today = getTodayStr();
    
    const updated = habits.map(h => {
      if (h.id === id) {
        let newDates = [...(h.completedDates || [])];
        if (newDates.includes(today)) {
          newDates = newDates.filter(d => d !== today);
        } else {
          newDates.push(today);
        }
        const currentStreak = calculateStreak(newDates);
        return {
          ...h,
          completedDates: newDates,
          streak: currentStreak,
          bestStreak: Math.max(h.bestStreak || 0, currentStreak)
        };
      }
      return h;
    });
    saveHabits(updated);
  };

  const toggleReminder = (id) => {
    const updated = habits.map(h => h.id === id ? { ...h, reminderOn: !h.reminderOn } : h);
    saveHabits(updated);
  };

  // Stats Calculate
  const totalHabits = habits.length;
  const completedToday = habits.filter(isCompletedToday).length;
  const bestStreakAll = habits.length > 0 ? Math.max(...habits.map(h => h.bestStreak || 0)) : 0;

  // Chart Calculate
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
    if (habits.length === 0) return { day: getDayName(dateStr), percent: 0, isToday: dateStr === getTodayStr() };
    const completedThatDay = habits.filter(h => h.completedDates && h.completedDates.includes(dateStr)).length;
    return {
        day: getDayName(dateStr),
        percent: (completedThatDay / habits.length) * 100,
        isToday: dateStr === getTodayStr()
    };
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scaleInCheck {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .habit-card {
            transition: transform 0.2s ease, background-color 0.3s ease;
        }
        .habit-card:hover {
            transform: scale(1.02);
        }
      `}</style>
      <div className="bg-[#F0F9FF] text-[#1a1a1a] font-sans selection:bg-[#00A8D6] selection:text-white" style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', fontFamily: "'Nunito', sans-serif" }}>
          
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

          {/* MAIN CONTENT */}
          <div className="flex flex-col h-screen overflow-y-auto" style={{ width: '100%', minHeight: '100vh', position: 'relative', paddingTop: '70px', paddingBottom: '40px', zIndex: 10 }}>

            {/* FIXED HEADER */}
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'linear-gradient(to bottom, rgba(240,249,255,1) 0%, rgba(240,249,255,0.9) 50%, rgba(240,249,255,0) 100%)'
            }}>
              {/* Back Button */}
              <button onClick={() => navigate('/chat')}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#E0F4FB', border: '1.5px solid #B8E4F5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}>
                <ArrowLeft size={20} color="#00A8D6" />
              </button>

              <span style={{ fontSize: '18px', fontWeight: '800', color: '#00A8D6' }}>Habit Tracker</span>

              {/* Add Button */}
              <button onClick={() => setIsModalOpen(true)}
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
                <div className="grid grid-cols-3 gap-3 mb-6 mt-2">
                    <div className="bg-white rounded-2xl shadow-sm p-3 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-[#00A8D6] leading-none mb-1">{totalHabits}</span>
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Habits</span>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-3 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-[#00A8D6] leading-none mb-1">{completedToday}</span>
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Today</span>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-3 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-[#00A8D6] leading-none mb-1">{bestStreakAll}</span>
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Best Streak 🔥</span>
                    </div>
                </div>

                {/* TODAY'S HABITS LIST */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Today's Habits</h2>
                    <div className="space-y-3">
                        {habits.length === 0 ? (
                            <div className="text-center py-8 bg-white/50 rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500 font-medium">No habits yet.<br/>Click + to add your first habit!</p>
                            </div>
                        ) : (
                            habits.map(habit => {
                                const checked = isCompletedToday(habit);
                                const completedThisWeek = weekDates.filter(d => habit.completedDates?.includes(d)).length;
                                const weekProgress = (completedThisWeek / 7) * 100;

                                return (
                                    <div key={habit.id} className="habit-card rounded-2xl p-4 shadow-sm flex items-center gap-4"
                                       style={{ backgroundColor: checked ? '#E0F4FB' : 'white' }}>
                                        {/* Checkbox */}
                                        <button 
                                            onClick={() => toggleHabitComplete(habit.id)}
                                            style={{
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                border: checked ? 'none' : `2px solid ${habit.color}`,
                                                backgroundColor: checked ? habit.color : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {checked && <Check size={16} color="white" style={{ animation: 'scaleInCheck 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }} />}
                                        </button>

                                        {/* Middle */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[#1a1a1a] truncate text-base mb-0.5" style={{ textDecoration: checked ? 'line-through' : 'none', color: checked ? '#6b7280' : '#1a1a1a' }}>
                                                {habit.name}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-orange-500">🔥 {habit.streak} day streak</span>
                                                <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${weekProgress}%`, backgroundColor: habit.color }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right (Delete) */}
                                        <button onClick={() => deleteHabit(habit.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* PROGRESS CHART */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">This Week</h2>
                    <div className="bg-white p-5 rounded-2xl shadow-sm text-center">
                        <div className="flex items-end justify-between h-32 mb-2 gap-1.5">
                            {formatDatesCompletion.map((curDay, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                                    <div className="w-full rounded-t-md transition-all duration-500" 
                                        style={{ 
                                            height: `${curDay.percent || 4}%`, 
                                            backgroundColor: curDay.isToday ? '#00A8D6' : '#B8E4F5',
                                            minHeight: '4%'
                                        }} />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between w-full">
                            {formatDatesCompletion.map((curDay, i) => (
                                <span key={i} className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-tighter" style={{ color: curDay.isToday ? '#00A8D6' : undefined }}>{curDay.day}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* REMINDERS SECTION */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Reminders</h2>
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        {habits.length === 0 ? (
                             <div className="p-4 text-center text-sm text-gray-400 font-medium">Add habits to set reminders</div>
                        ) : habits.map((habit, idx) => (
                            <div key={habit.id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full" style={{ backgroundColor: `${habit.color}15` }}>
                                        <Bell size={16} color={habit.color} />
                                    </div>
                                    <span className="font-bold text-gray-700 text-sm">{habit.name}</span>
                                </div>
                                {/* Toggle */}
                                <button onClick={() => toggleReminder(habit.id)}
                                    className="w-11 h-6 rounded-full relative transition-colors duration-300"
                                    style={{ backgroundColor: habit.reminderOn ? '#00A8D6' : '#e5e7eb' }}>
                                    <div className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300"
                                        style={{ transform: habit.reminderOn ? 'translateX(20px)' : 'translateX(0)' }} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
          </div>

          {/* ADD HABIT MODAL */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" style={{ animation: 'fadeUp 0.2s ease' }}>
                <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative" style={{ animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                    <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full p-1">
                        <X size={18} />
                    </button>
                    <h2 className="text-xl font-black text-[#00A8D6] mb-5">New Habit</h2>
                    
                    <div className="mb-5">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Habit Name</label>
                        <input 
                            value={newHabitName}
                            onChange={e => setNewHabitName(e.target.value)}
                            className="w-full border-2 border-[#B8E4F5] rounded-xl p-3 font-bold text-gray-700 focus:outline-none focus:border-[#00A8D6] transition-colors bg-[#F0F9FF]"
                            placeholder="e.g. Read 10 pages, Drink water..."
                            autoFocus
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Color Label</label>
                        <div className="flex items-center gap-3">
                            {colorOptions.map(c => (
                                <button key={c} onClick={() => setNewHabitColor(c)}
                                    className="w-8 h-8 rounded-full border-2 transition-transform duration-200"
                                    style={{ backgroundColor: c, borderColor: newHabitColor === c ? '#1a1a1a' : 'transparent', transform: newHabitColor === c ? 'scale(1.15)' : 'scale(1)' }}
                                />
                            ))}
                        </div>
                    </div>

                    <button onClick={addHabit}
                        className="w-full bg-[#00A8D6] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(0,168,214,0.4)] hover:shadow-[0_6px_20px_rgba(0,168,214,0.6)] hover:-translate-y-0.5 transition-all active:scale-95 text-base">
                        Add Habit
                    </button>
                </div>
            </div>
          )}
      </div>
    </>
  );
}
