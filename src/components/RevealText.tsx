// AI辅助生成： [你的AI模型] , 2026-04-02
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function RevealText({ text, delay = 0 }: { text: string; delay?: number }) {
  const ref = useRef(null);
  // useInView: 当元素进入视口（once: true 表示只触发一次）时触发动画
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    // 外层容器：充当切片蒙版（水面）
    <div ref={ref} style={{ overflow: 'hidden', display: 'inline-block', verticalAlign: 'bottom' }}>
      <motion.span
        style={{ display: 'inline-block' }}
        initial={{ y: "100%" }} // 初始状态：沉在水底（被隐藏）
        animate={isInView ? { y: 0 } : { y: "100%" }} // 进入视口时：浮出水面
        transition={{
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1], // 这个贝塞尔曲线非常关键，它是实现视频里那种“大厂丝滑感”的核心
          delay: delay
        }}
      >
        {text}
      </motion.span>
    </div>
  );
}