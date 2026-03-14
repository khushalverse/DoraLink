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
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId)
  if (error) throw error
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
