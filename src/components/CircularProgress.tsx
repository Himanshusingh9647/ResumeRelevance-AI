import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  showAnimation?: boolean;
}

export function CircularProgress({ 
  value, 
  size = 200, 
  strokeWidth = 12,
  showAnimation = true 
}: CircularProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayValue / 100) * circumference;
  
  const isSuccess = value >= 75;
  const isWarning = value >= 50 && value < 75;
  
  // Animate the counter
  useEffect(() => {
    if (!showAnimation) {
      setDisplayValue(value);
      return;
    }
    
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value, showAnimation]);

  const getGradientColors = () => {
    if (isSuccess) return { from: '#14b8a6', to: '#10b981' }; // teal-500 to emerald-500
    if (isWarning) return { from: '#f59e0b', to: '#f97316' }; // amber-500 to orange-500
    return { from: '#ef4444', to: '#f97316' }; // red-500 to orange-500
  };

  const colors = getGradientColors();

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Glow effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={cn(
          "absolute rounded-full blur-xl",
          isSuccess ? "bg-teal-500/30" : isWarning ? "bg-amber-500/30" : "bg-red-500/30"
        )}
        style={{ width: size * 0.8, height: size * 0.8 }}
      />

      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          filter="url(#glow)"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <div className="flex items-baseline justify-center">
            <span className={cn(
              "text-5xl font-bold",
              isSuccess ? "text-teal-600" : isWarning ? "text-amber-600" : "text-red-600"
            )}>
              {Math.round(displayValue)}
            </span>
            <span className={cn(
              "text-2xl font-semibold ml-1",
              isSuccess ? "text-teal-500" : isWarning ? "text-amber-500" : "text-red-500"
            )}>
              %
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">Match Score</p>
        </motion.div>
      </div>
    </div>
  );
}
