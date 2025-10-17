import React from 'react'
import { clsx } from 'clsx'

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'default' | 'small' | 'large'
}

export const Logo = React.forwardRef<SVGSVGElement, LogoProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const sizes = {
      small: 'h-8 w-8',
      default: 'h-12 w-12',
      large: 'h-16 w-16',
    }

    return (
      <svg
        ref={ref}
        className={clsx(sizes[variant], className)}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <rect width="100" height="100" rx="20" fill="#3B82F6" />
        <path
          d="M25 30h50v10H25V30zm0 15h50v10H25V45zm0 15h35v10H25V60z"
          fill="white"
        />
        <circle cx="75" cy="65" r="8" fill="#F59E0B" />
        <path
          d="M70 65h10M75 60v10"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }
)

Logo.displayName = 'Logo'
