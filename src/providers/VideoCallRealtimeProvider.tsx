import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type SignalType = 'offer' | 'answer' | 'candidate' | 'bye';

type ConnectionState = 'connecting' | 'connected' | 'disconnected';

interface VideoCallSession {
  id: string;
  title: string;
  host_id: string;
  status: string;
  created_at: string;
  ended_at: string | null;
}

interface VideoCallParticipant {
  user_id: string;
  role: 'host' | 'guest';
  connection_state: ConnectionState;
  joined_at: string | null;
  left_at: string | null;
}

interface VideoCallSignal {
  session_id: string;
  sender_id: string;
  receiver_id: string | null;
  type: SignalType;
  payload: Record<string, any>;
}

interface RemoteStream {
  id: string;
  stream: MediaStream;
  type: 'camera' | 'screen' | 'unknown';
}

interface VideoCallRealtimeContextValue {
  session: VideoCallSession | null;
  participants: VideoCallParticipant[];
  localStream: MediaStream | null;
  remoteStreams: RemoteStream[];
  screenStream: MediaStream | null;
  connectionState: RTCPeerConnectionState;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  createSession: (title: string, invitees: string[]) => Promise<string | null>;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  isScreenSharing: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  setVideoEnabled: (enabled: boolean) => void;
}

const peerConnectionConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VideoCallRealtimeContext = createContext<VideoCallRealtimeContextValue | undefined>(undefined);

