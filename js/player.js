class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 20;
        this.speed = 5;
        this.currentInput = '';
        this.baseSpeed = 5;
        this.maxSpeed = 20;
        this.minSpeed = 0;
        this.speedStep = 1;
    }

    update() {
        // Add any per-frame updates here if needed
    }

    moveLeft() {
        this.x = Math.max(this.width/2, this.x - this.speed);
    }

    moveRight() {
        this.x = Math.min(800 - this.width/2, this.x + this.speed);
    }

    setSpeed(speed) {
        this.speed = Math.max(this.minSpeed, Math.min(this.maxSpeed, speed));
    }

    addInput(char) {
        this.currentInput += char;
    }

    clearInput() {
        this.currentInput = '';
    }

    getCurrentInput() {
        return this.currentInput;
    }

    draw(ctx) {
        ctx.save();
        
        // Draw thruster flame
        const flameHeight = 20 + (this.speed - this.baseSpeed) * 5;
        const flameWidth = 10 + (this.speed - this.baseSpeed) * 2;
        const flameAlpha = 0.3 + (this.speed - this.baseSpeed) * 0.1;
        
        // Outer flame
        ctx.fillStyle = `rgba(255, 165, 0, ${flameAlpha})`;
        ctx.beginPath();
        ctx.moveTo(this.x - flameWidth/2, this.y + this.height/2);
        ctx.lineTo(this.x + flameWidth/2, this.y + this.height/2);
        ctx.lineTo(this.x, this.y + this.height/2 + flameHeight);
        ctx.closePath();
        ctx.fill();
        
        // Inner flame
        ctx.fillStyle = `rgba(255, 255, 0, ${flameAlpha})`;
        ctx.beginPath();
        ctx.moveTo(this.x - flameWidth/3, this.y + this.height/2);
        ctx.lineTo(this.x + flameWidth/3, this.y + this.height/2);
        ctx.lineTo(this.x, this.y + this.height/2 + flameHeight * 0.7);
        ctx.closePath();
        ctx.fill();
        
        // Draw ship body
        ctx.fillStyle = '#0f0';
        ctx.shadowColor = '#0f0';
        ctx.shadowBlur = 10;
        
        // F4 Phantom shape
        ctx.beginPath();
        
        // Nose
        ctx.moveTo(this.x, this.y - this.height/2);
        
        // Right wing (swept back)
        ctx.lineTo(this.x + this.width/2, this.y - this.height/4);
        ctx.lineTo(this.x + this.width/3, this.y + this.height/4);
        
        // Right tail
        ctx.lineTo(this.x + this.width/4, this.y + this.height/2);
        
        // Left tail
        ctx.lineTo(this.x - this.width/4, this.y + this.height/2);
        
        // Left wing (swept back)
        ctx.lineTo(this.x - this.width/3, this.y + this.height/4);
        ctx.lineTo(this.x - this.width/2, this.y - this.height/4);
        ctx.closePath();
        ctx.fill();
        
        // Draw cockpit
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - this.height/6, this.width/4, this.height/3, 0, 0, Math.PI);
        ctx.fill();
        
        // Draw twin tails
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        // Right tail
        ctx.moveTo(this.x + this.width/4, this.y + this.height/2);
        ctx.lineTo(this.x + this.width/3, this.y + this.height/2);
        ctx.lineTo(this.x + this.width/4, this.y + this.height/2 + this.height/3);
        ctx.closePath();
        ctx.fill();
        
        // Left tail
        ctx.beginPath();
        ctx.moveTo(this.x - this.width/4, this.y + this.height/2);
        ctx.lineTo(this.x - this.width/3, this.y + this.height/2);
        ctx.lineTo(this.x - this.width/4, this.y + this.height/2 + this.height/3);
        ctx.closePath();
        ctx.fill();
        
        // Draw current input if any
        if (this.currentInput) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px "Courier New"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.currentInput, this.x, this.y);
        }
        
        ctx.restore();
    }

    checkCollision(x, y) {
        return x >= this.x - this.width/2 &&
               x <= this.x + this.width/2 &&
               y >= this.y - this.height/2 &&
               y <= this.y + this.height/2;
    }
} 