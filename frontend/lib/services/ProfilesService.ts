import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/types'

class ProfilesService {
  async getCurrentUserProfile(): Promise<Profile | null> {
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) return null

    return this.getProfileById(authData.user.id)
  }

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async getProfileById(profileId: string): Promise<Profile> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', profileId).single()

    if (error) throw error
    return data
  }

  async getProfileByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async createProfile(profileData: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase.from('profiles').insert([profileData]).select().single()

    if (error) throw error
    return data
  }

  async updateProfile(profileId: string, profileData: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', profileId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateCurrentUserProfile(profileData: Partial<Profile>): Promise<Profile | null> {
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) return null

    return this.updateProfile(authData.user.id, profileData)
  }

  async deleteProfile(profileId: string): Promise<void> {
    const { error } = await supabase.from('profiles').delete().eq('id', profileId)

    if (error) throw error
  }

  async getVerifiedProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_verified', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}

export const profilesService = new ProfilesService()
