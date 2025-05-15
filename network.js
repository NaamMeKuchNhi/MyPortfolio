// Neural Network Background Animation Class
class NeuralBackground {
    constructor() {
        this.canvas = document.getElementById('neural-network-bg');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = {
            x: 0,
            y: 0,
            active: false
        };
        this.dimensions = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Colors that match the existing portfolio design
        this.COLORS = [
            '#ffcc00', // Gold
            '#ffffff', // White
            '#f1bbfa', // Light Pink
            '#ffffff', // White (repeated for more white particles)
            '#ffcc00'  // Gold (repeated for more gold particles)
        ];
        
        this.init();
        this.bindEvents();
        this.animate();
    }
    
    init() {
        this.setupCanvas();
        this.createParticles();
    }
    
    setupCanvas() {
        const pixelRatio = window.devicePixelRatio || 1;
        this.canvas.width = this.dimensions.width * pixelRatio;
        this.canvas.height = this.dimensions.height * pixelRatio;
        this.canvas.style.width = `${this.dimensions.width}px`;
        this.canvas.style.height = `${this.dimensions.height}px`;
        this.ctx.scale(pixelRatio, pixelRatio);
    }
    
    createParticles() {
        const particleCount = Math.min(
            Math.max(Math.floor(this.dimensions.width * this.dimensions.height / 6000), 100), 
            220
        );
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.dimensions.width,
                y: Math.random() * this.dimensions.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 1.2,
                speedY: (Math.random() - 0.5) * 1.2,
                color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
                alpha: Math.random() * 0.5 + 0.5,
                pulsing: Math.random() > 0.7,
                pulseSpeed: Math.random() * 0.02 + 0.01,
                pulseDirection: Math.random() > 0.5,
            });
        }
    }
    
    bindEvents() {
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseout', () => this.handleMouseOut());
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.handleMouseMove({
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY
                });
            }
        }, { passive: true });
        window.addEventListener('touchend', () => this.handleMouseOut());
    }
    
    handleResize() {
        this.dimensions = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.setupCanvas();
        this.particles = [];
        this.createParticles();
    }
    
    handleMouseMove(e) {
        this.mouse = {
            x: e.clientX,
            y: e.clientY,
            active: true
        };
    }
    
    handleMouseOut() {
        this.mouse.active = false;
    }
    
    drawParticle(p, mouseDistance) {
        // Calculate glow and size effects
        let size = p.size;
        let alpha = p.alpha;
        
        // Apply pulsing effect
        if (p.pulsing) {
            if (p.pulseDirection) {
                alpha += p.pulseSpeed;
                if (alpha >= 1) {
                    alpha = 1;
                    p.pulseDirection = false;
                }
            } else {
                alpha -= p.pulseSpeed;
                if (alpha <= 0.5) {
                    alpha = 0.5;
                    p.pulseDirection = true;
                }
            }
            p.alpha = alpha;
        }
    
        // Enhance particles near mouse
        if (mouseDistance !== null && mouseDistance < 150) {
            const influence = 1 - mouseDistance / 150;
            size += influence * 2;
            alpha = Math.min(alpha + influence * 0.5, 1);
        }
        
        // Draw particle with glow effect
        this.ctx.save();
        this.ctx.globalAlpha = alpha * 0.8;
        
        // Draw glow
        const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw core
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawConnection(p1, p2, distance, maxDistance) {
        // Calculate line opacity based on distance
        const opacity = Math.pow(1 - distance / maxDistance, 1.5);
        
        // Create gradient for the connection line
        const gradient = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        gradient.addColorStop(0, p1.color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, p2.color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));
        
        // Draw the connection line
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = Math.max(0.5, 1.5 * opacity);
        this.ctx.stroke();
    }
    
    animate() {
        // Apply semi-transparent clear to create a trailing effect
        this.ctx.clearRect(0, 0, this.dimensions.width, this.dimensions.height);
        
        // Draw connections first (below particles)
        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            
            // Connect particles that are close
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
                const maxDistance = 180; // Increased from 160 to 180
                
                if (distance < maxDistance) {
                    this.drawConnection(p1, p2, distance, maxDistance);
                }
            }
        }
        
        // Then draw and update particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Calculate distance from mouse
            let mouseDistance = null;
            if (this.mouse.active) {
                mouseDistance = Math.sqrt((p.x - this.mouse.x) ** 2 + (p.y - this.mouse.y) ** 2);
                
                // Apply stronger attraction to mouse
                if (mouseDistance < 200) {
                    const influence = (1 - mouseDistance / 200) * 0.8; // Increased from 0.5 to 0.8
                    const angle = Math.atan2(this.mouse.y - p.y, this.mouse.x - p.x);
                    p.speedX += Math.cos(angle) * influence * 0.15; // Increased from 0.1 to 0.15
                    p.speedY += Math.sin(angle) * influence * 0.15;
                }
            }
            
            // Move particles
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Apply slight drag
            p.speedX *= 0.99;
            p.speedY *= 0.99;
            
            // Add slight random movement
            p.speedX += (Math.random() - 0.5) * 0.05;
            p.speedY += (Math.random() - 0.5) * 0.05;
            
            // Bounce off edges with damping
            if (p.x < 0) {
                p.x = 0;
                p.speedX = Math.abs(p.speedX) * 0.8;
            } else if (p.x > this.dimensions.width) {
                p.x = this.dimensions.width;
                p.speedX = -Math.abs(p.speedX) * 0.8;
            }
            
            if (p.y < 0) {
                p.y = 0;
                p.speedY = Math.abs(p.speedY) * 0.8;
            } else if (p.y > this.dimensions.height) {
                p.y = this.dimensions.height;
                p.speedY = -Math.abs(p.speedY) * 0.8;
            }
            
            // Limit max speed
            const speed = Math.sqrt(p.speedX * p.speedX + p.speedY * p.speedY);
            if (speed > 2) {
                p.speedX = (p.speedX / speed) * 2;
                p.speedY = (p.speedY / speed) * 2;
            }
            
            // Draw particle
            this.drawParticle(p, mouseDistance);
        }
        
        // Request next frame
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize network background when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new NeuralBackground();
}); 