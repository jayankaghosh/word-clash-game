import { useState, useEffect, useRef, useCallback } from 'react';

export const useVoiceChat = (socket, playerSocketId, opponentSocketId) => {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [opponentVoiceEnabled, setOpponentVoiceEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteAudio = useRef(null);

  // ICE servers for NAT traversal
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  const cleanup = useCallback(() => {
    console.log('Cleaning up voice chat...');
    
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    setIsConnected(false);
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerConnection.current) {
      return peerConnection.current;
    }

    console.log('Creating peer connection...');
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate && opponentSocketId) {
        console.log('Sending ICE candidate to opponent');
        socket.emit('voice-ice-candidate', {
          targetSocketId: opponentSocketId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteAudio.current && event.streams[0]) {
        remoteAudio.current.srcObject = event.streams[0];
        setIsConnected(true);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
      } else if (pc.connectionState === 'connected') {
        setIsConnected(true);
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [socket, opponentSocketId]);

  const startVoiceChat = useCallback(async () => {
    try {
      setError(null);
      console.log('Starting voice chat...');

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;

      // Create peer connection and add tracks
      const pc = createPeerConnection();
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('Sending voice offer to opponent');
      socket.emit('voice-offer', {
        targetSocketId: opponentSocketId,
        offer
      });

      setVoiceEnabled(true);
      socket.emit('voice-enabled', { enabled: true });

    } catch (err) {
      console.error('Error starting voice chat:', err);
      setError(err.message);
      cleanup();
    }
  }, [socket, opponentSocketId, createPeerConnection, cleanup]);

  const stopVoiceChat = useCallback(() => {
    console.log('Stopping voice chat...');
    cleanup();
    setVoiceEnabled(false);
    socket.emit('voice-enabled', { enabled: false });
  }, [socket, cleanup]);

  const toggleVoiceChat = useCallback(() => {
    if (voiceEnabled) {
      stopVoiceChat();
    } else {
      startVoiceChat();
    }
  }, [voiceEnabled, startVoiceChat, stopVoiceChat]);

  // Handle incoming voice offer
  useEffect(() => {
    if (!socket) return;

    const handleVoiceOffer = async ({ fromSocketId, offer }) => {
      try {
        console.log('Received voice offer from:', fromSocketId);

        if (!voiceEnabled) {
          console.log('Voice chat not enabled, ignoring offer');
          return;
        }

        // Get user media if not already available
        if (!localStream.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStream.current = stream;
        }

        const pc = createPeerConnection();
        
        // Add local tracks
        localStream.current.getTracks().forEach(track => {
          pc.addTrack(track, localStream.current);
        });

        // Set remote description and create answer
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log('Sending voice answer');
        socket.emit('voice-answer', {
          targetSocketId: fromSocketId,
          answer
        });

      } catch (err) {
        console.error('Error handling voice offer:', err);
        setError(err.message);
      }
    };

    socket.on('voice-offer', handleVoiceOffer);

    return () => {
      socket.off('voice-offer', handleVoiceOffer);
    };
  }, [socket, voiceEnabled, createPeerConnection]);

  // Handle incoming voice answer
  useEffect(() => {
    if (!socket) return;

    const handleVoiceAnswer = async ({ fromSocketId, answer }) => {
      try {
        console.log('Received voice answer from:', fromSocketId);
        
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error('Error handling voice answer:', err);
        setError(err.message);
      }
    };

    socket.on('voice-answer', handleVoiceAnswer);

    return () => {
      socket.off('voice-answer', handleVoiceAnswer);
    };
  }, [socket]);

  // Handle incoming ICE candidates
  useEffect(() => {
    if (!socket) return;

    const handleIceCandidate = async ({ fromSocketId, candidate }) => {
      try {
        console.log('Received ICE candidate from:', fromSocketId);
        
        if (peerConnection.current) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    };

    socket.on('voice-ice-candidate', handleIceCandidate);

    return () => {
      socket.off('voice-ice-candidate', handleIceCandidate);
    };
  }, [socket]);

  // Handle opponent voice status
  useEffect(() => {
    if (!socket) return;

    const handlePlayerVoiceStatus = ({ socketId, enabled, players }) => {
      console.log('Player voice status update:', { socketId, enabled });
      
      // Update opponent's voice status
      if (socketId !== playerSocketId) {
        setOpponentVoiceEnabled(enabled);
        
        // If opponent disabled voice, clean up
        if (!enabled && peerConnection.current) {
          cleanup();
        }
      }
    };

    socket.on('player-voice-status', handlePlayerVoiceStatus);

    return () => {
      socket.off('player-voice-status', handlePlayerVoiceStatus);
    };
  }, [socket, playerSocketId, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    voiceEnabled,
    opponentVoiceEnabled,
    isConnected,
    error,
    toggleVoiceChat,
    remoteAudio
  };
};