export function VideoCallRealtimeProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [session, setSession] = useState<VideoCallSession | null>(null);
  const [participants, setParticipants] = useState<VideoCallParticipant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const currentUserIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const signalsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const participantsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isHostRef = useRef(false);

  const fetchCurrentUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Не удалось получить пользователя для видеозвонка', error);
      return;
    }
    currentUserIdRef.current = data.user?.id ?? null;
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Браузер не поддерживает доступ к камере и микрофону');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    stream.getAudioTracks().forEach((track) => {
      track.enabled = isAudioEnabled;
    });
    stream.getVideoTracks().forEach((track) => {
      track.enabled = isVideoEnabled;
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, [isAudioEnabled, isVideoEnabled]);

  const updateRemoteStreamsState = useCallback(() => {
    setRemoteStreams(Array.from(remoteStreamsRef.current.entries()).map(([id, stream]) => ({ id, stream })));
  }, []);

  const flushPendingIceCandidates = useCallback(async () => {
    if (!sessionIdRef.current || pendingIceCandidatesRef.current.length === 0) {
      return;
    }

    const toSend = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    await Promise.all(
      toSend.map((candidate) =>
        supabase.functions.invoke('video-call-signal', {
          body: {
            session_id: sessionIdRef.current,
            type: 'candidate',
            payload: candidate,
          },
        })
      )
    );
  }, []);

  const cleanupPeerConnection = useCallback(() => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    pc.onicecandidate = null;
    pc.ontrack = null;
    pc.onconnectionstatechange = null;

    pc.getSenders().forEach((sender) => {
      try {
        pc.removeTrack(sender);
      } catch (error) {
        console.warn('Ошибка удаления отправителя из peer connection', error);
      }
    });

    pc.close();
    peerConnectionRef.current = null;
    setConnectionState('new');
    remoteStreamsRef.current.clear();
    updateRemoteStreamsState();
  }, [updateRemoteStreamsState]);

  const cleanupLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
  }, []);

  const unsubscribeRealtime = useCallback(() => {
    if (signalsChannelRef.current) {
      supabase.removeChannel(signalsChannelRef.current);
      signalsChannelRef.current = null;
    }

    if (participantsChannelRef.current) {
      supabase.removeChannel(participantsChannelRef.current);
      participantsChannelRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    sessionIdRef.current = null;
    isHostRef.current = false;
    pendingIceCandidatesRef.current = [];
    setSession(null);
    setParticipants([]);
    cleanupPeerConnection();
    cleanupLocalStream();
  }, [cleanupLocalStream, cleanupPeerConnection]);

  const leaveSession = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    const userId = currentUserIdRef.current;

    if (!sessionId || !userId) {
      unsubscribeRealtime();
      resetState();
      return;
    }

    try {
      await supabase.functions.invoke('video-call-signal', {
        body: {
          session_id: sessionId,
          type: 'bye',
          payload: { user_id: userId },
        },
      });

      await supabase
        .from('video_call_participants')
        .update({
          connection_state: 'disconnected',
          left_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (isHostRef.current) {
        await supabase
          .from('video_call_sessions')
          .update({ status: 'ended', ended_at: new Date().toISOString() })
          .eq('id', sessionId)
          .eq('host_id', userId);
      }
    } catch (error) {
      console.error('Ошибка при завершении звонка', error);
    } finally {
      unsubscribeRealtime();
      resetState();
      toast({ title: 'Звонок завершён', description: 'Вы покинули видеоконференцию' });
    }
  }, [resetState, toast, unsubscribeRealtime]);

  const sendSignal = useCallback(
    async (type: SignalType, payload: Record<string, any>, receiverId: string | null = null) => {
      if (!sessionIdRef.current) {
        if (type === 'candidate') {
          pendingIceCandidatesRef.current.push(payload as RTCIceCandidateInit);
        }
        return;
      }

      const { error } = await supabase.functions.invoke('video-call-signal', {
        body: {
          session_id: sessionIdRef.current,
          receiver_id: receiverId,
          type,
          payload,
        },
      });

      if (error) {
        console.error('Не удалось отправить сигнал WebRTC', error);
      }
    },
    []
  );

  const createPeerConnection = useCallback(async () => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(peerConnectionConfig);

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await sendSignal('candidate', event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      const participantId = event.track.id || stream.id;
      remoteStreamsRef.current.set(participantId, stream);
      updateRemoteStreamsState();
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    const stream = await ensureLocalStream();
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    peerConnectionRef.current = pc;
    return pc;
  }, [ensureLocalStream, sendSignal, updateRemoteStreamsState]);

  const fetchSession = useCallback(async (sessionId: string) => {
    const { data, error } = await supabase
      .from<VideoCallSession>('video_call_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Не удалось загрузить сессию', error);
      return null;
    }

    return data;
  }, []);

  const fetchParticipants = useCallback(async (sessionId: string) => {
    const { data, error } = await supabase
      .from<VideoCallParticipant>('video_call_participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Не удалось загрузить участников', error);
      return [];
    }

    return data ?? [];
  }, []);

  const subscribeToParticipants = useCallback((sessionId: string) => {
    participantsChannelRef.current = supabase
      .channel(`video_call_participants:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_call_participants', filter: `session_id=eq.${sessionId}` },
        async () => {
          const updated = await fetchParticipants(sessionId);
          setParticipants(updated);
        }
      )
      .subscribe();
  }, [fetchParticipants]);

  const handleSignal = useCallback(
    async (signal: VideoCallSignal) => {
      const pc = await createPeerConnection();

      switch (signal.type) {
        case 'offer': {
          if (isHostRef.current) return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal('answer', answer);
          await flushPendingIceCandidates();
          break;
        }
        case 'answer': {
          if (!isHostRef.current) return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          await flushPendingIceCandidates();
          break;
        }
        case 'candidate': {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
          } catch (error) {
            console.error('Не удалось добавить ICE-кандидата', error);
          }
          break;
        }
        case 'bye': {
          const userId = signal.payload?.user_id;
          if (userId) {
            remoteStreamsRef.current.delete(userId);
            updateRemoteStreamsState();
          }
          break;
        }
        default:
          break;
      }
    },
    [createPeerConnection, flushPendingIceCandidates, sendSignal, updateRemoteStreamsState]
  );

  const subscribeToSignals = useCallback((sessionId: string) => {
    signalsChannelRef.current = supabase
      .channel(`video_call_signals:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'video_call_signals', filter: `session_id=eq.${sessionId}` },
        async (payload) => {
          const signal = payload.new as VideoCallSignal;
          if (signal.sender_id === currentUserIdRef.current) {
            return;
          }
          await handleSignal(signal);
        }
      )
      .subscribe();
  }, [handleSignal]);

  const replayRecentSignals = useCallback(
    async (sessionId: string) => {
      const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from<VideoCallSignal>('video_call_signals')
        .select('*')
        .eq('session_id', sessionId)
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Не удалось получить сигналы для повторения', error);
        return;
      }

      for (const signal of data ?? []) {
        if (signal.sender_id === currentUserIdRef.current) continue;
        await handleSignal(signal);
      }
    },
    [handleSignal]
  );

  const startSessionSubscriptions = useCallback(
    async (sessionId: string) => {
      subscribeToParticipants(sessionId);
      subscribeToSignals(sessionId);
      await replayRecentSignals(sessionId);
    },
    [replayRecentSignals, subscribeToParticipants, subscribeToSignals]
  );

  const createSession = useCallback(
    async (title: string, invitees: string[]) => {
      await fetchCurrentUser();
      if (!currentUserIdRef.current) {
        toast({ title: 'Ошибка', description: 'Необходима авторизация', variant: 'destructive' });
        return null;
      }

      const { data, error } = await supabase
        .from('video_call_sessions')
        .insert({ title, host_id: currentUserIdRef.current })
        .select()
        .single();

      if (error || !data) {
        console.error('Не удалось создать сессию', error);
        toast({ title: 'Ошибка', description: 'Не удалось создать звонок', variant: 'destructive' });
        return null;
      }

      sessionIdRef.current = data.id;
      isHostRef.current = true;
      setSession(data);

      const { error: participantError } = await supabase
        .from('video_call_participants')
        .insert({
          session_id: data.id,
          user_id: currentUserIdRef.current,
          role: 'host',
          connection_state: 'connected',
          joined_at: new Date().toISOString(),
        });

      if (participantError) {
        console.error('Не удалось добавить участника', participantError);
      }

      if (invitees.length > 0) {
        await supabase.functions.invoke('webpush-send', {
          body: {
            session_id: data.id,
            title,
            invitees,
          },
        });
      }

      const updatedParticipants = await fetchParticipants(data.id);
      setParticipants(updatedParticipants);
      await startSessionSubscriptions(data.id);

      const pc = await createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal('offer', offer);

      return data.id;
    },
    [
      createPeerConnection,
      fetchCurrentUser,
      fetchParticipants,
      sendSignal,
      startSessionSubscriptions,
      toast,
    ]
  );

  const joinSession = useCallback(
    async (sessionId: string) => {
      await fetchCurrentUser();
      if (!currentUserIdRef.current) {
        toast({ title: 'Ошибка', description: 'Необходима авторизация', variant: 'destructive' });
        return;
      }

      const existingSession = await fetchSession(sessionId);
      if (!existingSession) {
        toast({ title: 'Ошибка', description: 'Сессия не найдена', variant: 'destructive' });
        return;
      }

      sessionIdRef.current = sessionId;
      isHostRef.current = existingSession.host_id === currentUserIdRef.current;
      setSession(existingSession);

      const { error } = await supabase
        .from('video_call_participants')
        .upsert(
          {
            session_id: sessionId,
            user_id: currentUserIdRef.current,
            role: isHostRef.current ? 'host' : 'guest',
            connection_state: 'connected',
            joined_at: new Date().toISOString(),
            left_at: null,
          },
          { onConflict: 'session_id,user_id' }
        );

      if (error) {
        console.error('Не удалось обновить участника', error);
      }

      const updatedParticipants = await fetchParticipants(sessionId);
      setParticipants(updatedParticipants);
      await startSessionSubscriptions(sessionId);

      await createPeerConnection();

      if (isHostRef.current) {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal('offer', offer);
      }
    },
    [
      createPeerConnection,
      fetchCurrentUser,
      fetchParticipants,
      fetchSession,
      sendSignal,
      startSessionSubscriptions,
      toast,
    ]
  );

  const setAudioEnabled = useCallback((enabled: boolean) => {
    setIsAudioEnabled(enabled);
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }, []);

  const setVideoEnabled = useCallback((enabled: boolean) => {
    setIsVideoEnabled(enabled);
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }, []);

  useEffect(() => {
    return () => {
      unsubscribeRealtime();
      cleanupPeerConnection();
      cleanupLocalStream();
    };
  }, [cleanupLocalStream, cleanupPeerConnection, unsubscribeRealtime]);

  const value = useMemo<VideoCallRealtimeContextValue>(
    () => ({
      session,
      participants,
      localStream,
      remoteStreams,
      connectionState,
      isAudioEnabled,
      isVideoEnabled,
      createSession,
      joinSession,
      leaveSession,
      setAudioEnabled,
      setVideoEnabled,
    }),
    [
      connectionState,
      createSession,
      isAudioEnabled,
      isVideoEnabled,
      joinSession,
      leaveSession,
      localStream,
      participants,
      remoteStreams,
      session,
      setAudioEnabled,
      setVideoEnabled,
    ]
  );

  return <VideoCallRealtimeContext.Provider value={value}>{children}</VideoCallRealtimeContext.Provider>;
}

export function useVideoCallRealtime() {
  const context = useContext(VideoCallRealtimeContext);
  if (!context) {
    throw new Error('useVideoCallRealtime должен использоваться внутри VideoCallRealtimeProvider');
  }
  return context;
}
