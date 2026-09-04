import React, { useEffect, useRef } from 'react';

/**
 * High-performance, pure visual HTML5 Canvas fireworks particle burst engine.
 * No audio / sound effects.
 */
const FireworksCanvas = ({ className = 'absolute inset-0 pointer-events-none z-0', autoLaunch = true }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let rockets = [];

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement ? canvas.parentElement.offsetWidth : window.innerWidth;
      canvas.height = canvas.parentElement ? canvas.parentElement.offsetHeight : window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const colors = [
      '#f59e0b', // Gold
      '#ef4444', // Crimson Red
      '#f97316', // Orange
      '#10b981', // Emerald Green
      '#ec4899', // Pink
      '#8b5cf6', // Purple
      '#38bdf8', // Sky Blue
      '#fde047', // Light Gold
    ];

    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.012;
        this.size = Math.random() * 2.5 + 1.2;
        this.gravity = 0.06;
      }

      update() {
        this.vx *= 0.97;
        this.vy *= 0.97;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
      }

      draw(context) {
        context.save();
        context.globalAlpha = Math.max(0, this.alpha);
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.shadowBlur = 8;
        context.shadowColor = this.color;
        context.fill();
        context.restore();
      }
    }

    class Rocket {
      constructor(targetX, targetY) {
        this.x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
        this.y = canvas.height;
        this.targetX = targetX || Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
        this.targetY = targetY || Math.random() * (canvas.height * 0.45) + canvas.height * 0.1;
        this.speed = Math.random() * 3 + 7;
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.exploded = false;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.y <= this.targetY || this.vy >= 0) {
          this.explode();
        }
      }

      explode() {
        this.exploded = true;
        const burstColor = colors[Math.floor(Math.random() * colors.length)];
        const count = Math.floor(Math.random() * 35 + 40);
        for (let i = 0; i < count; i++) {
          particles.push(new Particle(this.x, this.y, burstColor));
        }
      }

      draw(context) {
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, 2, 0, Math.PI * 2);
        context.fillStyle = '#fde047';
        context.shadowBlur = 6;
        context.shadowColor = '#f59e0b';
        context.fill();
        context.restore();
      }
    }

    let lastLaunch = Date.now();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (autoLaunch && Date.now() - lastLaunch > 1200 && Math.random() > 0.3) {
        rockets.push(new Rocket());
        lastLaunch = Date.now();
      }

      // Update & Draw Rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.update();
        r.draw(ctx);
        if (r.exploded) {
          rockets.splice(i, 1);
        }
      }

      // Update & Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [autoLaunch]);

  return <canvas ref={canvasRef} className={className} />;
};

export default FireworksCanvas;
