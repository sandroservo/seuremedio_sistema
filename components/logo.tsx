/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Componente de Logo - Seu Remédio Delivery
 */

import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img 
        src="/images/logo.png" 
        alt="Seu Remédio Delivery" 
        className={cn(sizeClasses[size])}
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              'font-bold tracking-tight',
              'bg-gradient-to-r from-[#FBBF24] to-[#F97316] bg-clip-text text-transparent',
              textSizeClasses[size]
            )}
          >
            SEU REMÉDIO
          </span>
          <span
            className={cn(
              'text-[#FBBF24] tracking-[0.2em] font-medium',
              size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm'
            )}
          >
            DELIVERY
          </span>
        </div>
      )}
    </div>
  )
}

export function LogoIcon({ size = 'md', className }: Omit<LogoProps, 'showText'>) {
  return <Logo size={size} showText={false} className={className} />
}
