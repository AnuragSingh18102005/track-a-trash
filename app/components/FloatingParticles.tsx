"use client"

import { motion } from "framer-motion"
import { Trash2, Leaf, Recycle, TreePine, Zap } from "lucide-react"
import { useState } from "react"

export default function FloatingParticles() {
  const [hoveredParticle, setHoveredParticle] = useState<number | null>(null)

  const particles = [
    { Icon: Trash2, delay: 0, color: "text-teal-400/30" },
    { Icon: Leaf, delay: 2, color: "text-emerald-400/30" },
    { Icon: Recycle, delay: 4, color: "text-green-400/30" },
    { Icon: TreePine, delay: 6, color: "text-emerald-500/30" },
    { Icon: Zap, delay: 8, color: "text-teal-500/30" },
    { Icon: Trash2, delay: 10, color: "text-cyan-400/30" },
    { Icon: Leaf, delay: 12, color: "text-lime-400/30" },
    { Icon: Recycle, delay: 14, color: "text-teal-300/30" },
  ]

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle, index) => {
        const Icon = particle.Icon
        const isHovered = hoveredParticle === index

        return (
          <motion.div
            key={index}
            className={`absolute ${particle.color} cursor-pointer pointer-events-auto`}
            style={{
              left: `${10 + ((index * 12) % 80)}%`,
              top: `${10 + ((index * 15) % 70)}%`,
            }}
            animate={{
              y: isHovered ? [-30, 30, -30] : [-20, 20, -20],
              x: isHovered ? [-15, 15, -15] : [-10, 10, -10],
              rotate: isHovered ? [0, 180, 360] : [0, 360],
              opacity: isHovered ? [0.3, 0.8, 0.3] : [0.1, 0.4, 0.1],
              scale: isHovered ? [1, 1.5, 1] : [1, 1.2, 1],
            }}
            transition={{
              duration: isHovered ? 4 : 8 + Math.random() * 4,
              repeat: Number.POSITIVE_INFINITY,
              delay: particle.delay,
              ease: "easeInOut",
            }}
            onHoverStart={() => setHoveredParticle(index)}
            onHoverEnd={() => setHoveredParticle(null)}
            whileHover={{
              scale: 1.8,
              rotate: 180,
              transition: { duration: 0.3 },
            }}
          >
            <Icon size={24 + Math.random() * 16} />
            {isHovered && (
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400/20 to-emerald-400/20 blur-xl"
                initial={{ scale: 0 }}
                animate={{ scale: 2 }}
                exit={{ scale: 0 }}
              />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
