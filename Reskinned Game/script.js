
// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameStats = document.getElementById('game-stats');
const gameOverScreen = document.getElementById('game-over');
const gameWinScreen = document.getElementById('game-win');
const restartButton = document.getElementById('restart-button');
const playAgainButton = document.getElementById('play-again-button');

// Load assets
const playerImg = new Image();
playerImg.src = 'assets/player.webp';
const mineImg = new Image();
mineImg.src = 'assets/mine.webp';
const detonatorImg = new Image();
detonatorImg.src = 'assets/detonator.webp';
const magnetImg = new Image();
magnetImg.src = 'assets/magnet.webp';
const gemImg = new Image();
gemImg.src = 'assets/gem.webp';
const backgroundImg = new Image();
backgroundImg.src = 'assets/background.webp';
const coinImg = new Image();
coinImg.src = 'assets/coin.webp';
const restartButtonImg = new Image();
restartButtonImg.src = 'assets/restart_button.webp';
const gameOverLabelImg = new Image();
gameOverLabelImg.src = 'assets/game_over_label.webp';
const youWinLabelImg = new Image();
youWinLabelImg.src = 'assets/you_win_label.webp';
const soundOnImg = new Image();
soundOnImg.src = 'assets/sound_on.webp';
const soundOffImg = new Image();
soundOffImg.src = 'assets/sound_off.webp';

// Sound effects
const mineSound = new Audio('assets/mine.mp3');
const magnetSound = new Audio('assets/magnet.mp3');
const detonatorSound = new Audio('assets/detonator.mp3');
const gemSound = new Audio('assets/gem.mp3');
const coinSound = new Audio('assets/coin.mp3');
const winSound = new Audio('assets/win.mp3');
const loseSound = new Audio('assets/lose.mp3');

function playSound(sound) {
    if (!isMuted) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Sound play failed", e));
    }
}

const startMenu = document.getElementById('start-menu');
const startSoundOnBtn = document.getElementById('start-sound-on');
const startSoundOffBtn = document.getElementById('start-sound-off');

let assetsToLoad = 12;
function assetLoaded() {
    assetsToLoad--;
    if (assetsToLoad === 0) {
        showStartMenu();
        if (!loopStarted) {
            gameLoop();
            loopStarted = true;
        }
    }
}

playerImg.onload = assetLoaded;
mineImg.onload = assetLoaded;
detonatorImg.onload = assetLoaded;
magnetImg.onload = assetLoaded;
gemImg.onload = assetLoaded;
backgroundImg.onload = assetLoaded;
coinImg.onload = assetLoaded;
restartButtonImg.onload = assetLoaded;
gameOverLabelImg.onload = assetLoaded;
youWinLabelImg.onload = assetLoaded;
soundOnImg.onload = assetLoaded;
soundOffImg.onload = assetLoaded;



let backgroundY = 0;
const backgroundSpeed = 1;


// Game settings
const laneCount = 5;
const laneWidth = canvas.width / laneCount;
const playerSize = 60;
const objectSize = 60;
const playerY = canvas.height - playerSize - 10;
let playerLane = Math.floor(laneCount / 2);
let coins = 0;
let lives = 3;
let gameRunning = false; // Start as false
let magnetActive = false;
let magnetTimer = 0;
let invulnerableTimer = 0;
let screenFlash = { alpha: 0, duration: 0 };
let playerVisible = true;
let isMuted = false;
let loopStarted = false;

// Arrays to store game objects
let fallingObjects = [];
let particles = [];


// Object types
const OBJECT_TYPES = {
    COIN: { value: 1, color: 'yellow', shape: 'circle', image: coinImg },
    GEM: { value: 10, color: 'purple', shape: 'diamond', image: gemImg },
    MINE: { value: 0, color: 'red', shape: 'x', image: mineImg },
    DETONATOR: { value: 0, color: 'orange', shape: 'square', image: detonatorImg },
    MAGNET: { value: 0, color: 'gray', shape: 'triangle', image: magnetImg }
};

function showStartMenu() {
    startMenu.style.display = 'block';
    gameOverScreen.style.display = 'none';
    gameWinScreen.style.display = 'none';
    gameRunning = false;
}

function startGame(withSound) {
    startMenu.style.display = 'none';
    isMuted = !withSound;
    ambientMusic.muted = isMuted;
    
    // Update the toggle button icon to match choice
    soundToggleButton.src = isMuted ? 'assets/sound_off.webp' : 'assets/sound_on.webp';

    if (withSound) {
        const playPromise = ambientMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                console.log("Music started");
            }).catch(error => {
                console.error("Music playback failed:", error);
            });
        }
    } else {
        ambientMusic.pause();
    }
    
    init();
    
    if (!loopStarted) {
        gameLoop();
        loopStarted = true;
    }
}

