'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface MetalCursorProps {
  size?: number;
  trail?: boolean;
  sound?: boolean;
}

interface Puff {
  id: number;
  x: number;
  y: number;
  size: number;
  driftX: number;
  duration: number;
  blur: number;
  hue: number;
}

let puffId = 0;
let hueCounter = 0;

export default function MetalCursor({
  size = 40,
  trail = true,
  sound = true,
}: MetalCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSpawn = useRef(0);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [puffs, setPuffs] = useState<Puff[]>([]);

  useEffect(() => setMounted(true), []);

  const playChime = () => {
    if (!sound) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      [{ freq: 600, delay: 0 }, { freq: 900, delay: 0.04 }].forEach(
        ({ freq, delay }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, now + delay);
          gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.32);
        }
      );
    } catch {}
  };

  useEffect(() => {
    if (!mounted) return;

    document.body.style.cursor = 'none';
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      * { cursor: none !important; }
      @keyframes smokeRise {
        0% {
          opacity: 0.9;
          transform: translate(-50%, -50%) scale(0.5) translateY(0px);
        }
        40% {
          opacity: 0.75;
          transform: translate(-50%, -50%) scale(1.1) translateY(-10px);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(2.4) translateY(-55px);
        }
      }
    `;
    document.head.appendChild(styleTag);

    const handleMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }

      if (!trail) return;

      const now = Date.now();
      if (now - lastSpawn.current < 20) return;
      lastSpawn.current = now;

      hueCounter = (hueCounter + 8) % 360; // cycle through the color wheel

      const newPuff: Puff = {
        id: puffId++,
        x: e.clientX + (Math.random() * 12 - 6),
        y: e.clientY + (Math.random() * 12 - 6),
        size: 26 + Math.random() * 24,
        driftX: Math.random() * 24 - 12,
        duration: 900 + Math.random() * 500,
        blur: 1 + Math.random() * 2,
        hue: hueCounter,
      };

      setPuffs((prev) => [...prev.slice(-40), newPuff]);
    };

    const handleDown = () => {
      setIsClicking(true);
      playChime();
    };
    const handleUp = () => setIsClicking(false);
    const handleLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('mouseleave', handleLeave);

    return () => {
      document.body.style.cursor = 'auto';
      document.head.removeChild(styleTag);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('mouseleave', handleLeave);
    };
  }, [trail, isVisible, mounted]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* RGB smoke puffs */}
      {puffs.map((p) => (
        <div
          key={p.id}
          onAnimationEnd={() =>
            setPuffs((prev) => prev.filter((puff) => puff.id !== p.id))
          }
          style={{
            position: 'fixed',
            top: p.y,
            left: p.x,
            width: p.size,
            height: p.size,
            pointerEvents: 'none',
            zIndex: 9998,
            borderRadius: '50%',
            background: `radial-gradient(circle,
              hsla(${p.hue}, 95%, 65%, 0.95) 0%,
              hsla(${p.hue}, 90%, 55%, 0.7) 35%,
              hsla(${p.hue}, 85%, 45%, 0.4) 65%,
              hsla(${p.hue}, 80%, 40%, 0) 100%)`,
            filter: `blur(${p.blur}px)`,
            animation: `smokeRise ${p.duration}ms ease-out forwards`,
          }}
        />
      ))}

      {/* Metallic pointing arrow cursor */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: size,
          height: size,
          pointerEvents: 'none',
          zIndex: 9999,
          transform: `translate(-15%, -15%) scale(${isClicking ? 0.85 : 1})`,
          transition: 'transform 0.12s ease',
          opacity: isVisible ? 1 : 0,
        }}
      >
        <svg viewBox="0 0 48 48" width={size} height={size}>
          <defs>
            <linearGradient id="bronzeBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8b07a" />
              <stop offset="35%" stopColor="#b97a4a" />
              <stop offset="70%" stopColor="#7a4a2e" />
              <stop offset="100%" stopColor="#4a2c1a" />
            </linearGradient>
            <linearGradient id="bronzeEdge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbe2c4" />
              <stop offset="100%" stopColor="#9c6a40" />
            </linearGradient>
            <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="1" dy="2" stdDeviation="1.2" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>

          <g filter="url(#softShadow)">
            <path
              d="M6 4 L42 20 L26 24 L20 42 Z"
              fill="url(#bronzeBody)"
              stroke="url(#bronzeEdge)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <path
              d="M6 4 L26 24 L20 42"
              fill="none"
              stroke="#fbe2c4"
              strokeWidth="0.8"
              opacity="0.6"
            />
            <line x1="6" y1="4" x2="42" y2="20" stroke="#4a2c1a" strokeWidth="0.6" opacity="0.5" />
          </g>
        </svg>
      </div>
    </>,
    document.body
  );
}