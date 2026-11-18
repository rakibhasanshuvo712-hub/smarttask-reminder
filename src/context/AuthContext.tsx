import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '@/types';
import {
  getSupabaseClient,
  isLiveSupabaseConnected,
  localDb,
  INITIAL_DEMO_USERS,
} from '@/lib/supabase';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  isSupabaseLive: boolean;
  allProfiles: Profile[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const isSupabaseLive = isLiveSupabaseConnected();

  // Load initial session
  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      const supabase = getSupabaseClient();

      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch profile from profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser(profile);
            } else {
              // Create fallback profile
              const newProf: Profile = {
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                timezone: 'Asia/Dhaka',
                time_format: '12h',
                default_reminder_offsets: [1440, 360, 120, 30],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              await supabase.from('profiles').insert(newProf);
              setUser(newProf);
            }
          }
        } catch (err) {
          console.warn('Supabase auth session fetch error:', err);
        }
      } else {
        // Local mode session
        const session = localDb.getCurrentSession();
        if (session?.user) {
          setUser(session.user);
        }
        setAllProfiles(localDb.getProfiles());
      }

      setLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Password validation: min 6 chars, numeric allowed
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            setUser(profile);
          }
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Login failed.' };
      }
    }

    // Local mode login
    const profiles = localDb.getProfiles();
    const existing = profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());

    if (existing) {
      setUser(existing);
      localDb.setCurrentSession(existing);
      return { success: true };
    }

    // If email doesn't exist yet in local mode, create it automatically
    const newProfile: Profile = {
      id: 'user-' + Date.now().toString(36),
      full_name: email.split('@')[0] || 'New User',
      email: email.trim(),
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
      timezone: 'Asia/Dhaka',
      time_format: '12h',
      default_reminder_offsets: [1440, 360, 120, 30],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localDb.saveProfile(newProfile);
    localDb.seedStarterTasksForUser(newProfile.id, newProfile.full_name);
    setUser(newProfile);
    localDb.setCurrentSession(newProfile);
    setAllProfiles(localDb.getProfiles());
    return { success: true };
  };

  const register = async (fullName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!fullName || fullName.trim().length === 0) {
      return { success: false, error: 'Full Name is required.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Valid email address is required.' };
    }
    // Simple passwords with minimum length 6, numeric-only accepted
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const newProfile: Profile = {
            id: data.user.id,
            full_name: fullName.trim(),
            email: email.trim(),
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
            timezone: 'Asia/Dhaka',
            time_format: '12h',
            default_reminder_offsets: [1440, 360, 120, 30],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await supabase.from('profiles').upsert(newProfile);
          setUser(newProfile);
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Registration failed.' };
      }
    }

    // Local mode register
    const newProfile: Profile = {
      id: 'user-' + Date.now().toString(36),
      full_name: fullName.trim(),
      email: email.trim(),
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
      timezone: 'Asia/Dhaka',
      time_format: '12h',
      default_reminder_offsets: [1440, 360, 120, 30],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localDb.saveProfile(newProfile);
    localDb.seedStarterTasksForUser(newProfile.id, newProfile.full_name);
    setUser(newProfile);
    localDb.setCurrentSession(newProfile);
    setAllProfiles(localDb.getProfiles());
    return { success: true };
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
    localDb.setCurrentSession(null);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const updated: Profile = {
      ...user,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to update profile' };
      }
    }

    localDb.saveProfile(updated);
    setUser(updated);
    localDb.setCurrentSession(updated);
    setAllProfiles(localDb.getProfiles());
    return { success: true };
  };

  const switchUser = (userId: string) => {
    const profile = localDb.getProfile(userId);
    if (profile) {
      setUser(profile);
      localDb.setCurrentSession(profile);
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseLive,
        allProfiles,
        login,
        register,
        logout,
        updateProfile,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
