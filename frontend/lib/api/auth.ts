'use server'

import { createClient } from '@/utils/supabase/server'

// API URL - default to localhost if not provided in env
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'


const getSession = async () => {
  const supabase = await createClient()
  const session = await supabase.auth.getSession()
  if (!session.data.session?.access_token) {
    throw new Error('No session found')
  }
  return session.data.session?.access_token
}
/**
 * Get current user information
 */
export async function getUserInfo(){
  const sessionToken = await getSession();
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json();
    //console.log('API Response:', result); 
    
    return result;
  } catch (error) {
    console.error('Error generating flashcards:', error)
    throw error
  }
}

