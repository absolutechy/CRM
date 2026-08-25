import { useState, useCallback, useEffect } from "react"
import TaskHeader, { type ViewType } from "@/components/pages/tasks/TaskHeader"
import Column from "@/components/pages/tasks/Column"
import TaskCard, { type TaskType } from "@/components/pages/tasks/TaskCard"
import TaskForm from "@/components/pages/tasks/TaskForm"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import ConfirmDeleteModal from "@/components/pages/contacts/ConfirmDeleteModal"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  changeTaskStatus,
  createTask,
  deleteTask,
  fetchTasks,
  selectTasksByStatus,
  selectTasksStatus,
  updateTask,
} from "@/store/tasksSlice"
import type { TaskPriority, TaskStatus } from "@/types/crm"
import { TASK_STATUSES, TASK_STATUS_LABEL } from "@/types/crm"

/** What TaskForm hands back on save. */
interface TaskFormData {
  description?: string
  member?: string
  dueDate?: string
  priority?: TaskPriority
  status?: TaskStatus
  checklists?: TaskType["checklists"]
  comments?: TaskType["comments"]
  attachments?: TaskType["attachments"]
}

const Tasks = () => {
  const dispatch = useAppDispatch()
  const columns = useAppSelector(selectTasksByStatus)
  const status = useAppSelector(selectTasksStatus)

  const [view, setView] = useState<ViewType>("kanban")
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState("")
  // Which column the new task should land in — set by that column's + button.
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("todo")
  const [isSaving, setIsSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<TaskType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    dispatch(fetchTasks())
  }, [dispatch])

  const openCreateTaskModal = useCallback((status: TaskStatus = "todo") => {
    setSelectedTask(null)
    setTaskTitle("")
    setNewTaskStatus(status)
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

  const handleViewChange = useCallback((newView: ViewType) => {
    setView(newView)
  }, [])

  const handleDropTask = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      dispatch(changeTaskStatus({ id: taskId, status: newStatus }))
    },
    [dispatch]
  )

  const handleSave = async (data: TaskFormData) => {
    setIsSaving(true)
    try {
      // The form's "member" select carries a user id, or "unassigned".
      const assigneeId =
        !data.member || data.member === "unassigned" ? null : data.member

      const shared = {
        title: taskTitle.trim() || "Untitled Task",
        description: data.description ?? "",
        priority: data.priority ?? "Medium",
        status: data.status ?? newTaskStatus,
        assigneeId,
        dueDate: data.dueDate,
        checklists: data.checklists ?? [],
        comments: data.comments ?? [],
        attachments: data.attachments ?? [],
      }

      if (selectedTask) {
        await dispatch(updateTask({ id: selectedTask.id, changes: shared }))
      } else {
        await dispatch(
          createTask({
            ...shared,
            contactId: null,
            leadId: null,
            dealId: null,
          })
        )
      }
    } finally {
      setIsSaving(false)
      closeTaskModal()
    }
  }

  return (
    <div className="h-full flex flex-col space-y-2 max-w-full">
      <TaskHeader
        currentView={view}
        onViewChange={handleViewChange}
        onAddTask={openCreateTaskModal}
      />

      <div className="flex-1 overflow-x-auto p-8">
        {status === "loading" &&
        Object.values(columns).every((arr) => arr.length === 0) ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-border bg-surface text-sm text-muted-foreground">
            Loading tasks…
          </div>
        ) : view === "kanban" ? (
          <div className="flex gap-6 h-full items-start">
            {TASK_STATUSES.map((taskStatus) => (
              <Column
                key={taskStatus}
                title={TASK_STATUS_LABEL[taskStatus]}
                status={taskStatus}
                count={columns[taskStatus].length}
                onDropTask={handleDropTask}
                onAddClick={() => openCreateTaskModal(taskStatus)}
              >
                {columns[taskStatus].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={openEditTaskModal}
                    onEdit={openEditTaskModal}
                    onDelete={setPendingDelete}
                  />
                ))}
              </Column>
            ))}
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
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Task Title (e.g. Monthly Product Discussion)"
            className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0 rounded-none w-full text-left placeholder:font-normal placeholder:text-muted-foreground"
          />
        }
      >
        <TaskForm
          initialData={selectedTask}
          onSave={handleSave}
          onCancel={closeTaskModal}
          isSaving={isSaving}
        />
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        isLoading={isDeleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return
          setIsDeleting(true)
          try {
            await dispatch(deleteTask(pendingDelete.id))
          } finally {
            setIsDeleting(false)
            setPendingDelete(null)
          }
        }}
        title="Delete task"
        description={`Delete "${pendingDelete?.title}"? This cannot be undone.`}
      />
    </div>
  )
}

export default Tasks
