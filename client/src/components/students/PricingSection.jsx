import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Card from '../ui/Card';

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Basic",
      description: "Perfect for beginners exploring new skills",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: ["Access to 50+ free courses", "Basic community access", "Standard support", "Course completion certificates"],
      recommended: false,
      buttonText: "Get Started Free",
      buttonLink: "/course-list"
    },
    {
      name: "Pro",
      description: "Everything you need to accelerate your career",
      monthlyPrice: 29,
      yearlyPrice: 290, // 2 months free
      features: ["Unlimited access to all courses", "Exclusive Pro-only content", "Priority mentor support", "Interactive projects & assessments", "Offline viewing"],
      recommended: true,
      buttonText: "Start Pro Trial",
      buttonLink: "/signup"
    },
    {
      name: "Enterprise",
      description: "Custom solutions for teams and organizations",
      monthlyPrice: 99,
      yearlyPrice: 990,
      features: ["Everything in Pro", "Team analytics & reporting", "Dedicated success manager", "Custom learning paths", "API access"],
      recommended: false,
      buttonText: "Contact Sales",
      buttonLink: "/contact"
    }
  ];

  return (
    <section className="py-24 bg-bg-primary transition-colors duration-500">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold font-space-grotesk text-text-primary transition-colors"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-text-secondary transition-colors"
          >
            Invest in your future with our flexible learning plans.
          </motion.p>
          
          {/* Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center mt-8 gap-4"
          >
            <span className={`text-sm font-semibold transition-colors ${!isYearly ? 'text-text-primary' : 'text-text-secondary'}`}>Monthly</span>
            <button 
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              aria-label={`Switch to ${isYearly ? 'monthly' : 'annual'} billing`}
              aria-pressed={isYearly}
              className="interactive-button relative w-16 h-8 rounded-full bg-card-bg border border-card-border p-1 shadow-inner flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
            >
              <motion.div 
                animate={{ x: isYearly ? 32 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-6 h-6 rounded-full bg-accent-blue shadow-sm"
              />
            </button>
            <span className={`text-sm font-semibold flex items-center gap-2 transition-colors ${isYearly ? 'text-text-primary' : 'text-text-secondary'}`}>
              Annually
              <span className="px-2 py-1 rounded-full bg-accent-emerald/10 text-accent-emerald text-xs font-bold">Save 20%</span>
            </span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <Card
              as={motion.div}
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              variant={plan.recommended ? 'highlighted' : 'interactive'}
              className={`group relative flex flex-col p-8 rounded-3xl hover:scale-[1.03] focus-within:scale-[1.03] ${
                plan.recommended 
                  ? 'border-accent-blue shadow-glow-blue/20 hover:shadow-glow-blue/50' 
                  : 'border-card-border'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-text-primary mb-2 transition-colors">{plan.name}</h3>
                <p className="text-sm text-text-secondary h-10 transition-colors">{plan.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-bold font-space-grotesk text-text-primary transition-colors">
                  ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                {plan.monthlyPrice > 0 && (
                  <span className="text-text-secondary font-medium transition-colors">
                    / {isYearly ? 'year' : 'month'}
                  </span>
                )}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${plan.recommended ? 'text-accent-blue' : 'text-accent-emerald'}`} />
                    <span className="text-sm text-text-secondary transition-colors">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                as={Link}
                to={plan.buttonLink}
                variant={plan.recommended ? 'primary' : 'secondary'}
                aria-label={`${plan.buttonText} with the ${plan.name} plan`}
                className="w-full py-4 rounded-xl font-bold"
              >
                {plan.buttonText}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
