import React, { useEffect, useRef, useState } from 'react';

const ParticleSystem = ({ 
  type = 'default', 
  intensity = 'medium',
  color = '#7c3aed',
  isActive = true 
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const intensityConfig = {
    low: { count: 20, speed: 0.5 },
    medium: { count: 50, speed: 1 },
    high: { count: 100, speed: 1.5 },
    extreme: { count: 200, speed: 2 }
  };

  const particleTypes = {
    default: {
      size: () => Math.random() * 3 + 1,
      shape: 'circle',
      behavior: 'float'
    },
    stars: {
      size: () => Math.random() * 2 + 0.5,
      shape: 'star',
      behavior: 'twinkle'
    },
    coins: {
      size: () => Math.random() * 4 + 2,
      shape: 'circle',
      behavior: 'fall',
      color: '#fbbf24'
    },
    confetti: {
      size: () => Math.random() * 6 + 2,
      shape: 'rectangle',
      behavior: 'confetti',
      colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
    },
    magic: {
      size: () => Math.random() * 3 + 1,
      shape: 'circle',
      behavior: 'spiral',
      glow: true
    }
  };

  class Particle {
    constructor(canvas, config) {
      this.canvas = canvas;
      this.config = config;
      this.reset();
    }

    reset() {
      this.x = Math.random() * this.canvas.width;
      this.y = this.config.behavior === 'fall' ? -10 : Math.random() * this.canvas.height;
      this.size = this.config.size();
      this.speedX = (Math.random() - 0.5) * 2;
      this.speedY = this.config.behavior === 'fall' ? Math.random() * 2 + 1 : (Math.random() - 0.5) * 2;
      this.opacity = Math.random() * 0.8 + 0.2;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.1;
      this.color = this.config.colors ? 
        this.config.colors[Math.floor(Math.random() * this.config.colors.length)] : 
        (this.config.color || color);
      this.life = 1;
      this.decay = Math.random() * 0.01 + 0.005;
      
      // Spiral behavior properties
      if (this.config.behavior === 'spiral') {
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * 50 + 20;
        this.centerX = this.x;
        this.centerY = this.y;
      }
    }

    update(deltaTime) {
      const speed = intensityConfig[intensity].speed;
      
      switch (this.config.behavior) {
        case 'float':
          this.x += this.speedX * speed;
          this.y += this.speedY * speed;
          break;
          
        case 'fall':
          this.y += this.speedY * speed;
          this.x += Math.sin(this.y * 0.01) * 0.5;
          break;
          
        case 'confetti':
          this.x += this.speedX * speed;
          this.y += this.speedY * speed;
          this.speedY += 0.1; // gravity
          this.rotation += this.rotationSpeed;
          break;
          
        case 'spiral':
          this.angle += 0.02 * speed;
          this.x = this.centerX + Math.cos(this.angle) * this.radius;
          this.y = this.centerY + Math.sin(this.angle) * this.radius;
          this.radius *= 0.999; // spiral inward
          break;
          
        case 'twinkle':
          this.opacity = Math.sin(Date.now() * 0.005 + this.x) * 0.5 + 0.5;
          break;
      }

      // Boundary checks
      if (this.x < -10 || this.x > this.canvas.width + 10 || 
          this.y < -10 || this.y > this.canvas.height + 10) {
        this.reset();
      }

      // Life decay for some effects
      if (this.config.behavior === 'confetti' || this.config.behavior === 'spiral') {
        this.life -= this.decay;
        if (this.life <= 0) {
          this.reset();
        }
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.opacity * this.life;
      
      if (this.config.glow) {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
      }

      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;

      switch (this.config.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, this.size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'star':
          this.drawStar(ctx, 0, 0, 5, this.size, this.size * 0.5);
          break;
          
        case 'rectangle':
          ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
          break;
      }

      ctx.restore();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);

      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }

      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const config = particleTypes[type];
    const { count } = intensityConfig[intensity];

    const updateDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Initialize particles
    particlesRef.current = Array.from({ length: count }, () => 
      new Particle(canvas, config)
    );

    let lastTime = 0;
    const animate = (currentTime) => {
      if (!isActive) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(particle => {
        particle.update(deltaTime);
        particle.draw(ctx);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [type, intensity, color, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ 
        width: '100%', 
        height: '100%',
        opacity: isActive ? 1 : 0,
        transition: 'opacity 0.5s ease'
      }}
    />
  );
};

export default ParticleSystem;