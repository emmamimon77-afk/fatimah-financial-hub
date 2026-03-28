// 🔧 GLOBAL VARIABLES - Add this at VERY TOP of file
let userInteracted = false;

// Detect any user click
document.addEventListener('click', () => {
    if (!userInteracted) {
        userInteracted = true;
        console.log('✅ User interaction detected - autoplay enabled');
    }
});

class SimpleTelephony {
    constructor() {
        this.socket = io();
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.users = [];
        this.currentCall = null;

        window.currentTelephonyInstance = this;
        
        this.init();
    }
  
    async init() {
        this.socket.on('connect', () => {
            console.log('Connected:', this.socket.id);
            this.updateUserList();
            this.registerUser();
        });    

        this.socket.on('users', (users) => {
            this.users = users;
            this.displayUsers();
        });
        
        this.socket.on('offer', async (data) => {
            console.log('Received offer from:', data.from);
            await this.handleOffer(data.offer, data.from);
        });
        
        this.socket.on('answer', async (data) => {
            console.log('Received answer from:', data.from);
            if (this.peerConnection) {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        });
        
        this.socket.on('ice-candidate', async (data) => {
            if (this.peerConnection && data.candidate) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        });
        
        this.socket.on('call-ended', () => {
            this.endCall();
        });
        
        // Setup UI
        this.setupUI();

        // AUTO-START VIDEO AFTER 1 SECOND
        setTimeout(() => {
            console.log('🚀 Auto-starting video...');
            this.startVideo();
        }, 1000);
    }
    

    setupUI() {
        document.getElementById('startBtn').onclick = () => this.startVideo();
        document.getElementById('callBtn').onclick = () => this.startCall();
        document.getElementById('hangupBtn').onclick = () => this.endCall();
        document.getElementById('toggleVideo').onclick = () => this.toggleVideo();
        document.getElementById('toggleAudio').onclick = () => this.toggleAudio();
        
        // ✅ Add test audio button if it exists in HTML
        if (document.getElementById('testAudioBtn')) {
            document.getElementById('testAudioBtn').onclick = () => this.testAudio();
        }
    }
   
 
    async startVideo() {
        // Don't create new stream if already exists
        if (this.localStream) {
            console.log('✅ Local stream already exists');
            return;
        }

        try {
            // Try to get camera/mic
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            document.getElementById('localVideo').srcObject = this.localStream;
            document.getElementById('callBtn').disabled = false;
            console.log('🎥 Video started with tracks:', 
                this.localStream.getTracks().map(t => t.kind));
        } catch (err) {
            console.log('No camera/mic, creating test video');
        
            // Create test video with canvas
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
        
            // Draw test pattern
            ctx.fillStyle = '#0066cc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '30px Arial';
            ctx.fillText('Test Video', 50, 100);
            ctx.fillText('No Camera', 50, 200);
        
            // Create VIDEO stream from canvas
            const videoStream = canvas.captureStream(30);

        
// Create AUDIO track (LOUD test tone)
let audioTrack;
try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    
    // 🔊 LOUDER settings
    oscillator.frequency.value = 600; // Higher pitch (A5 = 440Hz, 600Hz is higher)
    oscillator.type = 'square'; // Square wave is louder than sine
    
    // Add volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5; // 50% volume (was silent before)
    
    oscillator.connect(gainNode);
    const destination = audioContext.createMediaStreamDestination();
    gainNode.connect(destination);
    
    oscillator.start();
    audioTrack = destination.stream.getAudioTracks()[0];
    audioTrack.enabled = true; // ENABLE IT (was false!)
    console.log('🔊 Created LOUD test audio track (600Hz square wave)');
} catch (audioErr) {
    console.log('⚠️ Could not create AudioContext, creating dummy audio track');
    // Method 2: Create a dummy audio track (but enable it)
    audioTrack = new MediaStreamTrack();
    audioTrack.kind = 'audio';
    audioTrack.enabled = true; // Enable it!
    audioTrack.readyState = 'live';
}

        
            // Combine video and audio tracks
            this.localStream = new MediaStream([
                ...videoStream.getVideoTracks(),
                audioTrack
            ]);
        
            document.getElementById('localVideo').srcObject = this.localStream;
            document.getElementById('callBtn').disabled = false;
            console.log('🎬 Test video created with tracks:', 
                this.localStream.getTracks().map(t => t.kind));
        }
        
        // Register user after getting stream
        this.registerUser();
    }

