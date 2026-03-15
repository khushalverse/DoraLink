import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase env variables missing!')
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
)

// Save new chat to database
export const saveChat = async (userId, title) => {
  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: userId, title })
    .select()
    .single()
  if (error) throw error
  return data
}

// Save message to database
export const saveMessage = async (chatId, role, content) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, role, content })
    .select()
    .single()
  if (error) throw error
  return data
}

// Get all chats for user
export const getUserChats = async (userId) => {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Get messages for a chat
export const getChatMessages = async (chatId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// Delete a chat
export const deleteChat = async (chatId) => {
  const { error: msgError } = await supabase
    .from('messages')
    .delete()
    .eq('chat_id', chatId)
  
  if(msgError) {
    console.error('Message delete error:', msgError)
    throw msgError
  }

  const { error: chatError } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId)
  
  if(chatError) {
    console.error('Chat delete error:', chatError)
    throw chatError
  }
}

export const saveMemory = async (userId, key, value) => {
  const { data, error } = await supabase
    .from('user_memory')
    .upsert({ 
      user_id: userId,
      memory_key: key,
      memory_value: value,
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'user_id,memory_key'
    })
    .select()
  if (error) throw error
  return data
}

export const getUserMemory = async (userId) => {
  const { data, error } = await supabase
    .from('user_memory')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data || []
}

export const deleteMemory = async (userId, key) => {
  const { error } = await supabase
    .from('user_memory')
    .delete()
    .eq('user_id', userId)
    .eq('memory_key', key)
  if (error) throw error
}

export const getUserHabits = async (userId) => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if(error) throw error
  return data || []
}

export const saveHabitToDb = async (userId, habit) => {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      name: habit.name,
      emoji: habit.emoji,
      category: habit.category,
      color: habit.color,
      streak: habit.streak || 0,
      best_streak: habit.bestStreak || 0,
      total_completions: habit.totalCompletions || 0,
      completed_dates: habit.completedDates || [],
      is_paused: habit.isPaused || false,
      notes: habit.notes || '',
      frequency: habit.frequency || 'daily',
      specific_days: habit.specificDays || [0,1,2,3,4,5,6]
    })
    .select()
    .single()
  if(error) throw error
  return data
}

export const updateHabitInDb = async (habitId, updates) => {
  const { data, error } = await supabase
    .from('habits')
    .update({
      name: updates.name,
      emoji: updates.emoji,
      category: updates.category,
      color: updates.color,
      streak: updates.streak,
      best_streak: updates.bestStreak,
      total_completions: updates.totalCompletions,
      completed_dates: updates.completedDates,
      is_paused: updates.isPaused,
      notes: updates.notes,
      frequency: updates.frequency || 'daily',
      specific_days: updates.specificDays || [0,1,2,3,4,5,6]
    })
    .eq('id', habitId)
    .select()
    .single()
  if(error) throw error
  return data
}

export const deleteHabitFromDb = async (habitId) => {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
  if(error) throw error
}

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if(error) return null
  return data
}

export const updateUserProfile = async (
  userId, updates
) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if(error) throw error
  return data
}
