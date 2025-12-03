// ===========================
// Physics Setup (Matter.js)
// ===========================

const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Create engine
const engine = Engine.create();
const world = engine.world;

// Canvas setup
const canvas = document.getElementById('physicsCanvas');
const ctx = canvas.getContext('2d');

// Render setup
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: '#0a0e27'
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// ===========================
// Physics Parameters
// ===========================

let physicsParams = {
    gravity: { x: 0, y: 0.15 },
    targetGravity: { x: 0, y: 0.15 },
    massMultiplier: 1.0,
    targetMassMultiplier: 1.0,
    restitution: 0.6,
    targetRestitution: 0.6,
    friction: 0.05
};

const MASS_MODES = {
    NORMAL: { multiplier: 1.0, restitution: 0.6, label: 'Normal' },
    HEAVY: { multiplier: 5.0, restitution: 0.3, label: 'Heavy' },
    FLOATY: { multiplier: 0.2, restitution: 0.9, label: 'Floaty' }
};

let currentMassMode = 'NORMAL';

// ===========================
// Create Boundaries
// ===========================

const wallThickness = 50;
const walls = [
    // Floor
    Bodies.rectangle(
        window.innerWidth / 2,
        window.innerHeight + wallThickness / 2,
        window.innerWidth,
        wallThickness,
        { isStatic: true, render: { fillStyle: '#1a1f3a' } }
    ),
    // Left wall
    Bodies.rectangle(
        -wallThickness / 2,
        window.innerHeight / 2,
        wallThickness,
        window.innerHeight,
        { isStatic: true, render: { fillStyle: '#1a1f3a' } }
    ),
    // Right wall
    Bodies.rectangle(
        window.innerWidth + wallThickness / 2,
        window.innerHeight / 2,
        wallThickness,
        window.innerHeight,
        { isStatic: true, render: { fillStyle: '#1a1f3a' } }
    ),
    // Ceiling
    Bodies.rectangle(
        window.innerWidth / 2,
        -wallThickness / 2,
        window.innerWidth,
        wallThickness,
        { isStatic: true, render: { fillStyle: '#1a1f3a' } }
    )
];

World.add(world, walls);

// ===========================
// Create Letter Blocks
// ===========================

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const letterBodies = [];
const letterSize = 50;

function createLetterBlock(letter, x, y) {
    const body = Bodies.rectangle(x, y, letterSize, letterSize, {
        restitution: physicsParams.restitution,
        friction: physicsParams.friction,
        density: 0.001,
        render: {
            fillStyle: '#ffffff',
            strokeStyle: '#2c3e50',
            lineWidth: 2
        }
    });

    body.label = letter;
    body.baseMass = body.mass;

    return body;
}

// Create initial letters (start at top for space-like floating effect)
for (let i = 0; i < 15; i++) {
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const x = Math.random() * (window.innerWidth - 200) + 100;
    const y = -100 - (i * 60); // Start above the viewport, staggered vertically
    const letterBody = createLetterBlock(letter, x, y);
    letterBodies.push(letterBody);
}

World.add(world, letterBodies);

// ===========================
// Custom Rendering (for letters with shadows)
// ===========================

Events.on(render, 'afterRender', () => {
    const context = render.context;

    letterBodies.forEach(body => {
        const { x, y } = body.position;
        const angle = body.angle;

        context.save();
        context.translate(x, y);
        context.rotate(angle);

        // Draw shadow
        context.shadowColor = 'rgba(0, 0, 0, 0.3)';
        context.shadowBlur = 10;
        context.shadowOffsetX = 3;
        context.shadowOffsetY = 3;

        // Draw letter background with glow
        context.fillStyle = '#e8f4f8';
        context.strokeStyle = '#4fc3f7';
        context.lineWidth = 3;
        context.fillRect(-letterSize/2, -letterSize/2, letterSize, letterSize);
        context.strokeRect(-letterSize/2, -letterSize/2, letterSize, letterSize);

        // Reset shadow for text
        context.shadowColor = 'transparent';

        // Draw letter text
        context.fillStyle = '#1565c0';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(body.label, 0, 0);

        context.restore();
    });
});

// ===========================
// Physics Update Loop
// ===========================

function smoothLerp(current, target, factor) {
    return current + (target - current) * factor;
}

