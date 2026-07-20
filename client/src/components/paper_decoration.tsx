import { useEffect, useState } from 'react';

const PAW_COLOR = '#BEB6AA';
const SAKURA_COLOR = '#E8B7C2';

export function PaperDecoration() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* 左下猫爪 */}
      <svg
        className="absolute"
        style={{
          left: 260,
          bottom: 240,
          width: 90,
          height: 90,
          color: PAW_COLOR,
          opacity: 0.13,
          transform: 'rotate(-20deg)',
        }}
        viewBox="0 0 200 200"
        fill="none"
      >
        <ellipse cx="100" cy="125" rx="42" ry="35" fill="currentColor" />
        <circle cx="55" cy="75" r="18" fill="currentColor" />
        <circle cx="90" cy="55" r="18" fill="currentColor" />
        <circle cx="130" cy="55" r="18" fill="currentColor" />
        <circle cx="160" cy="75" r="18" fill="currentColor" />
      </svg>

      {/* 右上樱花 */}
      <svg
        className="absolute"
        style={{
          right: 170,
          top: 100,
          width: 120,
          height: 120,
          color: SAKURA_COLOR,
          opacity: 0.12,
          transform: 'rotate(20deg)',
        }}
        viewBox="0 0 200 200"
      >
        <g fill="currentColor">
          <ellipse cx="100" cy="45" rx="28" ry="42" />
          <ellipse cx="45" cy="100" rx="42" ry="28" />
          <ellipse cx="155" cy="100" rx="42" ry="28" />
          <ellipse cx="100" cy="155" rx="28" ry="42" />
        </g>
        <circle cx="100" cy="100" r="18" fill="#E8B4C1" />
      </svg>

      {/* 花瓣 */}
      <Petals />
    </div>
  );
}

function Petals() {
  const petals = [
    { right: 300, top: 180, rotate: 25, delay: 0 },
    { left: 260, top: 300, rotate: -40, delay: 3 },
    { right: 500, bottom: 200, rotate: 60, delay: 7 },
  ];

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(30deg); }
          50% { transform: translateY(30px) rotate(80deg); }
        }
      `}</style>
      {petals.map((p, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            width: 12,
            height: 18,
            background: SAKURA_COLOR,
            opacity: 0.12,
            borderRadius: '100% 0 100% 100%',
            right: p.right,
            top: p.top,
            left: p.left,
            bottom: p.bottom,
            transform: `rotate(${p.rotate}deg)`,
            animation: `float 12s ${p.delay}s infinite ease-in-out`,
          }}
        />
      ))}
    </>
  );
}
