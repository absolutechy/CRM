import { memo, type ReactNode,  } from "react"

interface ColumnProps {
  title: string
  count: number
  children: ReactNode
}

const Column = memo(({ title, count, children }: ColumnProps) => {
  return (
    <div className="flex flex-col bg-muted/40 rounded-xl border p-4 w-full min-w-[300px] max-w-[350px] shrink-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
        <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium text-muted-foreground mr-1">
          {count}
        </span>
      </div>
      
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
})

Column.displayName = "Column"
export default Column
