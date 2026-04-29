import clsx from 'clsx'
export default function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-8 h-8 border-[3px]' }
  return (
    <div className={clsx(
      'rounded-full border-surface-5 border-t-brand-500 animate-spin',
      sizes[size], className
    )} />
  )
}
