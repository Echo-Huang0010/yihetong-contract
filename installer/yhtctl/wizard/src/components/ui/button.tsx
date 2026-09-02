import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger'; icon?: ReactNode }

export function Button({ variant = 'primary', icon, className = '', children, ...props }: Props) {
  return <button className={`button button-${variant} ${className}`} {...props}>{icon}{children}</button>
}
