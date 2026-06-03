import { APP_LOGO_ALT, APP_LOGO_SRC } from '../lib/appBrand'

const sizeClass = {
  sm: 'h-8 max-w-[140px]',
  md: 'h-12 max-w-[200px]',
  lg: 'h-16 max-w-[260px]',
  hero: 'h-28 max-w-[min(100%,320px)] sm:h-32',
} as const

type WellbeLogoProps = {
  size?: keyof typeof sizeClass
  className?: string
}

export default function WellbeLogo({ size = 'md', className = '' }: WellbeLogoProps) {
  return (
    <img
      src={APP_LOGO_SRC}
      alt={APP_LOGO_ALT}
      width={320}
      height={120}
      decoding="async"
      className={`w-auto object-contain object-center ${sizeClass[size]} ${className}`.trim()}
    />
  )
}
