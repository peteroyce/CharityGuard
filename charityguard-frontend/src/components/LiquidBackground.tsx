import React, { useEffect, useRef } from 'react';

type Props = {
  blobCount?: number;
  speed?: number;          // 0.5–2
  maxRadius?: number;      // px at 1x DPR
  opacity?: number;        // 0.2–1
};

/**
 * Full-screen liquid canvas using additive radial blobs.
 * - DPR-aware, resize-aware, reduced-motion friendly
 * - Grayscale palette to match pro UI
 */
const LiquidBackground: React.FC<Props> = ({
  blobCount = 14,
  speed = 1,
  maxRadius = 220,
  opacity = 0.85
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const blobsRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number; r: number; shade: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: true })!;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DPR = Math.max(1, window.devicePixelRatio || 1);

    const setSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      // initialize blobs
      const count = blobCount;
      const arr: typeof blobsRef.current = [];
      for (let i = 0; i < count; i++) {
        const r = (0.5 + Math.random()) * maxRadius;
        arr.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() * 0.6 - 0.3) * speed,
          vy: (Math.random() * 0.6 - 0.3) * speed,
          r,
          shade: Math.floor(90 + Math.random() * 80) // 90–170 lightness
        });
      }
      blobsRef.current = arr;
    };

    const draw = () => {
      const w = canvas.width / DPR;
      const h = canvas.height / DPR;

      // deep gray background wash
      ctx.fillStyle = '#0b0c0f';
      ctx.fillRect(0, 0, w, h);

      // additive composition for liquid look
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = opacity;

      for (const b of blobsRef.current) {
        const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        // grayscale gradient core → rim
        grd.addColorStop(0, `rgba(${b.shade}, ${b.shade}, ${b.shade}, 0.85)`);
        grd.addColorStop(0.5, `rgba(${b.shade - 20}, ${b.shade - 20}, ${b.shade - 20}, 0.45)`);
        grd.addColorStop(1, 'rgba(40,40,44,0.0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();

        // motion
        b.x += b.vx;
        b.y += b.vy;

        // bounce softly at edges
        if (b.x < -b.r * 0.25 || b.x > w + b.r * 0.25) b.vx *= -1;
        if (b.y < -b.r * 0.25 || b.y > h + b.r * 0.25) b.vy *= -1;
      }

      // reset composition
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      rafRef.current = requestAnimationFrame(draw);
    };

    setSize();
    window.addEventListener('resize', setSize);

    if (!prefersReducedMotion) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      // static if reduced motion
      ctx.fillStyle = '#0b0c0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      window.removeEventListener('resize', setSize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [blobCount, speed, maxRadius, opacity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        filter: 'blur(8px) contrast(105%)',  // soften & unify
        pointerEvents: 'none',
        background: '#0b0c0f'
      }}
    />
  );
};

export default LiquidBackground;