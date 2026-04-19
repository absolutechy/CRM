import { type ReactNode } from 'react'

const MainContentWrapper = ({ children, className }: { children?: ReactNode, className?: string}) => {
  return (
    <div className={`px-8 py-6 ${className || ''}`}>
        {children}
    </div>
  )
}

export default MainContentWrapper
