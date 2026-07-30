"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Abstract, athletic hero visual — concentric "track" arcs, motion trails and a
 * moving spark. Purely decorative (aria-hidden). Fully static when the user
 * prefers reduced motion.
 */
export function AthleticVisual({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none relative mx-auto aspect-[4/3] w-full max-w-sm",
        className,
      )}
    >
      <svg
        viewBox="0 0 400 300"
        fill="none"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Track arcs */}
        <g className="text-primary" stroke="currentColor" strokeLinecap="round">
          {[70, 100, 130, 160].map((r, i) => (
            <motion.circle
              key={r}
              cx={200}
              cy={150}
              r={r}
              strokeOpacity={0.18 + i * 0.05}
              strokeWidth={2}
              strokeDasharray={`${Math.PI * r * 0.55} ${Math.PI * r}`}
              initial={false}
              animate={reduce ? undefined : { rotate: 360 }}
              transition={
                reduce
                  ? undefined
                  : {
                      duration: 26 - i * 4,
                      repeat: Infinity,
                      ease: "linear",
                    }
              }
              style={{ transformOrigin: "200px 150px" }}
            />
          ))}
        </g>

        {/* Motion / speed lines */}
        <g className="text-accent" stroke="currentColor" strokeLinecap="round">
          {[0, 1, 2].map((i) => (
            <motion.line
              key={i}
              x1={60}
              y1={110 + i * 40}
              x2={150}
              y2={110 + i * 40}
              strokeWidth={4}
              strokeOpacity={0.5 - i * 0.1}
              initial={false}
              animate={reduce ? undefined : { x1: [60, 40, 60], opacity: [0.5, 0.2, 0.5] }}
              transition={
                reduce
                  ? undefined
                  : { duration: 2.4 + i * 0.4, repeat: Infinity, ease: "easeInOut" }
              }
            />
          ))}
        </g>

        {/* Central emblem */}
        <circle cx={200} cy={150} r={34} className="fill-primary/10" />
        <motion.circle
          cx={200}
          cy={150}
          r={12}
          className="fill-primary"
          initial={false}
          animate={reduce ? undefined : { scale: [1, 1.15, 1] }}
          transition={
            reduce ? undefined : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
          }
          style={{ transformOrigin: "200px 150px" }}
        />

        {/* Orbiting spark on the outer track */}
        {!reduce && (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "200px 150px" }}
          >
            <circle cx={200} cy={20} r={6} className="fill-accent" />
          </motion.g>
        )}
      </svg>
    </div>
  );
}
