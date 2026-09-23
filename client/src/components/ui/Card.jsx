import React from 'react'

const cardVariants = {
  default: 'bg-card-bg border-card-border shadow-sm',
  interactive: 'bg-card-bg border-card-border shadow-sm hover:border-accent-blue/50',
  highlighted: 'bg-card-bg border-accent-blue shadow-glow-blue/20 hover:border-accent-blue hover:shadow-glow-blue/50',
}

const Card = React.forwardRef(function Card(
  { as: Component = 'div', variant = 'default', className = '', children, ...props },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={`interactive-card rounded-2xl border p-5 ${cardVariants[variant]} ${variant !== 'default' ? 'hover:scale-[1.02]' : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
})

export default Card
