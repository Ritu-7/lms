import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Star, Trophy } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';

const AnimatedNumber = ({ end, duration = 2, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

  useEffect(() => {
    if (inView) {
      let start = 0;
      const endVal = parseFloat(end.replace(/,/g, ''));
      if (start === endVal) return;

      const incrementTime = (duration / endVal) * 1000;
      const step = endVal / (duration * 60); 

      let current = start;
      const timer = setInterval(() => {
        current += step;
        if (current >= endVal) {
          setCount(endVal);
          clearInterval(timer);
        } else {
          setCount(Math.ceil(current));
        }
      }, 1000 / 60);

      return () => clearInterval(timer);
    }
  }, [inView, end, duration]);

  // Format the number back with commas if it had them, or k/m suffixes
  const formattedCount = count > 999 && !end.includes('k') ? count.toLocaleString() : count;
  const finalDisplay = end.includes('k') ? `${(count / 1000).toFixed(count % 1000 !== 0 ? 1 : 0)}k` : formattedCount;
  
  return <span ref={ref}>{finalDisplay}{suffix}</span>;
};

const StatsSection = () => {
  const stats = [
    { id: 1, label: 'Active Learners', value: '25,000', suffix: '+', icon: Users, accent: 'blue' },
    { id: 2, label: 'Expert Courses', value: '1,200', suffix: '+', icon: BookOpen, accent: 'emerald' },
    { id: 3, label: 'Average Rating', value: '4.9', suffix: '/5', icon: Star, accent: 'amber' },
    { id: 4, label: 'Career Transitions', value: '15,000', suffix: '+', icon: Trophy, accent: 'purple' },
  ];

  const getColorClass = (accent) => {
    switch(accent) {
      case 'blue': return 'text-accent-blue bg-accent-blue/10';
      case 'emerald': return 'text-accent-emerald bg-accent-emerald/10';
      case 'amber': return 'text-amber-500 bg-amber-500/10';
      case 'purple': return 'text-accent-purple bg-accent-purple/10';
      default: return 'text-accent-blue bg-accent-blue/10';
    }
  };

  return (
    <section className="py-16 md:py-24 bg-bg-primary transition-colors duration-500 relative overflow-hidden border-y border-card-border">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="flex flex-col items-center text-center group"
            >
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-lg ${getColorClass(stat.accent)}`}>
                <stat.icon className="w-7 h-7 md:w-8 md:h-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold font-space-grotesk text-text-primary mb-2 tracking-tight transition-colors">
                <AnimatedNumber end={stat.value} suffix={stat.suffix} />
              </h3>
              <p className="text-sm md:text-base font-medium text-text-secondary transition-colors uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