    registerUser() {
        const userName = `Trader${Math.floor(Math.random() * 1000)}`;
        this.socket.emit('register-simple-user', { name: userName });
        console.log('Auto-registered as:', userName);
    }    

    
    displayUsers() {
        console.log('📋 Displaying users:', this.users);
    
        const userList = document.getElementById('userList');
        userList.innerHTML = '';
    
        // Filter out self
        const otherUsers = this.users.filter(user => user.id !== this.socket.id);
        console.log('👥 Other users:', otherUsers);
    
        if (otherUsers.length === 0) {
            userList.innerHTML = '<div>No other users online</div>';
            return;
        }
    
        otherUsers.forEach(user => {
            console.log(`👤 Adding user: ${user.name} (${user.id})`);
            const div = document.createElement('div');
            div.style.margin = '5px 0';
        
            const button = document.createElement('button');
            button.textContent = `Call ${user.name}`;
            button.onclick = () => {
                console.log(`📞 Calling ${user.name} (${user.id})`);
                this.callUser(user.id);
            };
        
            div.appendChild(button);
            userList.appendChild(div);
        });
    }

    async callUser(userId) {
        console.log('📞 Calling user:', userId);
        this.currentCall = userId;
    
        // Create peer connection with simpler STUN config
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
                // Remove others to reduce errors
            ]
        });

        if (window.monitorPeerConnection) {
            window.monitorPeerConnection(this.peerConnection, "OUTGOING");
        }
    
        console.log('🔧 PeerConnection created for outgoing call');
    
        // Add debug listeners
        this.peerConnection.onconnectionstatechange = () => {
            console.log('🔗 [OUTGOING] Connection state:', this.peerConnection.connectionState);
        };
    
        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('🧊 [OUTGOING] ICE state:', this.peerConnection.iceConnectionState);
        };
    
        this.peerConnection.onsignalingstatechange = () => {
            console.log('📡 [OUTGOING] Signaling state:', this.peerConnection.signalingState);
        };
    
        this.peerConnection.onicecandidateerror = (error) => {
            console.log('⚠️ ICE candidate error (non-fatal):', error.errorCode);
        };
    
        // Add local stream
        if (this.localStream) {
            console.log('🎥 Adding local stream tracks to outgoing call');
            this.localStream.getTracks().forEach(track => {
                console.log(`  - ${track.kind} track:`, track.enabled ? 'enabled' : 'disabled');
                this.peerConnection.addTrack(track, this.localStream);
            });
        } else {
            console.warn('⚠️ No local stream for outgoing call');
        }

        // Handle remote stream with user interaction check
        this.peerConnection.ontrack = (event) => {
            console.log('🎬 [OUTGOING] Remote track received!', event.streams.length, 'streams');
            console.log('Track details:', {
                kind: event.track.kind,
                enabled: event.track.enabled,
                readyState: event.track.readyState,
                id: event.track.id
            });
        
            this.remoteStream = event.streams[0];
            const remoteVideo = document.getElementById('remoteVideo');
            remoteVideo.srcObject = this.remoteStream;
            remoteVideo.muted = true;
            remoteVideo.playsInline = true;

            // Try to play with user interaction check
            if (userInteracted) {
                remoteVideo.play()
                    .then(() => console.log('✅ Video playing after user interaction'))
                    .catch(e => console.log('⚠️ Play failed:', e));
            } else {
                console.log('⏳ Waiting for user interaction to play video');
                this.showPlayButton();
            }
    
            console.log('✅ Remote video element updated');
        };
        
    
        // ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('🧊 [OUTGOING] ICE candidate:', event.candidate.type);
                this.socket.emit('ice-candidate', {
                    to: userId,
                    candidate: event.candidate
                });
            } else {
                console.log('✅ [OUTGOING] ICE gathering complete');
            }
        };
    
        // Create offer
        try {
            console.log('📝 Creating offer...');
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
        
            console.log('📝 Setting local description...');
            await this.peerConnection.setLocalDescription(offer);
        
            console.log('📤 Sending offer to:', userId);
            this.socket.emit('offer', {
                to: userId,
                offer: offer
            });
        
            document.getElementById('hangupBtn').disabled = false;
            console.log('✅ Call initiated successfully');
        
        } catch (error) {
            console.error('❌ Error creating/sending offer:', error);
        }
    }    


    async handleOffer(offer, from) {
        if (confirm(`Incoming call from ${from}. Accept?`)) {
            console.log('✅ Accepting call from:', from);
            this.currentCall = from;
            
            // Create peer connection with simpler STUN config
            this.peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            });
       
            if (window.monitorPeerConnection) {
                window.monitorPeerConnection(this.peerConnection, "INCOMING");
            }

            console.log('🔧 PeerConnection created');
        
            // Add debug listeners
            this.peerConnection.onconnectionstatechange = () => {
                console.log('🔗 Connection state:', this.peerConnection.connectionState);
            };
        
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('🧊 ICE state:', this.peerConnection.iceConnectionState);
            };
        
            this.peerConnection.onsignalingstatechange = () => {
                console.log('📡 Signaling state:', this.peerConnection.signalingState);
            };         

            this.peerConnection.onicecandidateerror = (error) => {
                console.log('⚠️ ICE candidate error (non-fatal):', error.errorCode);
            };

            // Add local stream
            if (this.localStream) {
                console.log('🎥 Adding local stream tracks');
                this.localStream.getTracks().forEach(track => {
                    console.log(`  - ${track.kind} track`);
                    this.peerConnection.addTrack(track, this.localStream);
                });
            } else {
                console.warn('⚠️ No local stream to add');
            }
         
            // Handle remote stream with user interaction check
            this.peerConnection.ontrack = (event) => {
                console.log('🎬 Remote track received!', event.streams.length, 'streams');
                console.log('Track:', event.track.kind, 'enabled:', event.track.enabled);

                this.remoteStream = event.streams[0];
                const remoteVideo = document.getElementById('remoteVideo');
                remoteVideo.srcObject = this.remoteStream;
                remoteVideo.muted = true;
                remoteVideo.playsInline = true;

                // Try to play with user interaction check
                if (userInteracted) {
                    remoteVideo.play()
                        .then(() => console.log('✅ Video playing after user interaction'))
                        .catch(e => console.log('⚠️ Play failed:', e));
                } else {
                    console.log('⏳ Waiting for user interaction to play video');
                    this.showPlayButton();
                }
    
                console.log('✅ Remote video element updated');
            };

            // ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket.emit('ice-candidate', {
                        to: from,
                        candidate: event.candidate
                    });
                }
            };
            
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            
            this.socket.emit('answer', {
                to: from,
                answer: answer
            });
            
            document.getElementById('hangupBtn').disabled = false;
        }
    }
    
    endCall() {
        if (this.currentCall) {
            this.socket.emit('end-call', { to: this.currentCall });
        }
        
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
            document.getElementById('remoteVideo').srcObject = null;
        }
        
        this.currentCall = null;
        document.getElementById('hangupBtn').disabled = true;
    }
    
    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
        }
    }
    
    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
        }
    }
    
    // Test audio method
    testAudio() {
        if (this.remoteStream) {
            const audioTracks = this.remoteStream.getAudioTracks();
            console.log('🔊 Audio tracks:', audioTracks.length);
            
            if (audioTracks.length > 0) {
                const remoteVideo = document.getElementById('remoteVideo');
                remoteVideo.muted = !remoteVideo.muted;
                console.log('Remote audio:', remoteVideo.muted ? '🔇 Muted' : '🔊 Unmuted');
            }
        }
    }
    
    showPlayButton() {
        // Remove existing play button if any
        const existingBtn = document.getElementById('playRemoteBtn');
        if (existingBtn) existingBtn.remove();
        
        // Create new play button
        const playBtn = document.createElement('button');
        playBtn.id = 'playRemoteBtn';
        playBtn.textContent = '▶ Play Remote Video';
        playBtn.style.margin = '5px';
        playBtn.style.padding = '10px';
        playBtn.style.background = '#0066cc';
        playBtn.style.color = 'white';
        playBtn.style.border = 'none';
        playBtn.style.borderRadius = '5px';
        playBtn.style.cursor = 'pointer';
        
        playBtn.onclick = () => {
            document.getElementById('remoteVideo').play()
                .then(() => {
                    console.log('✅ Remote video playing after user click');
                    playBtn.remove();
                })
                .catch(e => console.error('❌ Still cannot play:', e));
        };
        
        // Add to controls section
        const controls = document.querySelector('.controls');
        if (controls) {
            controls.appendChild(playBtn);
        }
    }
    

    updateUserList() {
        // Initial request
        this.socket.emit('get-users');
    }
}

