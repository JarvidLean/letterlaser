class Enemy {
    constructor(text, x, y, speed) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.highlightedChars = new Set();
        this.isDestroyed = false;
        this.width = 0; // Will be set when drawing
        this.height = 0; // Will be set when drawing
        this.destructionAnimation = {
            active: false,
            frame: 0,
            maxFrames: 20,
            particles: []
        };
        
        // Initialize audio context and create sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create laser sound
        this.laserSound = this.createLaserSound();
        
        // Create explosion sound
        this.explosionSound = this.createExplosionSound();
    }

    createLaserSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        return { oscillator, gainNode };
    }

    createExplosionSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        return { oscillator, gainNode };
    }

    playLaserSound() {
        try {
            console.log('Playing laser sound');
            const { oscillator, gainNode } = this.laserSound;
            oscillator.start();
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (error) {
            console.error('Error playing laser sound:', error);
        }
    }

    playExplosionSound() {
        const { oscillator, gainNode } = this.explosionSound;
        oscillator.start();
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    update() {
        this.y += this.speed;
        
        // Update destruction animation
        if (this.destructionAnimation.active) {
            this.destructionAnimation.frame++;
            this.destructionAnimation.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.1; // gravity
                particle.alpha -= 0.02;
            });
            this.destructionAnimation.particles = this.destructionAnimation.particles.filter(p => p.alpha > 0);
        }
    }

    draw(ctx) {
        if (this.isDestroyed) {
            if (this.destructionAnimation.active) {
                this.drawDestructionAnimation(ctx);
            }
            return;
        }

        ctx.save();
        // Increase font size and make it bold
        ctx.font = 'bold 36px "Courier New"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate text metrics for the space invader shape
        const metrics = ctx.measureText(this.text);
        const textWidth = metrics.width;
        const textHeight = 45; // Increased height for larger font
        
        // Draw space invader shape with darker background
        ctx.fillStyle = '#222';
        // Remove shadow blur for background
        ctx.shadowBlur = 0;
        
        // Main body with rounded corners
        ctx.beginPath();
        ctx.moveTo(this.x - textWidth/2 - 15, this.y - textHeight/2);
        ctx.lineTo(this.x + textWidth/2 + 15, this.y - textHeight/2);
        ctx.lineTo(this.x + textWidth/2 + 15, this.y + textHeight/2);
        ctx.lineTo(this.x - textWidth/2 - 15, this.y + textHeight/2);
        ctx.closePath();
        ctx.fill();
        
        // Draw each character with its own color and highlight
        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            const isHighlighted = this.highlightedChars.has(i);
            
            // Remove shadow blur for text
            ctx.shadowBlur = 0;
            
            if (isHighlighted) {
                ctx.fillStyle = '#0f0';
            } else {
                ctx.fillStyle = '#fff';
            }
            
            // Calculate position for this character
            const charWidth = ctx.measureText(char).width;
            const totalWidth = ctx.measureText(this.text).width;
            const startX = this.x - totalWidth / 2;
            const charX = startX + charWidth / 2 + ctx.measureText(this.text.substring(0, i)).width;
            
            ctx.fillText(char, charX, this.y);
        }
        
        ctx.restore();
    }

    drawDestructionAnimation(ctx) {
        ctx.save();
        this.destructionAnimation.particles.forEach(particle => {
            ctx.fillStyle = `rgba(255, 0, 0, ${particle.alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    highlightChar(index) {
        if (index >= 0 && index < this.text.length) {
            console.log('Highlighting character at index:', index, 'in text:', this.text);
            this.highlightedChars.add(index);
            this.playLaserSound();
        } else {
            console.warn('Invalid highlight index:', index, 'for text:', this.text);
        }
    }

    destroy() {
        this.isDestroyed = true;
        this.destructionAnimation.active = true;
        this.playExplosionSound();
        
        // Create particles
        for (let i = 0; i < 20; i++) {
            this.destructionAnimation.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                alpha: 1
            });
        }
    }

    isFullyHighlighted() {
        const isHighlighted = this.highlightedChars.size === this.text.length;
        console.log('Checking if fully highlighted:', {
            text: this.text,
            highlightedChars: Array.from(this.highlightedChars),
            isHighlighted
        });
        return isHighlighted;
    }

    checkCollision(x, y) {
        return x >= this.x - this.width/2 &&
               x <= this.x + this.width/2 &&
               y >= this.y - this.height &&
               y <= this.y;
    }

    getCurrentText() {
        return this.text;
    }

    getHighlightedText() {
        let result = '';
        for (let i = 0; i < this.text.length; i++) {
            result += this.highlightedChars.has(i) ? this.text[i] : '_';
        }
        return result;
    }

    clearHighlighting() {
        this.highlightedChars.clear();
    }
} 