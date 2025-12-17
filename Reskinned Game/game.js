class Player {
    constructor(laneCount, playerSize, playerY) {
        this.laneCount = laneCount;
        this.playerSize = playerSize;
        this.playerY = playerY;
        this.lane = Math.floor(laneCount / 2);
        this.lives = 3;
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 0;
        this.visible = true;
    }

    move(direction) {
        if (direction === 'left' && this.lane > 0) {
            this.lane--;
        } else if (direction === 'right' && this.lane < this.laneCount - 1) {
            this.lane++;
        }
    }

    draw(ctx, assets, laneWidth) {
        if (this.visible) {
            const playerX = this.lane * laneWidth + (laneWidth - this.playerSize) / 2;
            ctx.drawImage(assets.player, playerX, this.playerY, this.playerSize, this.playerSize);
        }
    }
}

class FallingObject {
    constructor(lane, objectSize, type, speed) {
        this.lane = lane;
        this.y = -objectSize;
        this.objectSize = objectSize;
        this.type = type;
        this.speed = speed;
    }

    update() {
        this.y += this.speed;
    }

    draw(ctx, assets, laneWidth) {
        const objX = this.lane * laneWidth + (laneWidth - this.objectSize) / 2;
        ctx.drawImage(assets[this.type.image], objX, this.y, this.objectSize, this.objectSize);
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.size = Math.random() * 5 + 2;
        this.color = color;
        this.lifespan = 60;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifespan--;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.lifespan / 60; // Fade out effect
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}


class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameStats = document.getElementById('game-stats');
        this.gameOverScreen = document.getElementById('game-over');
        this.gameWinScreen = document.getElementById('game-win');
        this.restartButton = document.getElementById('restart-button');
        this.playAgainButton = document.getElementById('play-again-button');
        this.soundChoiceScreen = document.getElementById('sound-choice-screen');
        this.soundOnButton = document.getElementById('sound-on-button');
        this.soundOffButton = document.getElementById('sound-off-button');

        this.isMuted = true;
        this.laneCount = 5;
        this.laneWidth = this.canvas.width / this.laneCount;
        this.playerSize = 80;
        this.objectSize = 60;
        this.playerY = this.canvas.height - this.playerSize - 10;
        
        this.assets = {};
        this.fallingObjects = [];
        this.particles = [];
        this.player = null;
        this.coins = 0;
        this.gameRunning = true;
        this.backgroundY = 0;
        this.shakeDuration = 0;
        this.shakeMagnitude = 0;
        this.flashDuration = 0;
        this.gameLoopId = null;