// 🔍 DEBUG HELPER: Add this AFTER the class definition
window.telephonyDebug = {
    getInstance: () => window.currentTelephonyInstance,
    getPeerConnection: () => window.currentTelephonyInstance?.peerConnection,
    getLocalStream: () => window.currentTelephonyInstance?.localStream,
    getRemoteStream: () => window.currentTelephonyInstance?.remoteStream,
    checkVideoElements: () => {
        const local = document.getElementById('localVideo');
        const remote = document.getElementById('remoteVideo');
        return {
            local: {
                element: local,
                hasStream: !!local?.srcObject,
                playing: !local?.paused,
                tracks: local?.srcObject?.getTracks()?.map(t => ({
                    kind: t.kind,
                    enabled: t.enabled,
                    readyState: t.readyState
                })) || []
            },
            remote: {
                element: remote,
                hasStream: !!remote?.srcObject,
                playing: !remote?.paused,
                tracks: remote?.srcObject?.getTracks()?.map(t => ({
                    kind: t.kind,
                    enabled: t.enabled,
                    readyState: t.readyState
                })) || []
            }
        };
    },
    forceSetRemoteStream: (stream) => {
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
            remoteVideo.srcObject = stream;
            return remoteVideo.play();
        }
    }
};

console.log('🔧 SimpleTelephony debug helpers loaded');

// Start when page loads
window.addEventListener('load', () => {
    window.telephony = new SimpleTelephony();
});
