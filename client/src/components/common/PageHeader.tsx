import { type ReactNode } from 'react'
import { useLocation } from 'react-router'

const PageHeader = ({ children }: { children?: ReactNode }) => {
  const location = useLocation()
  
  const pathSegment = location.pathname.split('/').filter(Boolean).pop() || 'dashboard'
  const title = pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1)

  return (
    <div className="px-8 h-14 flex items-center gap-4 sm:gap-6 mb-0 border-b border-[#d9d9d9]">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {children}
    </div>
  )
}

export default PageHeader
