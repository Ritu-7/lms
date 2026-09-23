import React from 'react'

const buttonVariants = {
  primary: 'bg-accent-blue text-white shadow-lg shadow-glow-blue hover:bg-accent-blue/90',
  secondary: 'bg-card-bg text-text-primary border border-card-border hover:bg-text-primary/5 hover:border-accent-blue/50',
  outline: 'bg-transparent text-text-primary border border-card-border hover:bg-text-primary/5 hover:border-accent-blue/50',
  ghost: 'bg-transparent text-text-secondary hover:bg-text-primary/5 hover:text-text-primary',
}

const Button = React.forwardRef(function Button(
  { as: Component = 'button', variant = 'primary', className = '', children, ...props },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={`interactive-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
})

export default Button