Events.on(engine, 'beforeUpdate', () => {
    // Smooth gravity transition
    physicsParams.gravity.x = smoothLerp(physicsParams.gravity.x, physicsParams.targetGravity.x, 0.1);
    physicsParams.gravity.y = smoothLerp(physicsParams.gravity.y, physicsParams.targetGravity.y, 0.1);

    engine.world.gravity.x = physicsParams.gravity.x;
    engine.world.gravity.y = physicsParams.gravity.y;

    // Smooth mass transition
    physicsParams.massMultiplier = smoothLerp(
        physicsParams.massMultiplier,
        physicsParams.targetMassMultiplier,
        0.05
    );

    physicsParams.restitution = smoothLerp(
        physicsParams.restitution,
        physicsParams.targetRestitution,
        0.05
    );

    // Update letter bodies
    letterBodies.forEach(body => {
        Body.setMass(body, body.baseMass * physicsParams.massMultiplier);
        body.restitution = physicsParams.restitution;
    });
});

// ===========================
// MediaPipe Setup
// ===========================

const videoElement = document.getElementById('webcam');
const trackingCanvas = document.getElementById('trackingCanvas');
const trackingCtx = trackingCanvas.getContext('2d');

let faceMesh, hands;
let faceResults = null;
let handResults = null;

// Hand tracking state
let previousHandPosition = null;
let handVelocity = { x: 0, y: 0 };

// Initialize MediaPipe Hands
function initHands() {
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });

    hands.onResults(onHandResults);
}

// Initialize MediaPipe Face Mesh
function initFaceMesh() {
    faceMesh = new FaceMesh({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
    });

    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });

    faceMesh.onResults(onFaceResults);
}

// ===========================
// Gesture Detection
// ===========================

function onFaceResults(results) {
    faceResults = results;

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Calculate head roll using nose tip and forehead
        // Landmark 1: nose tip, Landmark 10: forehead
        const noseTip = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        // Calculate roll angle from eye positions
        const eyeDeltaX = rightEye.x - leftEye.x;
        const eyeDeltaY = rightEye.y - leftEye.y;
        const rollAngle = Math.atan2(eyeDeltaY, eyeDeltaX);

        // Map roll angle to gravity vector (reduced for space-like feel)
        const maxTilt = 0.15;
        physicsParams.targetGravity.x = Math.sin(rollAngle) * maxTilt;
        physicsParams.targetGravity.y = Math.cos(rollAngle) * maxTilt;

        // Update gravity indicator
        updateGravityIndicator(rollAngle);
    }

    drawTracking();
}

function onHandResults(results) {
    handResults = results;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Palm center (landmark 0)
        const palmCenter = landmarks[0];
        const currentPosition = {
            x: palmCenter.x * videoElement.videoWidth,
            y: palmCenter.y * videoElement.videoHeight
        };

        // Calculate hand velocity for swipe detection
        if (previousHandPosition) {
            handVelocity.x = currentPosition.x - previousHandPosition.x;
            handVelocity.y = currentPosition.y - previousHandPosition.y;

            const speed = Math.sqrt(handVelocity.x ** 2 + handVelocity.y ** 2);

            // Detect swipe (fast movement)
            if (speed > 30) {
                applySwipeImpulse(handVelocity.x, handVelocity.y, speed);
            }
        }

        previousHandPosition = currentPosition;

        // Detect hand gesture (fist vs open palm)
        const handGesture = detectHandGesture(landmarks);
        updateMassMode(handGesture);
    } else {
        previousHandPosition = null;
    }

    drawTracking();
}

function detectHandGesture(landmarks) {
    // Calculate distances from palm to fingertips
    const palmCenter = landmarks[0];
    const fingerTips = [
        landmarks[4],  // thumb
        landmarks[8],  // index
        landmarks[12], // middle
        landmarks[16], // ring
        landmarks[20]  // pinky
    ];

    let totalDistance = 0;
    fingerTips.forEach(tip => {
        const dx = tip.x - palmCenter.x;
        const dy = tip.y - palmCenter.y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
    });

    const avgDistance = totalDistance / fingerTips.length;

    // Threshold for fist vs open hand
    if (avgDistance < 0.15) {
        return 'FIST';
    } else if (avgDistance > 0.25) {
        return 'OPEN';
    }

    return 'NEUTRAL';
}

function updateMassMode(gesture) {
    let newMode = currentMassMode;

    if (gesture === 'FIST') {
        newMode = 'HEAVY';
    } else if (gesture === 'OPEN') {
        newMode = 'FLOATY';
    }

    if (newMode !== currentMassMode) {
        currentMassMode = newMode;
        const mode = MASS_MODES[newMode];

        physicsParams.targetMassMultiplier = mode.multiplier;
        physicsParams.targetRestitution = mode.restitution;

        // Update UI
        const massValueEl = document.getElementById('massValue');
        massValueEl.textContent = mode.label;
        massValueEl.className = 'value ' + newMode.toLowerCase();

        document.getElementById('massIndicator').classList.add('active');
        setTimeout(() => {
            document.getElementById('massIndicator').classList.remove('active');
        }, 300);
    }
}

