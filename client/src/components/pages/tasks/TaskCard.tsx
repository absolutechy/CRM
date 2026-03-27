import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface TaskType {
  id: string
  title: string
  description: string
  priority: "Low" | "Medium" | "High"
  status: "todo" | "in-progress" | "done"
}

interface TaskCardProps {
  task: TaskType
}

// Pure function hoisted outside component 
const getPriorityBadgeVariant = (priority: TaskType["priority"]) => {
  switch (priority) {
    case "High": return "destructive"
    case "Medium": return "default"
    case "Low": return "secondary"
    default: return "outline"
  }
}

const TaskCard = memo(({ task }: TaskCardProps) => {
  return (
    <Card className="hover:border-primary/50 transition-colors cursor-grab active:cursor-grabbing bg-background shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium leading-none">
          {task.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 pb-3 text-sm text-muted-foreground line-clamp-2">
        {task.description}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Badge variant={getPriorityBadgeVariant(task.priority) as any} className="text-[10px] px-2 py-0.5 font-semibold">
          {task.priority}
        </Badge>
      </CardFooter>
    </Card>
  )
})

TaskCard.displayName = "TaskCard"
export default TaskCard
