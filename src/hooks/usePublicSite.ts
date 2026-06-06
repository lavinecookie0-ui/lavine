'use client';

import { useState, useEffect } from 'react';
import { subscribeToPublicSiteSettings } from '@/lib/firebase/firestore';
import { PublicSiteSettings } from '@/types';
import { FALLBACK_SITE_INFO } from '@/data/publicSite';

export function usePublicSite() {
  const [settings, setSettings] = useState<PublicSiteSettings>(FALLBACK_SITE_INFO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToPublicSiteSettings((data) => {
      if (data) {
        setSettings({ ...FALLBACK_SITE_INFO, ...data });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { settings, loading };
}
