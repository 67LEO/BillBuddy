import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

export default function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1.5 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px 100px 0px' });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const numericValue = typeof value === 'string'
      ? parseInt(value.replace(/[^0-9]/g, ''), 10) || 0
      : value;

    if (numericValue === 0) {
      setDisplayValue(0);
      return;
    }

    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * numericValue));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="tabular-nums"
    >
      {prefix}{displayValue.toLocaleString('en-IN')}{suffix}
    </motion.span>
  );
}
