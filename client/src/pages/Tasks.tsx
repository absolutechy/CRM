import { useState, useMemo, useCallback } from "react"
import TaskHeader, { type ViewType } from "@/components/pages/tasks/TaskHeader"
import Column from "@/components/pages/tasks/Column"
import TaskCard, { type TaskType } from "@/components/pages/tasks/TaskCard"

// Static dummy data defined outside the component to prevent recreation on re-renders
const INITIAL_TASKS: TaskType[] = [
  { id: "1", title: "Design Landing Page", description: "Create wireframes and mockups for the new landing page.", priority: "High", status: "todo" },
  { id: "2", title: "Setup Project Repository", description: "Initialize Vite, React, and Tailwind CSS.", priority: "Medium", status: "done" },
  { id: "3", title: "Implement Authentication", description: "Add login and signup pages using JWT.", priority: "High", status: "in-progress" },
  { id: "4", title: "Write API Documentation", description: "Document all the endpoints using Swagger.", priority: "Low", status: "todo" },
  { id: "5", title: "Fix Header Bug", description: "Header is overlapping with the content on mobile sizes.", priority: "High", status: "in-progress" },
  { id: "6", title: "Optimize DB Queries", description: "Reduce load time for dashboard analytics.", priority: "High", status: "todo" },
]

const Tasks = () => {
  const [view, setView] = useState<ViewType>("kanban")

  // Wrap handler in useCallback so it maintains referential equality when passed to memoized TaskHeader
  const handleViewChange = useCallback((newView: ViewType) => {
    setView(newView)
  }, [])

  // Memoizing filtered tasks prevents full-array loops on every render (e.g. if we add other state later)
  const { todoTasks, inProgressTasks, doneTasks } = useMemo(() => {
    return {
      todoTasks: INITIAL_TASKS.filter(task => task.status === "todo"),
      inProgressTasks: INITIAL_TASKS.filter(task => task.status === "in-progress"),
      doneTasks: INITIAL_TASKS.filter(task => task.status === "done"),
    }
  }, [])

  return (
    <div className="h-full flex flex-col p-6 space-y-2 max-w-full">
      <TaskHeader currentView={view} onViewChange={handleViewChange} />

      <div className="flex-1 overflow-x-auto pb-4">
        {view === "kanban" ? (
          <div className="flex gap-6 h-full items-start">
            <Column title="To Do" count={todoTasks.length}>
              {todoTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </Column>
            
            <Column title="In Progress" count={inProgressTasks.length}>
              {inProgressTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </Column>
            
            <Column title="Done" count={doneTasks.length}>
              {doneTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </Column>
          </div>
        ) : (
           <div className="flex flex-col items-center justify-center h-[400px] border rounded-lg bg-muted/10 text-muted-foreground border-dashed">
              <p>The {view} view is currently under construction.</p>
           </div>
        )}
      </div>
    </div>
  )
}

export default Tasks