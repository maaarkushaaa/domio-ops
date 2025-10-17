import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/use-notifications';

export interface ActiveQuickCall {
  id: string;
  title: string;
  room_name: string;
  room_url: string;
  created_by: string;
  created_at: string;
}

interface VideoCallRealtimeContextValue {
  activeCall: ActiveQuickCall | null;
  setActiveCall: (call: ActiveQuickCall | null) => void;
}

const VideoCallRealtimeContext = createContext<VideoCallRealtimeContextValue | undefined>(undefined);

export function VideoCallRealtimeProvider({ children }: { children: ReactNode }) {
  const [activeCall, setActiveCallState] = useState<ActiveQuickCall | null>(null);
  const { addNotification } = useNotifications();
  const [notifiedCallId, setNotifiedCallId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const notifiedCallIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const vapidPublicKey = (import.meta as any)?.env?.VITE_VAPID_PUBLIC_KEY as string | undefined;

  const base64ToUint8Array = useCallback((base64: string) => {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64Safe);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }, []);

  const ensurePushSubscription = useCallback(async () => {
    if (!notificationsEnabled) return;
    if (!('serviceWorker' in navigator)) return;
    if (!vapidPublicKey) {
      console.warn('VITE_VAPID_PUBLIC_KEY is not configured');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(vapidPublicKey),
        });
      }

      if (!subscription) return;

      const payload = {
        subscription: subscription.toJSON(),
        platform: navigator.userAgent,
      };

      await supabase.functions.invoke('webpush-save', {
        body: payload,
      });

      setHasActiveSubscription(true);
    } catch (error) {
      console.error('Failed to ensure push subscription:', error);
    }
  }, [notificationsEnabled, vapidPublicKey, base64ToUint8Array]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id || null;
      setCurrentUserId(uid);
      currentUserIdRef.current = uid;
    }).catch((error) => {
      console.error('Error fetching user for quick call provider:', error);
    });
  }, []);

  useEffect(() => {
    notifiedCallIdRef.current = notifiedCallId;
  }, [notifiedCallId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!('Notification' in window)) return;

    const permission = Notification.permission;
    setNotificationsEnabled(permission === 'granted');

    if (permission === 'default') {
      Notification.requestPermission().then(result => {
        const granted = result === 'granted';
        setNotificationsEnabled(granted);
        if (granted && 'serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then(registration => {
            if (!registration) {
              navigator.serviceWorker.register('/service-worker.js').catch(error => {
                console.error('Service worker registration failed after permission grant:', error);
              });
            }
          }).catch(error => {
            console.error('Service worker getRegistration failed:', error);
          });
        }
      }).catch(error => {
        console.error('Notification permission request failed:', error);
      });
    } else if (permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (!registration) {
          navigator.serviceWorker.register('/service-worker.js').catch(error => {
            console.error('Service worker registration failed after existing permission:', error);
          });
        }
      }).catch(error => {
        console.error('Service worker getRegistration failed:', error);
      });
    }
  }, []);

  useEffect(() => {
    if (!notificationsEnabled) return;
    if (hasActiveSubscription) return;
    ensurePushSubscription();
  }, [notificationsEnabled, hasActiveSubscription, ensurePushSubscription]);

  const fetchLatestCall = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from('video_quick_calls')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error loading quick call:', error);
      return;
    }

    if (data) {
      const call = data as ActiveQuickCall;
      setActiveCallState(call);
      setNotifiedCallId((prev) => prev || call.id);
    } else {
      setActiveCallState(null);
      setNotifiedCallId(null);
    }
  }, []);

  useEffect(() => {
    fetchLatestCall();

    const channel = supabase
      .channel('video_quick_calls_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_quick_calls' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as any)?.id;
          setActiveCallState((prev) => (prev && prev.id === deletedId ? null : prev));
          if (deletedId && notifiedCallIdRef.current === deletedId) {
            setNotifiedCallId(null);
          }
          return;
        }

        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newCall = payload.new as ActiveQuickCall & { status: string };
          if (newCall.status === 'active') {
            setActiveCallState(newCall);
            if (notifiedCallIdRef.current !== newCall.id && newCall.created_by !== currentUserIdRef.current) {
              addNotification({
                type: 'info',
                title: 'Новый видеозвонок',
                message: newCall.title,
                persistent: true,
                actions: [
                  {
                    label: 'Присоединиться',
                    action: () => {
                      const url = new URL(window.location.origin + '/video-calls');
                      url.searchParams.set('room', newCall.room_name);
                      url.searchParams.set('autoJoin', '1');
                      window.location.href = url.toString();
                    },
                  },
                ],
              });
            }
            setNotifiedCallId(newCall.id);
          } else if (newCall.status === 'ended') {
            setActiveCallState((prev) => (prev && prev.id === newCall.id ? null : prev));
            if (notifiedCallIdRef.current === newCall.id) {
              setNotifiedCallId(null);
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLatestCall, addNotification]);

  const setActiveCall = useCallback((call: ActiveQuickCall | null) => {
    setActiveCallState(call);
  }, []);

  return (
    <VideoCallRealtimeContext.Provider value={{ activeCall, setActiveCall }}>
      {children}
    </VideoCallRealtimeContext.Provider>
  );
}

export function useVideoCallRealtime() {
  const context = useContext(VideoCallRealtimeContext);
  if (!context) {
    throw new Error('useVideoCallRealtime must be used within VideoCallRealtimeProvider');
  }
  return context;
}
