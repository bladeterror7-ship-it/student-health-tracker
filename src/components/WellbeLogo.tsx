import { APP_LOGO_ALT, APP_LOGO_SRC } from '../lib/appBrand'

const sizeClass = {
  sm: 'h-11 max-w-[180px]',
  md: 'h-14 max-w-[240px]',
  lg: 'h-20 max-w-[300px]',
  hero: 'h-44 max-w-[min(100%,420px)] sm:h-52',
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
      width={420}
      height={160}
      decoding="async"
      className={`w-auto object-contain object-center ${sizeClass[size]} ${className}`.trim()}
    />
  )
}
