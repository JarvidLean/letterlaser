class Game {
    constructor(canvas) {
        console.log('Game constructor called');
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        console.log('Canvas context:', this.ctx);
        
        this.width = canvas.width;
        this.height = canvas.height;
        console.log('Game dimensions:', this.width, 'x', this.height);
        
        this.player = new Player(this.width/2, this.height - 100);
        console.log('Player created at:', this.width/2, this.height - 100);
        
        this.enemies = [];
        this.score = 0;
        this.hiScore = 0;
        this.newHiScore = false;
        this.level = 1;
        this.lives = 7;
        this.gameOver = false;
        this.lastSpawnTime = 0;
        this.currentLevel = LEVELS[0];
        this.enemySpeed = 2;
        this.enemySpawnRate = 2000;
        console.log('Current level:', this.currentLevel);
        
        // Replace combo system with streak system
        this.streak = 0;
        this.bestStreak = 0;
        this.mistakes = 0;
        this.totalAttempts = 0;
        
        // Add floating score animations
        this.floatingScores = [];
        
        // Add laser effects
        this.lasers = [];

        // Add miss animations
        this.missAnimations = [];
        
        // Add star background
        this.stars = this.createStars(50);
        
        // Add level change animation
        this.levelChangeAnimation = null;
        
        // Setup audio context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context created');
        
        // Add collision animations
        this.collisionAnimations = [];
        
        // Add victory animation
        this.victoryAnimation = null;
        this.fireworks = [];
        
        this.setupEventListeners();
        this.updateStreakDisplay();
        console.log('Game initialization complete');
    }

    createStars(count) {
        return Array.from({ length: count }, () => ({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 2 + 1
        }));
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) {
                if (e.key === 'Enter' || e.key === ' ') {
                    this.reset();
                }
                return;
            }
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.player.moveLeft();
                    break;
                case 'ArrowRight':
                    this.player.moveRight();
                    break;
                case 'ArrowUp':
                    this.player.setSpeed(this.player.speed + this.player.speedStep);
                    this.updateSpeedDisplay();
                    break;
                case 'ArrowDown':
                    this.player.setSpeed(this.player.speed - this.player.speedStep);
                    break;
                default:
                    if (e.key.length === 1) {
                        this.handleInput(e.key);
                    }
            }
        });
    }

    handleInput(char) {
        console.log('Handling input:', char);
        this.player.addInput(char);
        let inputHandled = false;
        let wasCorrect = false;
        let laserCreated = false;
        let foundMatch = false;

        // Check each enemy for matching input
        this.enemies.forEach(enemy => {
            if (!enemy.isDestroyed && !inputHandled) {
                const currentText = enemy.getCurrentText();
                const currentInput = this.player.getCurrentInput();
                
                console.log('Checking enemy:', {
                    text: currentText,
                    input: currentInput,
                    highlighted: enemy.getHighlightedText()
                });
                
                // Check if the input matches the start of the text
                if (currentText.startsWith(currentInput)) {
                    console.log('Match found!');
                    foundMatch = true;
                    // Create laser effect only for the first match
                    if (!laserCreated) {
                        this.createLaserEffect(this.player.x, this.player.y, enemy.x, enemy.y);
                        laserCreated = true;
                    }
                    
                    // Highlight the matching characters
                    for (let i = 0; i < currentInput.length; i++) {
                        enemy.highlightChar(i);
                    }
                    
                    if (enemy.isFullyHighlighted()) {
                        console.log('Enemy fully highlighted, destroying');
                        enemy.destroy();
                        wasCorrect = true;
                        this.updateStreak(true);
                        const points = this.calculatePoints(currentText.length);
                        this.score += points;
                        this.updateScore();
                        this.createFloatingScore(enemy.x, enemy.y, points);
                        inputHandled = true;
                        this.player.clearInput(); // Clear input only after successful hit
                        
                        // Clear highlighting on all remaining enemies
                        this.enemies.forEach(otherEnemy => {
                            if (!otherEnemy.isDestroyed) {
                                otherEnemy.clearHighlighting();
                            }
                        });
                    }
                }
            }
        });

        // Only clear input and show miss animation if no match was found
        if (!foundMatch) {
            console.log('No matches found for any enemy, showing miss animation');
            // Clear all highlighting from all enemies
            this.enemies.forEach(enemy => {
                if (!enemy.isDestroyed) {
                    enemy.clearHighlighting();
                }
            });
            this.player.clearInput();
            this.updateStreak(false);
            this.createMissAnimation(char);
            this.playMissSound();
        }
    }

    calculatePoints(basePoints) {
        console.log('Calculating points:', {
            basePoints,
            streak: this.streak,
            speed: this.player.speed
        });
        //const streakMultiplier = 1 + (this.streak * 0.1); // 10% increase per streak
        //const accuracyBonus = this.getAccuracyBonus();
        // return Math.floor(basePoints * 10 * streakMultiplier * accuracyBonus);
        return Math.floor(basePoints * (this.streak) * (1 + this.player.speed));
    }

    // getAccuracyBonus() {
    //     if (this.totalAttempts === 0) return 1;
    //     const accuracy = 1 - (this.mistakes / this.totalAttempts);
    //     return 1 + (accuracy * 0.5); // Up to 50% bonus for perfect accuracy
    // }

    updateSpeedDisplay() {
        document.getElementById('speed').textContent = Math.floor(this.player.speed);
    }

    updateStreak(wasCorrect) {
        if (wasCorrect) {
            this.streak++;
            this.bestStreak = Math.max(this.bestStreak, this.streak);
            this.totalAttempts++;
        } else {
            this.mistakes++;
            this.totalAttempts++;
            this.streak = 0;
        }

        this.updateStreakDisplay();
    }

    updateStreakDisplay() {
        const streakElement = document.getElementById('combo');
        const bestStreakElement = document.getElementById('bestCombo');
        const maxComboElement = document.getElementById('maxCombo');
        
        if (streakElement) {
            streakElement.textContent = this.streak;
        }
        
        if (bestStreakElement) {
            bestStreakElement.textContent = this.bestStreak;
        }

        if (maxComboElement) {
            maxComboElement.textContent = this.bestStreak;
        }
    }

    createLaserEffect(startX, startY, endX, endY) {
        this.lasers.push({
            startX,
            startY,
            endX,
            endY,
            alpha: 1,
            width: 3
        });
    }

    createFloatingScore(x, y, points) {
        this.floatingScores.push({
            x,
            y,
            points,
            alpha: 1,
            velocity: -2
        });
    }

    createMissAnimation(char) {
        // Create a floating red X with the incorrect character
        this.missAnimations.push({
            x: this.player.x,
            y: this.player.y - 50,
            char: char,
            alpha: 1,
            scale: 1,
            velocity: -1
        });
    }

    playMissSound() {
        // Create a low-pitched "buzz" sound for misses
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    spawnEnemy() {
        const now = Date.now();
        if (now - this.lastSpawnTime >= this.enemySpawnRate) {
            const target = this.currentLevel[
                Math.floor(Math.random() * this.currentLevel.length)
            ];
            let x = Math.random() * (this.width - 100) + 50;
            if(target.length > 4) {
                x = this.width / 2;
            } 
            const enemy = new Enemy(target, x, 0, this.enemySpeed);
            this.enemies.push(enemy);
            this.lastSpawnTime = now;
            console.log('Spawned enemy:', { text: target, x, speed: this.enemySpeed });
        }
    }

    playLevelUpSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Create a triumphant ascending sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    startLevelChangeAnimation() {
        this.levelChangeAnimation = {
            alpha: 0,
            text: `Level ${this.level}!`,
            duration: 2,
            startTime: Date.now()
        };
        this.playLevelUpSound();
    }

    playCollisionSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Create a harsh, descending sound for collision
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    createCollisionAnimation(x, y) {
        this.collisionAnimations.push({
            x,
            y,
            radius: 0,
            maxRadius: 50,
            alpha: 1,
            color: '#ff0000'
        });
    }

    startVictoryAnimation() {
        this.victoryAnimation = {
            startTime: Date.now(),
            duration: 3,
            shipY: this.player.y,
            shipSpeed: -10
        };
        this.playVictorySound();
    }

    playVictorySound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Create a triumphant ascending sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 1);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1);
    }

    createFirework(x, y) {
        const particles = [];
        const numParticles = 50;
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 * i) / numParticles;
            const speed = 2 + Math.random() * 2;
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                size: 2 + Math.random() * 2
            });
        }
        
        this.fireworks.push({
            particles,
            startTime: Date.now()
        });
    }

    update() {
        if (this.gameOver) {
            if (this.victoryAnimation) {
                // Update ship position
                this.player.y += this.victoryAnimation.shipSpeed;
                
                // Create fireworks when ship is high enough
                if (this.player.y < this.height / 2 && Math.random() < 0.1) {
                    this.createFirework(
                        this.player.x + (Math.random() - 0.5) * 200,
                        this.height / 2 + (Math.random() - 0.5) * 100
                    );
                }
                
                // Update fireworks
                this.fireworks = this.fireworks.filter(firework => {
                    firework.particles.forEach(particle => {
                        particle.x += particle.vx;
                        particle.y += particle.vy;
                        particle.vy += 0.1; // gravity
                        particle.alpha -= 0.02;
                    });
                    return firework.particles[0].alpha > 0;
                });
            }
            return;
        }
        this.updateSpeedDisplay();
        // only spawn enemies if there are 3 or less enemies on screen
        if (this.enemies.length < 3) {
            this.spawnEnemy();
        }

        // Update stars with player's speed
        this.stars.forEach(star => {
            star.y += star.speed * (this.player.speed / this.player.baseSpeed);
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        });

        // Update enemies with player's speed
        this.enemies = this.enemies.filter(enemy => {
            // Adjust enemy speed based on player speed
            enemy.speed = this.enemySpeed * (this.player.speed / this.player.baseSpeed);
            enemy.update();
            
            if (enemy.y > this.height) {
                // Create collision animation and play sound
                this.createCollisionAnimation(enemy.x, this.height);
                this.playCollisionSound();
                
                this.lives--;
                this.player.setSpeed(1);
                this.updateLives();
                if (this.lives <= 0) {
                    this.gameOver = true;
                }
                return false;
            }
            
            return !enemy.isDestroyed;
        });

        // Update lasers
        this.lasers = this.lasers.filter(laser => {
            laser.alpha -= 0.1;
            return laser.alpha > 0;
        });

        // Update floating scores
        this.floatingScores = this.floatingScores.filter(score => {
            score.y += score.velocity;
            score.alpha -= 0.02;
            return score.alpha > 0;
        });

        // Update miss animations
        this.missAnimations = this.missAnimations.filter(anim => {
            anim.y += anim.velocity;
            anim.alpha -= 0.05;
            anim.scale -= 0.02;
            return anim.alpha > 0;
        });

        // Update collision animations
        this.collisionAnimations = this.collisionAnimations.filter(anim => {
            anim.radius += 5;
            anim.alpha -= 0.05;
            return anim.alpha > 0;
        });

        // Update level change animation
        if (this.levelChangeAnimation) {
            const elapsed = (Date.now() - this.levelChangeAnimation.startTime) / 1000;
            if (elapsed < this.levelChangeAnimation.duration) {
                this.levelChangeAnimation.alpha = Math.min(1, elapsed * 2);
            } else {
                this.levelChangeAnimation.alpha = Math.max(0, 2 - elapsed * 2);
                if (elapsed >= this.levelChangeAnimation.duration * 2) {
                    this.levelChangeAnimation = null;
                }
            }
        }

        // Check for level completion
        if (this.score >= this.level * 1000) {
            this.level++;
            if (this.level <= LEVELS.length) {
                this.currentLevel = LEVELS[this.level - 1];
                this.updateLevel();
                this.startLevelChangeAnimation();
            } else {
                // this.gameOver = true;
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw stars
        this.ctx.fillStyle = '#fff';
        this.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw lasers
        this.lasers.forEach(laser => {
            this.ctx.save();
            this.ctx.strokeStyle = `rgba(0, 255, 0, ${laser.alpha})`;
            this.ctx.lineWidth = laser.width;
            this.ctx.beginPath();
            this.ctx.moveTo(laser.startX, laser.startY);
            this.ctx.lineTo(laser.endX, laser.endY);
            this.ctx.stroke();
            this.ctx.restore();
        });

        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // Draw floating scores
        this.floatingScores.forEach(score => {
            this.ctx.save();
            this.ctx.fillStyle = `rgba(0, 255, 0, ${score.alpha})`;
            this.ctx.font = '20px "Courier New"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`+${score.points}`, score.x, score.y);
            this.ctx.restore();
        });

        // Draw miss animations
        this.missAnimations.forEach(anim => {
            this.ctx.save();
            this.ctx.globalAlpha = anim.alpha;
            this.ctx.globalScale = anim.scale;
            this.ctx.fillStyle = 'red';
            this.ctx.font = '30px "Courier New"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`X ${anim.char}`, anim.x, anim.y);
            this.ctx.restore();
        });

        // Draw player
        this.player.draw(this.ctx);

        // Draw level change animation
        if (this.levelChangeAnimation) {
            this.ctx.save();
            this.ctx.globalAlpha = this.levelChangeAnimation.alpha;
            this.ctx.fillStyle = '#0f0';
            this.ctx.font = 'bold 48px "Courier New"';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.levelChangeAnimation.text, this.width/2, this.height/2);
            this.ctx.restore();
        }

        // Draw instructions
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '16px "Courier New"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('↑ Speed Up | ↓ Slow Down | Type letters to destroy enemies', this.width/2, this.height - 20);
        this.ctx.restore();

        // Draw game over screen if needed
        if (this.gameOver) {
            const overlay = document.getElementById('gameOverlay');
            if (overlay && overlay.style.display !== 'flex') {
                overlay.style.display = 'flex';
                const finalScore = document.getElementById('finalScore');
                if (finalScore) {
                    finalScore.textContent = this.score;
                }
                const maxCombo = document.getElementById('maxCombo');
                if (maxCombo) {
                    maxCombo.textContent = this.bestStreak;
                }
                
                // Update the title based on whether it's a victory or game over
                const title = overlay.querySelector('h2');
                if (title) {
                    if (this.newHiScore) {
                        title.textContent = 'New High Score!';
                        title.style.color = '#0f0';
                    } else {
                        title.textContent = 'Game Over!';
                        title.style.color = '#f00';
                    }
                }
            }
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        if(this.score > this.hiScore) {
            this.newHiScore = true;
            this.hiScore = this.score;
            document.getElementById('hi-score').textContent = this.hiScore;
        }
    }

    updateLevel() {
        document.getElementById('level').textContent = this.level;
    }

    updateLives() {
        document.getElementById('lives').textContent = this.lives;
    }

    reset() {
        this.enemies = [];
        this.score = 0;
        this.newHiScore = false;
        this.level = 1;
        this.lives = 7;
        this.gameOver = false;
        this.lastSpawnTime = 0;
        this.currentLevel = LEVELS[0];
        this.enemySpeed = 1;
        this.enemySpawnRate = 2000;
        this.player.clearInput();
        this.lasers = [];
        this.floatingScores = [];
        this.missAnimations = [];
        this.collisionAnimations = [];
        
        // Reset streak system
        this.streak = 0;
        this.bestStreak = 0;
        this.mistakes = 0;
        this.totalAttempts = 0;
        
        this.updateScore();
        this.updateLevel();
        this.updateLives();
        this.updateStreakDisplay();
        
        document.getElementById('gameOverlay').style.display = 'none';
        this.victoryAnimation = null;
        this.fireworks = [];
    }
} 