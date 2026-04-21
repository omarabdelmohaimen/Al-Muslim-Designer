import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadRole = async (uid?: string) => {
    if (!isSupabaseConfigured) {
      setIsAdmin(false);
      return;
    }

    if (!uid) {
      setIsAdmin(false);
      return;
    }

    const { data } = await (supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .in("role", ["admin", "moderator"]);

    setIsAdmin(Boolean(data?.length));
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      void loadRole(currentSession?.user?.id);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      void loadRole(data.session?.user?.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAdmin,
      signOut: async () => {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
      },
      refreshRole: async () => {
        await loadRole(user?.id);
      },
    }),
    [user, session, loading, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
