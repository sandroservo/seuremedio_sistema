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
    <div className={cn('flex items-center gap-3', className)}>
      {/* Ícone da Pílula */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full',
          'bg-gradient-to-br from-[#F97316] to-[#FBBF24]',
          'shadow-lg shadow-orange-500/25',
          sizeClasses[size]
        )}
      >
        {/* Cruz médica */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-1/2 h-1/2 text-white"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        
        {/* Linhas de velocidade */}
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          <div className="w-3 h-0.5 bg-[#FBBF24] rounded-full" />
          <div className="w-2 h-0.5 bg-[#FBBF24] rounded-full opacity-75" />
          <div className="w-1.5 h-0.5 bg-[#FBBF24] rounded-full opacity-50" />
        </div>
      </div>

      {/* Texto */}
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
