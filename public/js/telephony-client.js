/**
 * 🚀 ULTIMATE Telephony Client - Fatimah Financial Hub
 * WebRTC Video/Audio/Screen Sharing with Professional Error Handling
 * Updated with proper socket initialization and camera fallback
 */

class TelephonyClient {
  constructor(config = {}) {
    // Socket configuration
    this.socketUrl = config.socketUrl || window.location.origin;
    this.username = config.username || `Trader${Math.floor(Math.random() * 1000)}`;
    this.socket = null;
    
    // Media elements
    this.localVideoEl = config.localVideoEl || null;
    this.remoteVideoEl = config.remoteVideoEl || null;
    
    // Callbacks
    this.onUsersUpdate = config.onUsersUpdate || (() => {});
    this.onCallStatusChange = config.onCallStatusChange || (() => {});
    this.onRemoteStream = config.onRemoteStream || (() => {});
    this.onMessage = config.onMessage || (() => {});
    this.onIncomingCall = config.onIncomingCall || (() => {});
    this.onCallEnded = config.onCallEnded || (() => {});

    // WebRTC
    this.peerConnections = new Map();
    this.localStream = null;
    this.screenStream = null;
    this.currentCall = null;
    this.isInCall = false;

    // Professional STUN/TURN configuration
    this.config = {
      iceServers: [
        // Free Google STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Backup STUN servers
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.voipbuster.com:3478' }
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };
  }

  // ========== CONNECTION MANAGEMENT ==========
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting to socket server...');
        this.socket = io(this.socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        // Connection events
        this.socket.on('connect', async () => {
          console.log('✅ Socket connected:', this.socket.id);
          this.setupSocketListeners();
          this.registerUser();
          
          try {
            await this.initializeLocalStream();
            resolve({ success: true, socketId: this.socket.id });
          } catch (error) {
            console.warn('⚠️ Media initialization failed, continuing without:', error);
            resolve({ success: true, socketId: this.socket.id, mediaWarning: error.message });
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          reject(new Error(`Connection failed: ${error.message}`));
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
        });

      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        reject(error);
      }
    });
  }

  setupSocketListeners() {
    if (!this.socket) return;

    // ========== DEBUG: Log all socket events ==========
  console.log('📡 Setting up socket listeners...');
  
  this.socket.onAny((eventName, ...args) => {
    console.log(`📨 [SOCKET EVENT] ${eventName}:`, args.length > 0 ? args[0] : 'No data');
  });

  this.socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
  });

  this.socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  // ========== END DEBUG ==========


    // User management
    this.socket.on('telephony-users', (users) => {
      console.log('👥 Users updated:', users.length);
      this.onUsersUpdate(users);
    });

    // Incoming call
    this.socket.on('telephony-call-request', (data) => {
      console.log('📞 Incoming call from:', data.from);
      this.onIncomingCall(data.from, data.callType, data.caller);
    });

    // Call accepted
    this.socket.on('telephony-call-accepted', (data) => {
      console.log('✅ Call accepted by:', data.from);
      this.startWebRTC(data.from);
    });

    // Call rejected
    this.socket.on('telephony-call-rejected', (data) => {
      console.log('❌ Call rejected by:', data.from);
      this.onCallStatusChange('Call rejected', {});
      this.currentCall = null;
    });

    // Call ended
    this.socket.on('telephony-call-ended', (data) => {
      console.log('📞 Call ended by:', data.from);
      this.endCall();
    });

    // WebRTC signaling
    this.socket.on('webrtc-offer', async (data) => {
      console.log('📨 Received WebRTC offer from:', data.from);
      await this.handleOffer(data.offer, data.from, data.caller);
    });

    this.socket.on('webrtc-answer', async (data) => {
      console.log('📨 Received WebRTC answer from:', data.from);
      const pc = this.peerConnections.get(data.from);
      if (pc && data.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        this.isInCall = true;
        this.currentCall = data.from;
        this.onCallStatusChange('connected', { userId: data.from });
      }
    });

    this.socket.on('webrtc-ice-candidate', async (data) => {
      const pc = this.peerConnections.get(data.from);
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.warn('Failed to add ICE candidate:', error);
        }
      }
    });

    this.socket.on('webrtc-end-call', (data) => {
      console.log('📞 Remote ended call:', data.from);
      this.closePeerConnection(data.from);
      this.onCallEnded();
    });
  }

  registerUser() {
    if (!this.socket) return;

    console.log('📝 Registering telephony user:', this.username, this.socket.id);
    
    this.socket.emit('telephony-register', {
      username: this.username,
      id: this.socket.id,
      type: 'trader'
    });
  }

  // ========== MEDIA MANAGEMENT ==========
  async initializeLocalStream() {
    try {
      // First try with ideal constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.updateLocalVideo(this.localStream);
      console.log('✅ Local stream obtained');
      return this.localStream;

    } catch (error) {
      console.warn('⚠️ Primary constraints failed, trying fallback...', error);
      
      try {
        // Fallback to basic constraints
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });
        this.updateLocalVideo(this.localStream);
        console.log('✅ Local stream obtained (fallback)');
        return this.localStream;
        
      } catch (fallbackError) {
        console.warn('⚠️ All media attempts failed, creating dummy stream:', fallbackError);
        
        // Create dummy stream for testing
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0066cc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText(this.username, 20, 40);
        ctx.fillText('Test Video (No Camera)', 20, 240);
        
        const dummyStream = canvas.captureStream();
        this.localStream = dummyStream;
        this.updateLocalVideo(dummyStream);
        
        console.log('✅ Dummy stream created');
        return dummyStream;
      }
    }
  }

  updateLocalVideo(stream) {
    if (this.localVideoEl && stream) {
      this.localVideoEl.srcObject = stream;
      this.localVideoEl.muted = true;
      this.localVideoEl.autoplay = true;
      this.localVideoEl.playsInline = true;
    }
  }

  async startScreenShare() {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Replace video track in all active connections
      const videoTrack = this.screenStream.getVideoTracks()[0];
      this.peerConnections.forEach(pc => {
        const senders = pc.getSenders();
        senders.forEach(sender => {
          if (sender.track?.kind === 'video') {
            sender.replaceTrack(videoTrack);
          }
        });
      });

      if (this.localVideoEl) {
        this.localVideoEl.srcObject = this.screenStream;
      }

      // Handle when user stops sharing
      videoTrack.onended = () => this.stopScreenShare();

      console.log('🖥️ Screen sharing started');
      return { success: true };
    } catch (error) {
      console.error('❌ Screen share failed:', error);
      return { success: false, error: error.message };
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
      
      // Restore camera
      if (this.localStream && this.localVideoEl) {
        this.localVideoEl.srcObject = this.localStream;
        
        // Replace tracks back in connections
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
          this.peerConnections.forEach(pc => {
            const senders = pc.getSenders();
            senders.forEach(sender => {
              if (sender.track?.kind === 'video') {
                sender.replaceTrack(videoTrack);
              }
            });
          });
        }
      }
      console.log('🖥️ Screen sharing stopped');
    }
  }

  // ========== CALL MANAGEMENT ==========
  async startCall(userId, callType = 'video') {
    if (this.isInCall) {
      this.onCallStatusChange('error', { error: 'Already in a call' });
      return false;
    }

    this.currentCall = { userId, callType };
    this.onCallStatusChange('calling', { userId });
    
    this.socket.emit('telephony-call-request', {
      to: userId,
      callType,
      caller: { username: this.username }
    });
    
    return true;
  }

  async startWebRTC(targetId) {
    try {
      const pc = new RTCPeerConnection(this.config);
      this.peerConnections.set(targetId, pc);

      // Add local stream tracks
      const stream = this.screenStream || this.localStream;
      if (stream) {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('📹 Remote stream received');
        if (event.streams[0]) {
          this.onRemoteStream(event.streams[0], targetId);
          
          if (this.remoteVideoEl) {
            this.remoteVideoEl.srcObject = event.streams[0];
            this.remoteVideoEl.autoplay = true;
            this.remoteVideoEl.playsInline = true;
          }
        }
      };

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('webrtc-ice-candidate', {
            to: targetId,
            candidate: event.candidate
          });
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      this.socket.emit('webrtc-offer', {
        to: targetId,
        offer: offer,
        caller: { username: this.username }
      });

      this.isInCall = true;
      this.onCallStatusChange('connected', { userId: targetId });
      return true;

    } catch (error) {
      console.error('❌ WebRTC setup failed:', error);
      this.onCallStatusChange('error', { error: error.message });
      return false;
    }
  }

  async handleOffer(offer, from, caller) {
    try {
      const pc = new RTCPeerConnection(this.config);
      this.peerConnections.set(from, pc);
      
      // Add local stream
      const stream = this.screenStream || this.localStream;
      if (stream) {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('📹 Remote stream received (incoming)');
        if (event.streams[0]) {
          this.onRemoteStream(event.streams[0], from);
          
          if (this.remoteVideoEl) {
            this.remoteVideoEl.srcObject = event.streams[0];
            this.remoteVideoEl.autoplay = true;
            this.remoteVideoEl.playsInline = true;
          }
        }
      };

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('webrtc-ice-candidate', {
            to: from,
            candidate: event.candidate
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      this.socket.emit('webrtc-answer', {
        to: from,
        answer: answer
      });

      this.currentCall = from;
      this.onCallStatusChange('connected', { userId: from });
      return true;

    } catch (error) {
      console.error('❌ Failed to handle offer:', error);
      this.socket.emit('webrtc-reject-call', { to: from });
      return false;
    }
  }

  acceptCall() {

    console.log('✅ Accepting call from:', this.currentCall?.userId);
    closeIncomingCallModal(); // Close the modal

    if (this.currentCall) {
      this.socket.emit('telephony-call-accepted', {
        to: this.currentCall.userId
      });
      this.startWebRTC(this.currentCall.userId);
      return true;
    }
    return false;
  }

  rejectCall() {

    console.log('❌ Rejecting call from:', this.currentCall?.userId);
    closeIncomingCallModal(); // Close the modal

    if (this.currentCall?.userId) {
      this.socket.emit('telephony-call-rejected', {
        to: this.currentCall.userId
      });
      this.currentCall = null;
      this.onCallStatusChange('Call rejected', {});
      return true;
    }
    return false;
  }

  endCall() {
    if (this.currentCall) {
      this.socket.emit('telephony-call-ended', {
        to: this.currentCall.userId
      });
    }
    
    // Close all peer connections
    this.peerConnections.forEach((pc, userId) => {
      pc.close();
    });
    this.peerConnections.clear();
    
    this.isInCall = false;
    this.currentCall = null;
    this.onCallStatusChange('ended', {});
    
    // Clear remote video
    if (this.remoteVideoEl) {
      this.remoteVideoEl.srcObject = null;
    }
  }

  closePeerConnection(userId) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }
  }

  // ========== MEDIA CONTROLS ==========
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // ========== CLEANUP ==========
  disconnect() {
    this.endCall();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    console.log('🔌 Telephony client disconnected');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TelephonyClient;
} else {
  window.TelephonyClient = TelephonyClient;
}