        this.OBJECT_TYPES = {
            COIN: { value: 1, image: 'coin', color: 'yellow' },
            GEM: { value: 10, image: 'gem', color: 'purple' },
            OBSTACLE: { value: 0, image: 'obstacle', color: 'red' }
        };
    }

    async loadAssets() {
        const assetPromises = [
            this.loadImage('player', 'player.png'),
            this.loadImage('coin', 'coin.png'),
            this.loadImage('gem', 'gem.png'),
            this.loadImage('obstacle', 'obstacle.png'),
            this.loadImage('background', 'starynight.png'),
            this.loadAudio('obstacleSound', 'obstacle.mp3'),
            this.loadAudio('coinSound', 'coin.mp3'),
            this.loadAudio('gameOverSound', 'gameover.mp3'),
            this.loadAudio('gameWinSound', 'gamewin.mp3')
        ];

        await Promise.all(assetPromises);
    }

    loadImage(name, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            this.assets[name] = img;
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = src;
        });
    }

    loadAudio(name, src) {
        return new Promise((resolve) => {
            const sound = new Audio(src);
            this.assets[name] = sound;
            resolve();
        });
    }

    init() {
        this.coins = 0;
        this.fallingObjects = [];
        this.particles = [];
        this.player = new Player(this.laneCount, this.playerSize, this.playerY);
        
        this.backgroundY = 0;
        this.shakeDuration = 0;
        this.flashDuration = 0;
        this.gameOverScreen.style.display = 'none';
        this.gameWinScreen.style.display = 'none';
        this.updateStats();
        this.gameRunning = true;
        this.gameLoop();
    }

    movePlayer(direction) {
        if (!this.gameRunning) return;
        this.player.move(direction);
    }

    addFallingObject() {
        if (!this.gameRunning) return;

        const lane = Math.floor(Math.random() * this.laneCount);

        const rand = Math.random();
        let type;

        if (rand < 0.15) {
            type = this.OBJECT_TYPES.GEM;
        } else if (rand < 0.60) {
            type = this.OBJECT_TYPES.COIN;
        } else {
            type = this.OBJECT_TYPES.OBSTACLE;
        }

        this.fallingObjects.push(new FallingObject(lane, this.objectSize, type, 2 + Math.random() * 2));
    }

    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    update() {
        if (!this.gameRunning) return;

        this.backgroundY += 2;
        if (this.backgroundY >= this.canvas.height) {
            this.backgroundY = 0;
        }

        if (this.shakeDuration > 0) {
            this.shakeDuration--;
        }
        if (this.flashDuration > 0) {
            this.flashDuration--;
        }

        if (this.player.isInvulnerable) {
            this.player.invulnerabilityDuration--;
            this.player.visible = this.player.invulnerabilityDuration % 10 < 5;
            if (this.player.invulnerabilityDuration <= 0) {
                this.player.isInvulnerable = false;
                this.player.visible = true;
            }
        }

        for (let i = this.fallingObjects.length - 1; i >= 0; i--) {
            const obj = this.fallingObjects[i];
            obj.update();

            if (obj.y > this.canvas.height) {
                this.fallingObjects.splice(i, 1);
                continue;
            }

            const playerX = this.player.lane * this.laneWidth + this.laneWidth / 2;
            const objX = obj.lane * this.laneWidth + this.laneWidth / 2;

            const distance = Math.sqrt(
                Math.pow(playerX - objX, 2) +
                Math.pow(this.player.playerY - obj.y, 2)
            );

            if (distance < (this.player.playerSize + obj.objectSize) / 2) {
                if (obj.type === this.OBJECT_TYPES.OBSTACLE) {
                    if (!this.player.isInvulnerable) {
                        this.player.lives--;
                        this.updateStats();
                        this.createParticles(objX, obj.y, obj.type.color, 30);
                        this.shakeDuration = 20;
                        this.shakeMagnitude = 10;
                        this.flashDuration = 20;
                        if (!this.isMuted) this.assets.obstacleSound.play();
                        this.player.isInvulnerable = true;
                        this.player.invulnerabilityDuration = 120;
                        if (this.player.lives <= 0) {
                            this.gameOver();
                        }
                    }
                } else {
                    this.coins += obj.type.value;
                    this.updateStats();
                    this.createParticles(objX, obj.y, obj.type.color, 20);
                    if (!this.isMuted) this.assets.coinSound.play();
                    if (this.coins >= 100) {
                        this.gameWin();
                    }
                }
                this.fallingObjects.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.lifespan <= 0) {
                this.particles.splice(i, 1);
            }
        }

        if (Math.random() < 0.02) {
            this.addFallingObject();
        }
    }

    drawHeart(x, y, size) {
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        var d = size;
        var k = x;
        var l = y;
        this.ctx.moveTo(k, l + d / 4);
        this.ctx.quadraticCurveTo(k, l, k + d / 4, l);
        this.ctx.quadraticCurveTo(k + d / 2, l, k + d / 2, l + d / 4);
        this.ctx.quadraticCurveTo(k + d / 2, l, k + d * 3 / 4, l);
        this.ctx.quadraticCurveTo(k + d, l, k + d, l + d / 4);
        this.ctx.quadraticCurveTo(k + d, l + d / 2, k + d * 3 / 4, l + d * 3 / 4);
        this.ctx.lineTo(k + d / 2, l + d);
        this.ctx.lineTo(k + d / 4, l + d * 3 / 4);
        this.ctx.quadraticCurveTo(k, l + d / 2, k, l + d / 4);
        this.ctx.fill();
    }

    draw() {
        this.ctx.save();
        if (this.shakeDuration > 0) {
            const dx = (Math.random() - 0.5) * this.shakeMagnitude;
            const dy = (Math.random() - 0.5) * this.shakeMagnitude;
            this.ctx.translate(dx, dy);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.drawImage(this.assets.background, 0, this.backgroundY, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.assets.background, 0, this.backgroundY - this.canvas.height, this.canvas.width, this.canvas.height);

        if (this.flashDuration > 0) {
            this.ctx.fillStyle = 'red';
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1.0;
        }

        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 15]);
        for (let i = 1; i < this.laneCount; i++) {
            const x = i * this.laneWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);

        this.player.draw(this.ctx, this.assets, this.laneWidth);

        for (const obj of this.fallingObjects) {
            obj.draw(this.ctx, this.assets, this.laneWidth);
        }

        for (const p of this.particles) {
            p.draw(this.ctx);
        }
        this.ctx.globalAlpha = 1.0;

        for (let i = 0; i < this.player.lives; i++) {
            this.drawHeart(this.canvas.width - 40 - (i * 35), 20, 30);
        }
        this.ctx.restore();
    }

    gameLoop() {
        if (!this.gameRunning) return;

        try {
            this.update();
            this.draw();
            this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            console.error("Error in game loop:", error);
            this.gameRunning = false;
            this.ctx.fillStyle = "red";
            this.ctx.font = "20px Arial";
            this.ctx.fillText("An error occurred. Please restart.", 50, 300);
        }
    }

    updateStats() {
        this.gameStats.innerText = `Coins: ${this.coins} | Lives: ${this.player.lives}`;
    }



    gameOver() {
        this.gameRunning = false;
        cancelAnimationFrame(this.gameLoopId);
        if (!this.isMuted) this.assets.gameOverSound.play();
        this.gameOverScreen.style.display = 'block';
    }

    gameWin() {
        this.gameRunning = false;
        cancelAnimationFrame(this.gameLoopId);
        if (!this.isMuted) this.assets.gameWinSound.play();
        this.gameWinScreen.style.display = 'block';
    }

    _startGame() {
        this.loadAssets().then(() => {
            this.init();
        }).catch(error => {
            console.error("Failed to load assets:", error);
            this.ctx.fillStyle = "red";
            this.ctx.font = "20px Arial";
            this.ctx.fillText("Failed to load game assets. Please refresh.", 50, 300);
        });
    }

    start() {
        this.soundChoiceScreen.style.display = 'flex';

        this.soundOnButton.addEventListener('click', () => {
            this.isMuted = false;
            this.soundChoiceScreen.style.display = 'none';
            this._startGame();
        });

        this.soundOffButton.addEventListener('click', () => {
            this.isMuted = true;
            this.soundChoiceScreen.style.display = 'none';
            this._startGame();
        });
    }
}

const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        game.movePlayer('left');
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        game.movePlayer('right');
    }
});

game.restartButton.addEventListener('click', () => game.init());
game.playAgainButton.addEventListener('click', () => game.init());

const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');

leftButton.addEventListener('click', () => game.movePlayer('left'));
rightButton.addEventListener('click', () => game.movePlayer('right'));

game.start();