// GitHub 风格的确定性像素头像：从 seed 字符串生成稳定的 5×5 镜像方块图案
const PALETTE = [
  '#D88A9A',
  '#8FA9C7',
  '#B87D4A',
  '#6B9E78',
  '#9B7FAE',
  '#C77B5E',
  '#5E8B7E',
  '#B5A27D',
];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Identicon({ seed, size = 40, className = "" }: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const rand = mulberry32(hashString(seed));
  const color = PALETTE[Math.floor(rand() * PALETTE.length)];
  const cell = size / 5;
  const cells: React.ReactNode[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      if (rand() > 0.5) {
        cells.push(
          <rect key={`${row}-${col}`} x={col * cell} y={row * cell} width={cell} height={cell} fill={color} />
        );
        const mirror = 4 - col;
        if (mirror !== col) {
          cells.push(
            <rect key={`${row}-${mirror}`} x={mirror * cell} y={row * cell} width={cell} height={cell} fill={color} />
          );
        }
      }
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
      style={{ borderRadius: '9999px', flexShrink: 0 }}
    >
      <rect width={size} height={size} fill="rgba(216,138,154,0.12)" />
      {cells}
    </svg>
  );
}
