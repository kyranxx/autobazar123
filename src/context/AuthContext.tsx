'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from "@/lib/supabase/client";
import { User, Session } from '@supabase/supabase-js'

interface Profile {
    id: string
    email: string
    full_name: string | null
    phone: string | null
    credit_balance: number
    is_verified: boolean
    avatar_url: string | null
}

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
    isAdmin: boolean
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    const supabase = createClient()

    const checkAdminStatus = async (userId: string) => {
        const { data, error } = await supabase
            .from('site_admins')
            .select('user_id')
            .eq('user_id', userId)
            .single()

        setIsAdmin(!error && !!data)
    }

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (!error && data) {
            setProfile(data as Profile)
        }
    }

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id)
        }
    }

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
                checkAdminStatus(session.user.id)
            }
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session)
                setUser(session?.user ?? null)

                if (event === 'SIGNED_IN' && session?.user) {
                    await fetchProfile(session.user.id)
                    await checkAdminStatus(session.user.id)
                } else if (event === 'SIGNED_OUT') {
                    setProfile(null)
                    setIsAdmin(false)
                }
            }
        )

        return () => subscription.unsubscribe()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 🕒 Session Timeout Logic (30 mins of inactivity)
    useEffect(() => {
        if (!user) return;

        let timeout: NodeJS.Timeout;
        const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes

        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                console.log("Inactivity timeout reached. Logging out...");
                signOut();
            }, TIMEOUT_DURATION);
        };

        // Events to listen for
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Initialize timer
        resetTimer();

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        return () => {
            clearTimeout(timeout);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut()
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            setUser(null)
            setProfile(null)
            setSession(null)
            setIsAdmin(false)
            // Redirect to home page after logout
            window.location.href = '/'
        }
    }

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, isAdmin, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
