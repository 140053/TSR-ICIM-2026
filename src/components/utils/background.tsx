'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface BackgroundMusicProps {
  src: string;       // e.g. "/audio/bgm.mp3"
  volume?: number;   // 0 to 1, target volume
  loop?: boolean;
  fadeDuration?: number; // ms for fade out/in, default 600
}

export default function BackgroundMusic({
  src,
  volume = 0.5,
  loop = true,
  fadeDuration = 600,
}: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // Generic fade helper: ramps audio.volume from current value to `target` over `duration` ms
  const fadeTo = useCallback(
    (target: number, duration: number, onComplete?: () => void) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (fadeFrameRef.current) cancelAnimationFrame(fadeFrameRef.current);

      const startVolume = audio.volume;
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        audio.volume = startVolume + (target - startVolume) * progress;

        if (progress < 1) {
          fadeFrameRef.current = requestAnimationFrame(step);
        } else {
          audio.volume = target;
          onComplete?.();
        }
      };

      fadeFrameRef.current = requestAnimationFrame(step);
    },
    []
  );

  // Initial mount: try to autoplay
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setNeedsInteraction(true);
      });
  }, [volume]);

  // Unlock autoplay on first interaction if browser blocked it
  useEffect(() => {
    if (!needsInteraction) return;

    const startOnInteraction = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setNeedsInteraction(false);
        })
        .catch(() => {});
    };

    window.addEventListener('click', startOnInteraction);
    window.addEventListener('keydown', startOnInteraction);
    window.addEventListener('touchstart', startOnInteraction);

    return () => {
      window.removeEventListener('click', startOnInteraction);
      window.removeEventListener('keydown', startOnInteraction);
      window.removeEventListener('touchstart', startOnInteraction);
    };
  }, [needsInteraction]);

  // Fade out -> restart from 0:00 -> fade in, whenever the route changes
  useEffect(() => {
    // Skip on initial mount, only react to actual navigation
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    fadeTo(0, fadeDuration, () => {
      audio.pause();
      audio.currentTime = 0;

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          fadeTo(volume, fadeDuration);
        })
        .catch(() => {
          // Autoplay might get blocked again on some browsers after restart
          setNeedsInteraction(true);
        });
    });
  }, [pathname, fadeDuration, fadeTo, volume]);

  // Clean up any in-flight fade animation on unmount
  useEffect(() => {
    return () => {
      if (fadeFrameRef.current) cancelAnimationFrame(fadeFrameRef.current);
    };
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
  };

  return (
    <>
      <audio ref={audioRef} src={src} loop={loop} preload="auto" />
      <button
        onClick={toggleMute}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          padding: '8px 12px',
          borderRadius: 8,
          border: 'none',
          background: '#222',
          color: '#fff',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        {isPlaying ? '🔊 Mute' : '▶ Play'}
      </button>
    </>
  );
}