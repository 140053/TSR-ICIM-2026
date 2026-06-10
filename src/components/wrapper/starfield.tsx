'use client';

import { useEffect, useRef } from 'react';

type StarColor = 'white' | 'yellow' | 'red';

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  da: number;
  dy: number;
  color: StarColor;
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const stars: Star[] = [];

    function resizeCanvas() {
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);

    // 🎨 pick random color
    function randomColor(): StarColor {
      const rand = Math.random();
      if (rand < 0.6) return 'white';   // most stars
      if (rand < 0.85) return 'yellow'; // some
      return 'red';                     // rare
    }

    function mkStar(): Star {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random(),
        da: (Math.random() - 0.5) * 0.05,
        dy: Math.random() * 0.08 + 0.02,
        color: randomColor(),
      };
    }

    for (let i = 0; i < 160; i++) stars.push(mkStar());

    let animationFrameId: number;

    function getColor(color: StarColor, alpha: number) {
      switch (color) {
        case 'white':
          return `rgba(255,255,255,${alpha})`;
        case 'yellow':
          return `rgba(255,223,100,${alpha})`;
        case 'red':
          return `rgba(255,120,120,${alpha})`;
      }
    }

    function drawStars() {
      if (!ctx) return;

      ctx.clearRect(0, 0, W, H);

      stars.forEach(star => {
        star.a += star.da;
        if (star.a <= 0 || star.a >= 1) star.da *= -1;

        star.y -= star.dy;
        if (star.y < -2) star.y = H + 2;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);

        ctx.fillStyle = getColor(star.color, star.a);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(drawStars);
    }

    drawStars();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
    />
  );
}