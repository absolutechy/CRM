import { CalendarDays, ListFilter, Paperclip, MessageSquareMore, MoreHorizontal } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate } from "@/lib/crm"
import { cn } from "@/lib/utils"
import type { Task } from "@/types/crm"

/** The canonical task record, re-exported so existing imports keep working. */
export type TaskType = Task

interface TaskCardProps {
  task: TaskType
  onClick?: (task: TaskType) => void
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", task.id)
    // Optional: Add some effect styling during drag
  }

  const isOverdue =
    !!task.dueDate &&
    task.status !== "done" &&
    new Date(task.dueDate).getTime() < Date.now()

  const checklistItems = task.checklists.flatMap((c) => c.items)
  const checklistTotal = checklistItems.length
  const checklistDone = checklistItems.filter((i) => i.completed).length

  return (
    <Card 
      className="border-border border rounded p-0 cursor-grab active:cursor-grabbing hover:border-black/20 transition-colors" 
      style={{ boxShadow: "none" }} 
      draggable={true}
      onDragStart={handleDragStart}
      onClick={() => onClick?.(task)}
    >
      <CardContent className="p-4 ">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 pt-1">
            <Badge 
              variant="outline" 
              className="px-1.5 py-1 font-normal text-[12px] border-none text-(--internal) bg-(--internal-bg) rounded"
            >
              Internal
            </Badge>
            <Badge 
              variant="outline" 
              className="px-1.5 py-1 font-normal text-[12px] border-none text-(--marketing) bg-(--marketing-bg) rounded"
            >
              Marketing
            </Badge>
            <Badge 
              variant="outline" 
              className="px-1.5 py-1 font-normal text-[12px] border-none text-(--urgent) bg-(--urgent-bg) rounded"
            >
              Urgent
            </Badge>
          </div>
          <button className="text-muted-foreground -mt-1 hover:text-muted-foreground">
            <MoreHorizontal size={20} strokeWidth={2.5} />
          </button>
        </div>
        <h2 className="text-sm font-semibold text-foreground mb-6">
          {task.title}
        </h2>
        <div className="flex items-center justify-between mb-6 text-muted-foreground text-sm">
          <div className="flex items-center gap-3">
            <CalendarDays size={20} strokeWidth={1.5} className="mt-px" />
            <span className={cn(isOverdue && "font-medium text-error-strong")}>
              {task.dueDate ? formatDate(task.dueDate) : "No due date"}
            </span>
          </div>
          {checklistTotal > 0 && (
            <div className="flex items-center gap-3">
              <ListFilter size={20} strokeWidth={1.5} />
              <span className="font-medium text-muted-foreground tabular-nums">
                {checklistDone}/{checklistTotal}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          
          {/* Stacked Avatars */}
          <div className="flex -space-x-2 items-center">
            {[1, 2, 3, 4].map((user) => (
              <Avatar key={user} className="w-6 h-6 ring-2 ring-white rounded-full">
                {/* Use real image URLs for avatars or mock */}
                <AvatarImage src={`https://i.pravatar.cc/48?u=${user}`} />
                <AvatarFallback className="bg-muted text-sm">UA</AvatarFallback>
              </Avatar>
            ))}
          </div>

          {/* Interaction Icons & Counts */}
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1.5">
              {/* Paperclip icon often rotates for this look */}
              <Paperclip size={20} strokeWidth={1.5} className="rotate-[-45deg]" />
              <span className="font-medium text-muted-foreground">5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquareMore size={20} strokeWidth={1.5} className="-scale-x-100 mt-px" />
              <span className="font-medium text-muted-foreground">19</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}