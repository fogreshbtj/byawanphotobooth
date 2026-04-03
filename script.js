class UltimatePhotoBooth {
    constructor() {
        // DOM Elements
        this.elements = {
            video: document.getElementById('video'),
            canvas: document.getElementById('canvas'),
            postCanvas: document.getElementById('post-canvas'),
            captureBtn: document.getElementById('capture-btn'),
            // ... all elements
        };

        // State
        this.state = {
            stream: null,
            photos: [],
            currentTemplate: 0,
            currentFilter: 0,
            currentProps: 0,
            isVoiceActive: false,
            isCountingDown: false,
            language: 'id',
            liveUsers: 0
        };

        // ML Models
        this.mlModels = {
            faceDetection: null,
            ageGender: null
        };

        // 3D Scene
        this.threeScene = null;
        this.arProps = [];

        this.init();
    }

    async init() {
        // 1. PWA Registration
        this.registerSW();
        
        // 2. Load ML Models
        await this.loadMLModels();
        
        // 3. Initialize Camera
        await this.initCamera();
        
        // 4. Setup Event Listeners
        this.setupEventListeners();
        
        // 5. Load Assets
        await this.loadAssets();
        
        // 6. Init 3D AR
        this.init3D();
        
        // 7. Voice Recognition
        this.initVoiceRecognition();
        
        // 8. Battery API
        this.initBattery();
        
        // 9. Multi-language
        this.initI18n();
        
        // 10. WebSocket for Live Stats
        this.initWebSocket();
        
        // Hide loading
        this.hideLoading();
    }

    // 🔥 FEATURE 1: Advanced Camera w/ Multi-Camera Support
    async initCamera() {
        const constraints = {
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 },
                facingMode: 'user'
            }
        };

        try {
            this.state.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.elements.video.srcObject = this.state.stream;
            
            this.elements.video.onloadedmetadata = () => {
                this.elements.video.play();
                this.updateCanvasSize();
            };
        } catch (err) {
            console.error('Camera Error:', err);
            this.showError('Camera access denied');
        }
    }

    // 🔥 FEATURE 2: TensorFlow.js ML Filters (Face Detection, Age/Gender)
    async loadMLModels() {
        // Face Detection
        this.mlModels.faceDetection = await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        this.mlModels.faceLandmark = await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        
        // Custom Filters
        this.mlModels.ageGender = await tf.loadLayersModel('/models/age_gender_model/model.json');
    }

    // 🔥 FEATURE 3: 3D AR Props with Three.js
    init3D() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('ar-overlay').appendChild(renderer.domElement);
        
        this.threeScene = { scene, camera, renderer };
        
        // Load 3D Props
        this.load3DProps();
        
        // Render Loop
        this.animate3D();
    }

    // 🔥 FEATURE 4: Voice Commands (Speech Recognition)
    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'id-ID';
            
            recognition.onresult = (event) => {
                const command = event.results[0][0].transcript.toLowerCase();
                this.handleVoiceCommand(command);
            };
            
            this.voiceRecognition = recognition;
        }
    }

    handleVoiceCommand(command) {
        if (command.includes('foto') || command.includes('capture')) {
            this.capturePhoto();
        } else if (command.includes('template')) {
            this.nextTemplate();
        }
    }

    // 🔥 FEATURE 5: Countdown with Animation
    async startCountdown() {
        this.state.isCountingDown = true;
        const numbers = [3, 2, 1];
        
        for (let i = 0; i < numbers.length; i++) {
            document.getElementById('countdown-text').textContent = numbers[i];
            document.getElementById('countdown-hud').classList.remove('hidden');
            
            // Play sound
            document.getElementById('countdown-sound').play();
            
            // Flash effect
            this.createFlashEffect();
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        document.getElementById('countdown-hud').classList.add('hidden');
        this.capturePhoto();
    }

    // 🔥 FEATURE 6: Advanced Capture with ML Processing
    async capturePhoto() {
        if (this.state.isCountingDown) return;
        
        // Play DSLR shutter sound
        document.getElementById('shutter-sound').play();
        
        // Flash + Vibration
        navigator.vibrate?.([200, 100, 200]);
        this.createFlashEffect();
        
        // Capture with ML processing
        const processedImage = await this.processWithML();
        
        // Save photo
        const photoData = await this.addFrameAndFilters(processedImage);
        
        // Update gallery
        this.state.photos.unshift(photoData);
        this.savePhotos();
        this.updateStats();
        
        // Show post-capture
        this.showPostCapture(photoData);
    }

    // 🔥 FEATURE 7: ML Processing Pipeline
    async processWithML() {
        const ctx = this.elements.canvas.getContext('2d');
        ctx.drawImage(this.elements.video, 0, 0);
        
        // Detect faces
        const detections = await faceapi.detectAllFaces(this.elements.canvas);
        
        // Draw face landmarks
        const resizedDetections = faceapi.resizeResults(detections, { width: this.elements.canvas.width, height: this.elements.canvas.height });
        faceapi.draw.drawDetections(this.elements.canvas, resizedDetections);
        
        return this.elements.canvas.toDataURL('image/png');
    }

    // 🔥 FEATURE 8: PWA + Offline Support
    registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('SW registered'))
                .catch(err => console.log('SW failed'));
        }
    }

    // 🔥 FEATURE 9: QR Code Generator + Social Sharing
    async generateQR(photoUrl) {
        const qrContainer = document.getElementById('qr-container');
        qrContainer.innerHTML = '';
        
        await QRCode.toCanvas(qrContainer, photoUrl, {
            width: 300,
            margin: 2,
            color: { dark: '#000', light: '#fff' }
        });
        
        document.getElementById('qr-modal').classList.remove('hidden');
    }

    // 🔥 FEATURE 10: Battery + Device APIs
    initBattery() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                const updateBattery = () => {
                    const level = Math.round(battery.level * 100);
                    document.querySelector('#battery-indicator span').textContent = `${level}%`;
                };
                battery.addEventListener('levelchange', updateBattery);
                updateBattery();
            });
        }
    }

    // 🔥 FEATURE 11: WebSocket Live Stats
    initWebSocket() {
        const ws = new WebSocket('wss://your-server.com');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            document.getElementById('live-count').textContent = data.liveUsers;
        };
    }

    // 🔥 FEATURE 12: Multi-Language i18n
    initI18n() {
        const translations = {
            id: {
                'app-title': 'Ultimate PhotoBooth',
                'shoot': 'AMBIK FOTO',
                'print': 'CETAK',
                'qr-share': 'QR SHARE',
                'gallery': 'GALERI'
            },
            en: {
                'app-title': 'Ultimate PhotoBooth',
                'shoot': 'SHOOT',
                'print': 'PRINT',
                'qr-share': 'QR SHARE',
                'gallery': 'GALLERY'
            }
        };

        document.getElementById('language-select').addEventListener('change', (e) => {
            this.state.language = e.target.value;
            this.updateTranslations(translations[this.state.language]);
        });
    }

    // 🔥 FEATURE 13: Touch Gestures + Keyboard Shortcuts
    setupEventListeners() {
        // Touch gestures
        let touchStart = 0;
        document.addEventListener('touchstart', e => touchStart = e.touches[0].clientX);
        document
        }
}