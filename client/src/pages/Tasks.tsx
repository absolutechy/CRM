import { useState, useMemo, useCallback } from "react"
import TaskHeader, { type ViewType } from "@/components/pages/tasks/TaskHeader"
import Column from "@/components/pages/tasks/Column"
import TaskCard, { type TaskType } from "@/components/pages/tasks/TaskCard"
import TaskForm from "@/components/pages/tasks/TaskForm"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"

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
  const [tasks, setTasks] = useState<TaskType[]>(INITIAL_TASKS)
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Wait for new task creation
  const [taskTitle, setTaskTitle] = useState("")

  const openCreateTaskModal = useCallback(() => {
    setSelectedTask(null)
    setTaskTitle("")
    setIsModalOpen(true)
  }, [])

  const openEditTaskModal = useCallback((task: TaskType) => {
    setSelectedTask(task)
    setTaskTitle(task.title || "")
    setIsModalOpen(true)
  }, [])

  const closeTaskModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedTask(null)
  }, [])

  // Wrap handler in useCallback so it maintains referential equality when passed to memoized TaskHeader
  const handleViewChange = useCallback((newView: ViewType) => {
    setView(newView)
  }, [])

  const handleDropTask = useCallback((taskId: string, newStatus: TaskType["status"]) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }, [])

  // Memoizing filtered tasks prevents full-array loops on every render (e.g. if we add other state later)
  const { todoTasks, inProgressTasks, doneTasks } = useMemo(() => {
    return {
      todoTasks: tasks.filter(task => task.status === "todo"),
      inProgressTasks: tasks.filter(task => task.status === "in-progress"),
      doneTasks: tasks.filter(task => task.status === "done"),
    }
  }, [tasks])

  return (
    <div className="h-full flex flex-col space-y-2 max-w-full">
      <TaskHeader currentView={view} onViewChange={handleViewChange} />

      <div className="flex-1 overflow-x-auto p-8">
        {view === "kanban" ? (
          <div className="flex gap-6 h-full items-start">
            <Column title="To Do" status="todo" count={todoTasks.length} onDropTask={handleDropTask} onAddClick={openCreateTaskModal}>
              {todoTasks.map(task => (
                <TaskCard key={task.id} task={task} onClick={openEditTaskModal} />
              ))}
            </Column>
            
            <Column title="In Progress" status="in-progress" count={inProgressTasks.length} onDropTask={handleDropTask} onAddClick={openCreateTaskModal}>
              {inProgressTasks.map(task => (
                <TaskCard key={task.id} task={task} onClick={openEditTaskModal} />
              ))}
            </Column>
            
            <Column title="Done" status="done" count={doneTasks.length} onDropTask={handleDropTask} onAddClick={openCreateTaskModal}>
              {doneTasks.map(task => (
                <TaskCard key={task.id} task={task} onClick={openEditTaskModal} />
              ))}
            </Column>
          </div>
        ) : (
           <div className="flex flex-col items-center justify-center h-[400px] border rounded-lg bg-muted/10 text-muted-foreground border-dashed">
              <p>The {view} view is currently under construction.</p>
           </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeTaskModal}
        title={
          <Input 
            value={taskTitle}
            onChange={(e) => {
              setTaskTitle(e.target.value)
            }}
            placeholder="Task Title (e.g. Monthly Product Discussion)"
            className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0 rounded-none w-full text-left placeholder:font-normal placeholder:text-gray-400"
          />
        }
      >
        <TaskForm 
          initialData={selectedTask}
          onSave={(data) => {
            if (selectedTask) {
              // Edit mode
              setTasks(prev => prev.map(t => t.id === selectedTask.id ? { 
                ...t, 
                title: taskTitle || "Untitled Task",
                description: data.description || "",
                priority: data.priority || "Medium",
                status: data.status || "todo",
                member: data.member,
                dueDate: data.dueDate,
                checklists: data.checklists,
                comments: data.comments,
                attachments: data.attachments,
              } : t));
            } else {
              // Create mode
              const newTask = {
                id: Date.now().toString(),
                title: taskTitle || "Untitled Task",
                description: data.description || "",
                priority: data.priority || "Medium",
                status: data.status || "todo",
                member: data.member,
                dueDate: data.dueDate,
                checklists: data.checklists,
                comments: data.comments,
                attachments: data.attachments,
              };
              setTasks(prev => [...prev, newTask]);
            }
            closeTaskModal();
          }}
          onCancel={closeTaskModal}
        />
      </Modal>

    </div>
  )
}

export default Tasks