// Initialize the game
function init() {
    coins = 0;
    lives = 3;
    fallingObjects = [];
    particles = [];
    playerLane = Math.floor(laneCount / 2);
    gameRunning = true;
    magnetActive = false;
    magnetTimer = 0;
    invulnerableTimer = 0;
    screenFlash = { alpha: 0, duration: 0 };
    playerVisible = true;
    gameOverScreen.style.display = 'none';
    gameWinScreen.style.display = 'none';
    backgroundY = 0; // Reset background position
    updateStats();

    if (!isMuted) {
        const playPromise = ambientMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Music playback failed:", error);
            });
        }
    }
}

// Create particle effects
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 1,
            color: color,
            lifespan: Math.random() * 30 + 30
        });
    }
}

// Move player left or right
function movePlayer(direction) {
    if (!gameRunning) return;
    
    if (direction === 'left' && playerLane > 0) {
        playerLane--;
    } else if (direction === 'right' && playerLane < laneCount - 1) {
        playerLane++;
    }
}

// Add a new falling object
function addFallingObject() {
    if (!gameRunning) return;
    
    const lane = Math.floor(Math.random() * laneCount);
    
    // Use weighted probabilities to make gems rare
    const rand = Math.random();
    let type;
    
    if (rand < 0.05) {
        type = OBJECT_TYPES.GEM;
    } else if (rand < 0.10) {
        type = OBJECT_TYPES.DETONATOR;
    } else if (rand < 0.15) {
        type = OBJECT_TYPES.MAGNET;
    }
    else if (rand < 0.50) {
        // 45% chance for coins
        type = OBJECT_TYPES.COIN;
    } else {
        // 40% chance for obstacles
        type = OBJECT_TYPES.MINE;
    }
    
    fallingObjects.push({
        lane: lane,
        y: -objectSize,
        type: type,
        speed: 2 + Math.random() * 2 + coins / 100 // Progressive speed
    });
}

