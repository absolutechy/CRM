import { Button } from "@/components/ui/button"
import { Dot } from "lucide-react"
import { memo, type ReactNode, useState } from "react"

import type { TaskStatus } from "@/types/crm"

interface ColumnProps {
  title: string
  status: TaskStatus
  count: number
  children: ReactNode
  onDropTask: (taskId: string, newStatus: TaskStatus) => void
  onAddClick?: (status: TaskStatus) => void
}

/** Keyed by status rather than title so renaming a column can't break it. */
const DOT_COLOR: Record<TaskStatus, string> = {
  backlog: "text-muted-foreground",
  todo: "text-info",
  "in-progress": "text-warning",
  done: "text-success",
}

const Column = memo(({ title, status, count, children, onDropTask, onAddClick }: ColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const dotColor = DOT_COLOR[status];

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData("text/plain")
    if (taskId) {
      onDropTask(taskId, status)
    }
  }

  return (
    <div 
      className={`flex flex-col rounded-[8px] border p-4 w-full min-w-[300px] max-w-[350px] shrink-0 transition-colors ${isDragOver ? "border-blue-500 bg-blue-50/30" : "hover:border-black/20"}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center mb-4">
        <Dot strokeWidth={7} className={dotColor} />
        <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
        <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium text-muted-foreground ml-2">
          {count} {title === "Done" ? (count === 1 ? "task done" : "tasks done") : (count === 1 ? "open task" : "open tasks")}
        </span>
      </div>

      <Button 
        variant="ghost"
        className="bg-[#F2F2F2] hover:bg-[#e4e4e4] text-black text-base rounded py-5! my-3 shrink-0"
        onClick={() => onAddClick && onAddClick(status)}
      >
        + Create Task
      </Button>
      
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
})

Column.displayName = "Column"
export default Column
