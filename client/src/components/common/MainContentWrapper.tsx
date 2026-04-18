import { type ReactNode } from 'react'

const MainContentWrapper = ({ children, classname }: { children?: ReactNode, classname?: string}) => {
  return (
    <div className={`px-8 py-6 ${classname || ''}`}>
        {children}
    </div>
  )
}

export default MainContentWrapper