// Update all game objects
function update() {
    if (!gameRunning) return;

    // Magnet timer
    if (magnetActive) {
        magnetTimer--;
        if (magnetTimer <= 0) {
            magnetActive = false;
        }
    }

    // Invulnerability timer
    if (invulnerableTimer > 0) {
        invulnerableTimer--;
        playerVisible = Math.floor(invulnerableTimer / 10) % 2 === 0;
    } else {
        playerVisible = true;
    }

    // Screen flash
    if (screenFlash.duration > 0) {
        screenFlash.duration--;
        screenFlash.alpha = (screenFlash.duration / 30) * 0.7;
    }
    
    // Update falling objects
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        obj.y += obj.speed;

        // Magnet effect
        if (magnetActive && obj.type === OBJECT_TYPES.COIN) {
            const playerX = playerLane * laneWidth + laneWidth / 2;
            const objX = obj.lane * laneWidth + laneWidth / 2;
            if (obj.lane !== playerLane) {
                if (obj.lane > playerLane) {
                    obj.lane--;
                } else {
                    obj.lane++;
                }
            }
        }
        
        // Check if object is out of bounds
        if (obj.y > canvas.height) {
            fallingObjects.splice(i, 1);
            continue;
        }
        
        // Check collision with player
        const playerX = playerLane * laneWidth + laneWidth / 2;
        const objX = obj.lane * laneWidth + laneWidth / 2;
        
        const distance = Math.sqrt(
            Math.pow(playerX - objX, 2) + 
            Math.pow(playerY - obj.y, 2)
        );
        
        if (distance < (playerSize + objectSize) / 2) {
            // Collision detected
            createParticles(objX, obj.y, obj.type.color);
            
            if (obj.type === OBJECT_TYPES.MINE) {
                if (invulnerableTimer <= 0) {
                    playSound(mineSound);
                    lives--;
                    invulnerableTimer = 120; // 2 seconds of invulnerability
                    screenFlash.duration = 30;
                    screenFlash.alpha = 0.7;
                    updateStats();
                    if (lives <= 0) {
                        gameOver();
                    }
                }
            } else if (obj.type === OBJECT_TYPES.MAGNET) {
                playSound(magnetSound);
                magnetActive = true;
                magnetTimer = 5 * 60; // 5 seconds at 60 FPS
            } else if (obj.type === OBJECT_TYPES.DETONATOR) {
                playSound(detonatorSound);
                for (let j = 0; j < fallingObjects.length; j++) {
                    if (fallingObjects[j].type === OBJECT_TYPES.MINE) {
                        fallingObjects[j].type = OBJECT_TYPES.COIN;
                    }
                }
            } else {
                if (obj.type === OBJECT_TYPES.GEM) {
                    playSound(gemSound);
                } else {
                    playSound(coinSound);
                }
                coins += obj.type.value;
                updateStats();
                if (coins >= 100) {
                    gameWin();
                }
            }
            fallingObjects.splice(i, 1);
        }
    }
    
    // Scroll background
    backgroundY = (backgroundY + backgroundSpeed) % canvas.height;

    // Randomly add new objects
    if (Math.random() < 0.02) {  // 2% chance each frame
        addFallingObject();
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.lifespan--;
        if (p.lifespan <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Draw everything on canvas
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (moving texture)
    ctx.drawImage(backgroundImg, 0, backgroundY, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, 0, backgroundY - canvas.height, canvas.width, canvas.height);


    // Draw lanes (faint lines) - transparent
    ctx.strokeStyle = 'rgba(221, 221, 221, 0.5)'; // Semi-transparent
    ctx.lineWidth = 1;
    for (let i = 1; i < laneCount; i++) {
        const x = i * laneWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Draw player
    if (playerVisible) {
        const playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
        ctx.drawImage(playerImg, playerX, playerY, playerSize, playerSize);
    }

    // Draw magnet icon if active
    if (magnetActive) {
        ctx.drawImage(magnetImg, canvas.width / 2 - 15, 10, 30, 30);
    }
    
    // Draw falling objects
    for (const obj of fallingObjects) {
        const objX = obj.lane * laneWidth + (laneWidth - objectSize) / 2;
        const objY = obj.y - objectSize / 2;

        if (obj.type.image) {
            ctx.drawImage(obj.type.image, objX, objY, objectSize, objectSize);
        } else {
            ctx.fillStyle = obj.type.color;
            if (obj.type.shape === 'diamond') {
                // Draw gem (purple diamond)
                const x = obj.lane * laneWidth + laneWidth / 2;
                ctx.beginPath();
                ctx.moveTo(x, obj.y - objectSize / 2);
                ctx.lineTo(x + objectSize / 2, obj.y);
                ctx.lineTo(x, obj.y + objectSize / 2);
                ctx.lineTo(x - objectSize / 2, obj.y);
                ctx.closePath();
                ctx.fill();
            } else if (obj.type.shape === 'x') {
                // Draw mine (red X)
                ctx.lineWidth = 3;
                ctx.strokeStyle = obj.type.color;
                const size = objectSize / 2;
                const x = obj.lane * laneWidth + laneWidth / 2;
                ctx.beginPath();
                ctx.moveTo(x - size, obj.y - size);
                ctx.lineTo(x + size, obj.y + size);
                ctx.moveTo(x + size, obj.y - size);
                ctx.lineTo(x - size, obj.y + size);
                ctx.stroke();
            }
        }
    }

    // Draw particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw hearts
    ctx.font = '30px Arial';
    ctx.fillStyle = 'red';
    let hearts = '';
    for (let i = 0; i < lives; i++) {
        hearts += '❤️';
    }
    for (let i = 0; i < 3 - lives; i++) {
        hearts += '🖤';
    }
    ctx.fillText(hearts, canvas.width - ctx.measureText(hearts).width - 10, 40);


    // Draw screen flash
    if (screenFlash.duration > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${screenFlash.alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Update statistics display
function updateStats() {
    gameStats.innerText = `Coins: ${coins}`;
}

// Game over
function gameOver() {
    ambientMusic.pause();
    ambientMusic.currentTime = 0;
    playSound(loseSound);
    gameRunning = false;
    gameOverScreen.style.display = 'block';
}

// Game win
function gameWin() {
    ambientMusic.pause();
    ambientMusic.currentTime = 0;
    playSound(winSound);
    gameRunning = false;
    gameWinScreen.style.display = 'block';
}

// Event listeners
document.addEventListener('keydown', (e) => {
    // Arrow keys
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        movePlayer('left');
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        movePlayer('right');
    }
});

const ambientMusic = document.getElementById('ambient-music');
ambientMusic.volume = 0.3;
let musicStarted = false;

canvas.addEventListener('click', () => {
    console.log("Canvas clicked");
    if (!musicStarted) {
        console.log("Attempting to play music");
        const playPromise = ambientMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                console.log("Music playback started successfully");
            }).catch(error => {
                console.error("Music playback failed:", error);
            });
        }
        musicStarted = true;
    }
});

restartButton.addEventListener('click', init);
playAgainButton.addEventListener('click', init);

startSoundOnBtn.addEventListener('click', () => startGame(true));
startSoundOffBtn.addEventListener('click', () => startGame(false));

const soundToggleButton = document.getElementById('sound-toggle-button');
soundToggleButton.addEventListener('click', () => {
    isMuted = !isMuted;
    ambientMusic.muted = isMuted;
    soundToggleButton.src = isMuted ? 'assets/sound_off.webp' : 'assets/sound_on.webp';
    if (!isMuted) {
        const playPromise = ambientMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Music playback failed:", error);
            });
        }
    }
});

// Mobile Controls
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

function handleLeftInput(e) {
    if (e.cancelable) e.preventDefault(); // Prevent default touch behavior (scrolling/zooming)
    movePlayer('left');
}

function handleRightInput(e) {
    if (e.cancelable) e.preventDefault();
    movePlayer('right');
}

leftBtn.addEventListener('touchstart', handleLeftInput, { passive: false });
leftBtn.addEventListener('mousedown', handleLeftInput);

rightBtn.addEventListener('touchstart', handleRightInput, { passive: false });
rightBtn.addEventListener('mousedown', handleRightInput);
