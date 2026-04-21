// Environment-backed Supabase client with a safe local fallback so the app
// can still run when Supabase env vars are missing.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

type AuthSubscription = { unsubscribe: () => void };

const emptyResult = <T>(data: T) => Promise.resolve({ data, error: null as null });

const createThenableBuilder = <T = any>(data: T) => {
  const builder: any = {
    select() { return builder; },
    insert() { return builder; },
    update() { return builder; },
    upsert() { return builder; },
    delete() { return builder; },
    eq() { return builder; },
    neq() { return builder; },
    in() { return builder; },
    gt() { return builder; },
    gte() { return builder; },
    lt() { return builder; },
    lte() { return builder; },
    like() { return builder; },
    ilike() { return builder; },
    order() { return builder; },
    range() { return builder; },
    limit() { return builder; },
    single() { return emptyResult(data); },
    maybeSingle() { return emptyResult(data); },
    then(onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) {
      return emptyResult(data).then(onFulfilled, onRejected);
    },
    catch(onRejected: (reason: any) => any) {
      return emptyResult(data).catch(onRejected);
    },
    finally(onFinally: () => void) {
      return emptyResult(data).finally(onFinally);
    },
  };
  return builder;
};

const createMockSupabaseClient = () => {
  const auth = {
    onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => undefined } as AuthSubscription } }),
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase is not configured.' } }),
  };

  const storage = {
    from: () => ({
      upload: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
      remove: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  };

  return {
    auth,
    storage,
    from: () => createThenableBuilder([]),
    rpc: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
  } as any;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createMockSupabaseClient();
