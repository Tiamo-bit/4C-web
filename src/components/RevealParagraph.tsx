import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

export default function RevealParagraph({ text }: { text: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  // 明确指定类型为 Variants
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.015,
      }
    }
  };

  // 明确指定类型为 Variants
  const child: Variants = {
    hidden: { y: "120%" },
    visible: {
      y: 0,
      transition: {
        duration: 0.8,
        // 使用 as const 将其锁定为严格的只读元组，完美解决 TS 报错
        ease: [0.16, 1, 0.3, 1] as const
      }
    }
  };

  const characters = Array.from(text);

  return (
    <motion.p
      ref={ref}
      variants={container}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      style={{
        lineHeight: 2,
        fontSize: '1.7rem',
        color: 'rgba(255, 247, 230, 0.92)',
        margin: 0,
        display: 'flex',
        flexWrap: 'wrap'
      }}
    >
      {characters.map((char, index) => (
        <span
          key={index}
          style={{
            overflow: 'hidden',
            display: 'inline-block',
            verticalAlign: 'bottom',
            paddingBottom: '2px'
          }}
        >
          <motion.span
            variants={child}
            style={{ display: 'inline-block', whiteSpace: 'pre' }}
          >
            {char}
          </motion.span>
        </span>
      ))}
    </motion.p>
  );
}