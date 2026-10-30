'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import type { StudentPassState } from '@/lib/studentPassStorage';
import { formatPassExpiry } from '@/lib/studentPassStorage';
import {
  activateStudentPassSubscription,
  cancelStudentPassSubscription,
  fetchStudentPassState,
  startStudentPassCheckout,
  type NewebpayCardInput,
} from '@/lib/subscriptionService';
import { addUnlockedId, readUnlockedIds } from '@/lib/unlockStorage';

const INACTIVE: StudentPassState = {
  active: false,
  expiresAt: null,
  planLabel: 'Student Pass',
  activatedAt: null,
};

/**
 * 全站共用：訂閱狀態（Supabase subscriptions + LocalStorage fallback）
 * active 時導師聯絡方式自動解鎖
 */
export function useStudentPass() {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [studentPass, setStudentPass] = useState<StudentPassState>(INACTIVE);
  const [contactedTutorIds, setContactedTutorIds] = useState<string[]>([]);
  const [authReady, setAuthReady] = useState(false);

  const hydrate = useCallback(async (userId?: string | null) => {
    setContactedTutorIds(readUnlockedIds(userId));
    const pass = await fetchStudentPassState(userId);
    setStudentPass(pass);
    return pass;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      const user = session?.user ?? null;
      setCurrentUser(user);
      await hydrate(user?.id ?? null);
      if (!cancelled) setAuthReady(true);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        setCurrentUser(user);
        void hydrate(user?.id ?? null);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [hydrate]);

  const refreshPass = useCallback(async () => {
    return hydrate(currentUser?.id ?? null);
  }, [currentUser?.id, hydrate]);

  const subscribe = useCallback(
    async (
      cardOrOpts?: NewebpayCardInput | { card?: NewebpayCardInput; mode?: 'card' | 'period' }
    ) => {
      if (!currentUser) {
        throw new Error('請先登入');
      }
      const opts =
        cardOrOpts && 'cardNo' in cardOrOpts
          ? { card: cardOrOpts as NewebpayCardInput, mode: 'card' as const }
          : (cardOrOpts as { card?: NewebpayCardInput; mode?: 'card' | 'period' } | undefined);

      const result = await startStudentPassCheckout(currentUser.id, {
        mode: opts?.mode || (opts?.card ? 'card' : 'period'),
        card: opts?.card,
      });
      if (result.error) throw new Error(result.error);
      if (result.activated || result.mode === 'demo') {
        const pass = await hydrate(currentUser.id);
        return pass;
      }
      // 定期定額 Form 導向藍新中
      return studentPass;
    },
    [currentUser, hydrate, studentPass]
  );

  const activateDemo = useCallback(async () => {
    const pass = await activateStudentPassSubscription(currentUser?.id ?? null, 1);
    setStudentPass(pass);
    return pass;
  }, [currentUser?.id]);

  const cancelPass = useCallback(async () => {
    const pass = await cancelStudentPassSubscription(currentUser?.id ?? null);
    setStudentPass(pass);
    return pass;
  }, [currentUser?.id]);

  const markContacted = useCallback(
    (tutorId: string) => {
      const next = addUnlockedId(tutorId, currentUser?.id ?? null);
      setContactedTutorIds(next);
      return next;
    },
    [currentUser?.id]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    await hydrate(null);
  }, [hydrate]);

  return {
    currentUser,
    authReady,
    studentPass,
    hasActivePass: studentPass.active,
    contactedTutorIds,
    setContactedTutorIds,
    hydrate,
    refreshPass,
    subscribe,
    activateDemo,
    cancelPass,
    markContacted,
    signOut,
    formatPassExpiry,
  };
}