function applySwipeImpulse(vx, vy, speed) {
    // Show swipe indicator
    const swipeVisual = document.getElementById('swipeVisual');
    swipeVisual.classList.add('active');
    setTimeout(() => swipeVisual.classList.remove('active'), 300);

    // Apply impulse to nearby letters
    const impulseStrength = Math.min(speed / 5, 50);

    letterBodies.forEach(body => {
        const dx = body.position.x - window.innerWidth / 2;
        const dy = body.position.y - window.innerHeight / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Apply impulse with falloff
        if (distance < 500) {
            const falloff = 1 - (distance / 500);
            Body.applyForce(body, body.position, {
                x: (vx / 1000) * impulseStrength * falloff,
                y: (vy / 1000) * impulseStrength * falloff
            });
        }
    });
}

// ===========================
// UI Updates
// ===========================

function updateGravityIndicator(rollAngle) {
    const arrow = document.getElementById('gravityArrow');
    const degrees = (rollAngle * 180 / Math.PI);
    arrow.style.transform = `rotate(${degrees}deg)`;

    if (Math.abs(degrees) > 5) {
        document.getElementById('gravityIndicator').classList.add('active');
    } else {
        document.getElementById('gravityIndicator').classList.remove('active');
    }
}

function drawTracking() {
    trackingCtx.save();
    trackingCtx.clearRect(0, 0, trackingCanvas.width, trackingCanvas.height);

    // Draw hand landmarks
    if (handResults && handResults.multiHandLandmarks) {
        for (const landmarks of handResults.multiHandLandmarks) {
            drawConnectors(trackingCtx, landmarks, HAND_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 2
            });
            drawLandmarks(trackingCtx, landmarks, {
                color: '#FF0000',
                lineWidth: 1,
                radius: 3
            });
        }
    }

    trackingCtx.restore();
}

// ===========================
// Camera Setup
// ===========================

async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }
        });

        videoElement.srcObject = stream;

        await new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                resolve();
            };
        });

        trackingCanvas.width = videoElement.videoWidth;
        trackingCanvas.height = videoElement.videoHeight;

        return true;
    } catch (error) {
        console.error('Camera error:', error);
        alert('Could not access camera. Please grant camera permissions.');
        return false;
    }
}

// ===========================
// Processing Loop
// ===========================

async function processFrame() {
    if (videoElement.readyState >= 2) {
        await hands.send({ image: videoElement });
        await faceMesh.send({ image: videoElement });
    }

    requestAnimationFrame(processFrame);
}

// ===========================
// Initialization
// ===========================

async function init() {
    const loadingOverlay = document.getElementById('loadingOverlay');

    try {
        // Initialize MediaPipe
        initHands();
        initFaceMesh();

        // Initialize camera
        const cameraReady = await initCamera();

        if (cameraReady) {
            // Start processing
            processFrame();

            // Hide loading overlay
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 1000);
        }
    } catch (error) {
        console.error('Initialization error:', error);
        loadingOverlay.querySelector('h2').textContent = 'Error';
        loadingOverlay.querySelector('p').textContent = error.message;
    }
}

// ===========================
// Window Resize Handling
// ===========================

window.addEventListener('resize', () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
    render.options.width = window.innerWidth;
    render.options.height = window.innerHeight;

    // Recreate walls (simplified - in production would update existing)
    World.remove(world, walls);
    walls.length = 0;

    const newWalls = [
        Bodies.rectangle(
            window.innerWidth / 2,
            window.innerHeight + wallThickness / 2,
            window.innerWidth,
            wallThickness,
            { isStatic: true, render: { fillStyle: '#1a1f3a' } }
        ),
        Bodies.rectangle(
            -wallThickness / 2,
            window.innerHeight / 2,
            wallThickness,
            window.innerHeight,
            { isStatic: true, render: { fillStyle: '#1a1f3a' } }
        ),
        Bodies.rectangle(
            window.innerWidth + wallThickness / 2,
            window.innerHeight / 2,
            wallThickness,
            window.innerHeight,
            { isStatic: true, render: { fillStyle: '#1a1f3a' } }
        ),
        Bodies.rectangle(
            window.innerWidth / 2,
            -wallThickness / 2,
            window.innerWidth,
            wallThickness,
            { isStatic: true, render: { fillStyle: '#1a1f3a' } }
        )
    ];

    walls.push(...newWalls);
    World.add(world, newWalls);
});

// Start the application
init();
