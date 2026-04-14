import { motion } from "framer-motion";
import { useMemo } from "react";

const hexPath = "M25 0L50 14.43V43.3L25 57.74L0 43.3V14.43L25 0Z";

const HoneycombBackground = () => {
  const honeycombs = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: (i % 6) * 18 + Math.random() * 10,
        y: Math.floor(i / 6) * 25 + Math.random() * 10,
        size: 40 + (i % 3) * 25,
        duration: 10 + (i % 5) * 3,
        delay: (i % 7) * 1.2,
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
            opacity: [0.12, 0.35, 0.12],
            y: [0, -40, 0],
            rotate: [0, 8, -4, 0],
            scale: [1, 1.05, 1],
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
            fill="hsl(38, 73%, 40%)"
            fillOpacity="0.06"
            stroke="hsl(38, 73%, 40%)"
            strokeWidth="1.5"
            strokeOpacity="0.35"
          />
        </motion.svg>
      ))}
    </div>
  );
};

export default HoneycombBackground;
