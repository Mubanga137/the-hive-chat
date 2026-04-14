import { motion } from "framer-motion";
import { useMemo } from "react";

const hexPath = "M25 0L50 14.43V43.3L25 57.74L0 43.3V14.43L25 0Z";

interface Props {
  color?: string; // hex color for stroke/fill
}

const ThemedHoneycombBackground = ({ color = "hsl(38, 73%, 40%)" }: Props) => {
  const honeycombs = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: (i % 7) * 16 + Math.random() * 8,
        y: Math.floor(i / 7) * 25 + Math.random() * 8,
        size: 35 + (i % 4) * 22,
        duration: 12 + (i % 5) * 3,
        delay: (i % 8) * 1.1,
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {honeycombs.map((h) => (
        <motion.svg
          key={h.id}
          width={h.size}
          height={h.size * 1.155}
          viewBox="0 0 50 57.74"
          className="absolute"
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
          animate={{
            opacity: [0.08, 0.25, 0.08],
            y: [0, -35, 0],
            rotate: [0, 6, -3, 0],
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: h.duration,
            delay: h.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d={hexPath}
            fill={color}
            fillOpacity="0.06"
            stroke={color}
            strokeWidth="1.2"
            strokeOpacity="0.25"
          />
        </motion.svg>
      ))}
    </div>
  );
};

export default ThemedHoneycombBackground;
