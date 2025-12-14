import { useEffect, useRef } from 'react';
import type { BackgroundAnimationConfig } from '../../types/project';

interface BackgroundAnimationsProps {
  config?: BackgroundAnimationConfig;
  className?: string;
}

// Get particle count based on intensity
function getParticleCount(intensity: 'low' | 'medium' | 'high' = 'medium'): number {
  switch (intensity) {
    case 'low':
      return 10;
    case 'medium':
      return 25;
    case 'high':
      return 50;
    default:
      return 25;
  }
}

// Get animation duration based on speed
function getAnimationDuration(speed: 'slow' | 'normal' | 'fast' = 'normal'): string {
  switch (speed) {
    case 'slow':
      return '8s';
    case 'normal':
      return '5s';
    case 'fast':
      return '3s';
    default:
      return '5s';
  }
}

// Hearts Animation Component
function HeartsAnimation({ config }: { config: BackgroundAnimationConfig }) {
  const particleCount = getParticleCount(config.intensity);
  const duration = getAnimationDuration(config.speed);
  const color = config.color || '#ff6b9d';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => {
        const delay = (i / particleCount) * parseFloat(duration);
        const left = Math.random() * 100;
        const size = 15 + Math.random() * 20;
        return (
          <div
            key={i}
            className="absolute bottom-0"
            style={{
              left: `${left}%`,
              fontSize: `${size}px`,
              color: color,
              animation: `floatUp ${duration} linear infinite`,
              animationDelay: `${delay}s`,
              opacity: 0.7 + Math.random() * 0.3,
            }}
          >
            ❤️
          </div>
        );
      })}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-50vh) translateX(${Math.random() * 20 - 10}px) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(${Math.random() * 20 - 10}px) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Sparkles Animation Component
function SparklesAnimation({ config }: { config: BackgroundAnimationConfig }) {
  const particleCount = getParticleCount(config.intensity);
  const duration = getAnimationDuration(config.speed);
  const color = config.color || '#ffd700';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => {
        const delay = Math.random() * parseFloat(duration);
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const size = 8 + Math.random() * 12;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              color: color,
              animation: `sparkle ${duration} ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          >
            ✨
          </div>
        );
      })}
      <style>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}

// Bubbles Animation Component
function BubblesAnimation({ config }: { config: BackgroundAnimationConfig }) {
  const particleCount = getParticleCount(config.intensity);
  const duration = getAnimationDuration(config.speed);
  const color = config.color || '#87ceeb';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => {
        const delay = (i / particleCount) * parseFloat(duration);
        const left = Math.random() * 100;
        const size = 20 + Math.random() * 40;
        const speed = 3 + Math.random() * 4;
        return (
          <div
            key={i}
            className="absolute bottom-0 rounded-full border-2"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              borderColor: color,
              backgroundColor: `rgba(135, 206, 235, 0.2)`,
              animation: `bubbleUp ${speed}s linear infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes bubbleUp {
          0% {
            transform: translateY(0) translateX(0) scale(0.5);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-50vh) translateX(${Math.random() * 30 - 15}px) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) translateX(${Math.random() * 30 - 15}px) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Confetti Animation Component (Canvas-based)
function ConfettiAnimation({ config }: { config: BackgroundAnimationConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCount = getParticleCount(config.intensity);
  const speed = config.speed || 'normal';
  const color = config.color || '#ff6b9d';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
    }> = [];

    const colors = [color, '#4ecdc4', '#ffe66d', '#ff6b9d', '#95e1d3', '#f38181'];
    const speedMultiplier = speed === 'slow' ? 0.5 : speed === 'fast' ? 2 : 1;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 2 * speedMultiplier,
        vy: (Math.random() * 3 + 2) * speedMultiplier,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 5,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1 * speedMultiplier; // Gravity

        // Reset if off screen
        if (particle.y > canvas.height) {
          particle.y = -10;
          particle.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.rect(particle.x, particle.y, particle.size, particle.size);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [particleCount, speed, color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

// Fireworks Animation Component (Canvas-based)
function FireworksAnimation({ config }: { config: BackgroundAnimationConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCount = getParticleCount(config.intensity);
  const speed = config.speed || 'normal';
  const color = config.color || '#ff6b9d';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fireworks: Array<{
      x: number;
      y: number;
      particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        color: string;
        life: number;
      }>;
    }> = [];

    const colors = [color, '#4ecdc4', '#ffe66d', '#ff6b9d', '#95e1d3', '#f38181'];
    const speedMultiplier = speed === 'slow' ? 0.5 : speed === 'fast' ? 2 : 1;

    function createFirework(x: number, y: number) {
      const particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        color: string;
        life: number;
      }> = [];

      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30;
        const velocity = 2 + Math.random() * 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity * speedMultiplier,
          vy: Math.sin(angle) * velocity * speedMultiplier,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
        });
      }

      fireworks.push({ x, y, particles });
    }

    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn new firework
      if (Math.random() < 0.02) {
        createFirework(
          Math.random() * canvas.width,
          Math.random() * (canvas.height * 0.5) + canvas.height * 0.2
        );
      }

      fireworks.forEach((firework, fIdx) => {
        firework.particles = firework.particles.filter((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.1 * speedMultiplier; // Gravity
          particle.life -= 0.02;

          if (particle.life > 0) {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
            return true;
          }
          return false;
        });

        if (firework.particles.length === 0) {
          fireworks.splice(fIdx, 1);
        }
      });

      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [particleCount, speed, color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1, backgroundColor: 'transparent' }}
    />
  );
}

// Stars Animation Component
function StarsAnimation({ config }: { config: BackgroundAnimationConfig }) {
  const particleCount = getParticleCount(config.intensity);
  const duration = getAnimationDuration(config.speed);
  const color = config.color || '#ffd700';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => {
        const delay = Math.random() * parseFloat(duration);
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const size = 4 + Math.random() * 8;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              color: color,
              animation: `twinkle ${duration} ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          >
            ⭐
          </div>
        );
      })}
      <style>{`
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}

export function BackgroundAnimations({ config, className = '' }: BackgroundAnimationsProps) {
  if (!config || !config.type || config.type === 'none') {
    return null;
  }

  const animationComponents = {
    hearts: <HeartsAnimation config={config} />,
    sparkles: <SparklesAnimation config={config} />,
    bubbles: <BubblesAnimation config={config} />,
    confetti: <ConfettiAnimation config={config} />,
    fireworks: <FireworksAnimation config={config} />,
    stars: <StarsAnimation config={config} />,
  };

  return (
    <div className={`absolute inset-0 ${className}`} style={{ zIndex: 0 }}>
      {animationComponents[config.type]}
    </div>
  );
}
