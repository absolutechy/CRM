import { memo } from "react"
import { Button } from "@/components/ui/button"
import { List, SquareKanban, Table as TableIcon, ArrowUpDown, Filter, Plus } from "lucide-react"

export type ViewType = "list" | "kanban" | "table"

interface TaskHeaderProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

const TaskHeader = memo(({ currentView, onViewChange }: TaskHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6">
      {/* Left side: Heading + View Toggles */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <h2 className="text-2xl font-bold tracking-tight">Tasks Page</h2>
        
        <div className="flex items-center bg-muted/50 p-1 rounded-md border overflow-hidden">
          <Button 
            variant={currentView === "list" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => onViewChange("list")}
            className="h-8 px-3 rounded-sm transition-all"
          >
            <List className="w-4 h-4 mr-2" /> List
          </Button>
          <Button 
            variant={currentView === "kanban" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => onViewChange("kanban")}
            className="h-8 px-3 rounded-sm transition-all"
          >
            <SquareKanban className="w-4 h-4 mr-2" /> Kanban
          </Button>
          <Button 
            variant={currentView === "table" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => onViewChange("table")}
            className="h-8 px-3 rounded-sm transition-all"
          >
            <TableIcon className="w-4 h-4 mr-2" /> Table
          </Button>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="h-9">
          <ArrowUpDown className="w-4 h-4 mr-2" /> Sort By
        </Button>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </Button>
        <Button size="sm" className="h-9">
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>
    </div>
  )
})

TaskHeader.displayName = "TaskHeader"
export default TaskHeader
