import { memo } from "react"
import { Button } from "@/components/ui/button"
import {
  List,
  SquareKanban,
  Table as TableIcon,
  ArrowUpDown,
  Filter,
  Plus,
} from "lucide-react"
import PageHeader from "@/components/common/PageHeader"

export type ViewType = "list" | "kanban" | "table"

interface TaskHeaderProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

const TaskHeader = memo(({ currentView, onViewChange }: TaskHeaderProps) => {
  return (
    <PageHeader>
      <div className="flex flex-col w-full gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left side: Heading + View Toggles */}
        <div className="flex items-center gap-1 overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange("list")}
            className={`h-8 rounded-none border-0 border-b-3 px-3 py-7 transition-all hover:bg-transparent ${currentView === "list" ? "border-primary" : "border-transparent text-muted-foreground"}`}
          >
            <List className="mr-2 h-4 w-4" /> List
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange("kanban")}
            className={`h-8 rounded-none border-0 border-b-3 px-3 py-7 transition-all hover:bg-transparent ${currentView === "kanban" ? "border-primary" : "border-transparent text-muted-foreground"}`}
          >
            <SquareKanban className="mr-2 h-4 w-4" /> Kanban
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange("table")}
            className={`h-8 rounded-none border-0 border-b-3 px-3 py-7 transition-all hover:bg-transparent ${currentView === "table" ? "border-primary" : "border-transparent text-muted-foreground"}`}
          >
            <TableIcon className="mr-2 h-4 w-4" /> Table
          </Button>
        </div>
        {/* Right side: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <ArrowUpDown className="mr-2 h-4 w-4" /> Sort By
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button size="sm" className="h-9">
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
      </div>
    </PageHeader>
  )
})

TaskHeader.displayName = "TaskHeader"
export default TaskHeader
