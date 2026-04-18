import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Paperclip, Send, ChevronUp, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type TaskType } from "./TaskCard"

interface TaskFormProps {
  initialData?: TaskType | null;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export default function TaskForm({ initialData, onSave, onCancel }: TaskFormProps) {
  const [description, setDescription] = useState("")
  const [comment, setComment] = useState("")
  const [checklists, setChecklists] = useState<{ id: string, title: string, items: { id: string, text: string, completed: boolean }[] }[]>([])
  const [attachments, setAttachments] = useState<{ name: string, url: string, type: string }[]>([])
  
  const [member, setMember] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("todo");
  const [commentsList, setCommentsList] = useState<{ id: string, text: string, timestamp: string }[]>([])

  // Track if changes have been made from the original initial data
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description || "");
      setPriority(initialData.priority || "Medium");
      setMember(initialData.member || "");
      setDueDate(initialData.dueDate || "");
      setStatus(initialData.status || "todo");
      setChecklists(initialData.checklists || []);
      setCommentsList(initialData.comments || []);
      setAttachments(initialData.attachments || []);
      setHasChanges(false);
    }
  }, [initialData])

  // Track changes whenever inputs update if we are editing an existing task
  useEffect(() => {
    if (initialData) {
      const isChanged = 
        description !== (initialData.description || "") ||
        priority !== (initialData.priority || "Medium") ||
        member !== (initialData.member || "") ||
        dueDate !== (initialData.dueDate || "") ||
        status !== (initialData.status || "todo") ||
        JSON.stringify(checklists) !== JSON.stringify(initialData.checklists || []) ||
        JSON.stringify(commentsList) !== JSON.stringify(initialData.comments || []) ||
        JSON.stringify(attachments) !== JSON.stringify(initialData.attachments || []);

      setHasChanges(isChanged);
    }
  }, [description, priority, member, dueDate, status, checklists, commentsList, attachments, initialData])

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments = Array.from(e.target.files).map(file => ({
        name: file.name,
        url: URL.createObjectURL(file), // For local preview before actual server upload
        type: file.type
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    
    const newComment = {
      id: Date.now().toString(),
      text: comment.trim(),
      timestamp: new Date().toISOString()
    };
    
    setCommentsList(prev => [newComment, ...prev]);
    setComment("");
  };

  const addChecklist = () => {
    setChecklists([
      ...checklists,
      { id: Date.now().toString(), title: "New Checklist", items: [] }
    ])
  }

  const addChecklistItem = (checklistId: string) => {
    setChecklists(prev => prev.map(c => {
      if (c.id === checklistId) {
        return {
          ...c,
          items: [...c.items, { id: Date.now().toString(), text: "", completed: false }]
        }
      }
      return c
    }))
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 text-gray-800 h-full pb-14">
      {/* Left Column (Main Content) */}
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <label className="font-semibold block mb-2">Description</label>
          <textarea 
            className="w-full min-h-[100px] bg-transparent border-none outline-none resize-none placeholder:text-gray-400"
            placeholder="Add a more detailed description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Checklists */}
        <div className="flex flex-col gap-6">
          {checklists.map((checklist) => (
            <div key={checklist.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2 flex-1 mr-4">
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                  <Input 
                    value={checklist.title} 
                    className="font-semibold px-0 border-transparent shadow-none h-auto py-1 focus-visible:border-gray-300 focus-visible:ring-0 rounded-sm"
                    onChange={(e) => setChecklists(prev => prev.map(c => c.id === checklist.id ? { ...c, title: e.target.value } : c))}
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setChecklists(prev => prev.filter(c => c.id !== checklist.id))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-col gap-2 ml-6">
                {checklist.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 w-full mr-4">
                      <input 
                        type="checkbox" 
                        checked={item.completed}
                        onChange={(e) => {
                          setChecklists(prev => prev.map(c => c.id === checklist.id ? {
                            ...c,
                            items: c.items.map(i => i.id === item.id ? { ...i, completed: e.target.checked } : i)
                          } : c))
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0"
                      />
                      <Input 
                        value={item.text} 
                        placeholder="Checklist item..."
                        className="flex-1 px-2 border-transparent shadow-none h-8 text-sm focus-visible:border-gray-200 focus-visible:ring-0"
                        onChange={(e) => {
                          setChecklists(prev => prev.map(c => c.id === checklist.id ? {
                            ...c,
                            items: c.items.map(i => i.id === item.id ? { ...i, text: e.target.value } : i)
                          } : c))
                        }}
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                      onClick={() => setChecklists(prev => prev.map(c => c.id === checklist.id ? {
                        ...c,
                        items: c.items.filter(i => i.id !== item.id)
                      } : c))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-max text-gray-500 hover:text-gray-900 justify-start px-2 mt-1"
                  onClick={() => addChecklistItem(checklist.id)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </div>
              <hr className="my-2" />
            </div>
          ))}
          
          <Button variant="outline" className="w-full h-10 border-gray-300 font-medium" onClick={addChecklist}>
            <Plus className="w-4 h-4 mr-2" /> Add New Checklist
          </Button>
        </div>

        {/* Attachments */}
        <div className="flex flex-col gap-4 mt-4">
          <label className="font-semibold block text-[15px]">Attachments</label>
          
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {attachments.map((file, i) => (
                <div key={i} className="relative w-24 h-24 border border-gray-200 rounded-md bg-gray-50 flex flex-col items-center justify-center overflow-hidden group">
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <Paperclip className="h-8 w-8 text-gray-400 mb-1" />
                      <div className="px-1 w-full text-center">
                         <p className="truncate text-[10px] text-gray-600 font-medium">{file.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white hover:text-red-400 hover:bg-transparent" 
                      onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <label className="flex border border-dashed border-gray-300 rounded bg-gray-50/50 p-6 items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors group">
            <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
              <Paperclip className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">Click to Add Attachment</span>
            </div>
            <Input type="file" multiple className="hidden" onChange={handleAttachmentUpload} />
          </label>
        </div>

        {/* Comment Box */}
        <div className="mt-4 relative z-0">
          <Input 
            className="w-full h-[52px] pl-4 pr-16 bg-white border-gray-300"
            placeholder="Add Your Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600" onClick={handleAddComment}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Activity */}
        <div className="mt-6 flex items-center justify-between">
          <h3 className="font-semibold text-[15px]">Activity</h3>
          <Button variant="outline" size="sm" className="h-8 text-gray-600 font-medium z-0">
            Hide Activity Details
          </Button>
        </div>
        <div className="flex flex-col gap-6 mt-2">
          {commentsList.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">No activity yet.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {commentsList.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs font-medium">
                    U
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-sm">You</span>
                      <span className="text-xs text-gray-500">
                        {new Date(c.timestamp).toLocaleDateString()} {new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="text-sm mt-1 bg-gray-50 p-3 rounded-md border text-gray-700">
                      {c.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column (Sidebar Settings) */}
      <div className="w-full lg:w-[280px] flex flex-col gap-8 shrink-0">
        
        {/* Members */}
        <div>
          <label className="font-medium text-[15px] block mb-2">Member</label>
          <Select value={member} onValueChange={setMember}>
            <SelectTrigger className="w-full h-9 bg-transparent border-gray-300">
              <SelectValue placeholder="Select Member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frank">Frank Edward</SelectItem>
              <SelectItem value="james">James Wong</SelectItem>
              <SelectItem value="sarah">Sarah Connor</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Due Date */}
        <div>
          <label className="font-medium text-[15px] block mb-2">Due Date</label>
          <Input 
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full h-9 border-gray-300"
          />
        </div>

        {/* Priority Labels */}
        <div>
          <label className="font-medium text-[15px] block mb-2">Priority Label</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-full h-9 bg-transparent border-gray-300">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div>
          <label className="font-medium text-[15px] block mb-2">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full h-9 bg-transparent border-gray-300">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 px-7 py-5 bg-white border-t w-full lg:col-span-2 lg:absolute bottom-0 right-0 rounded-b-2xl">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        {initialData ? (
          <Button 
            disabled={!hasChanges}
            onClick={() => onSave?.({ description, member, dueDate, priority, status, checklists, comments: commentsList, attachments })}
          >
            Save Changes
          </Button>
        ) : (
          <Button onClick={() => onSave?.({ description, member, dueDate, priority, status, checklists, comments: commentsList, attachments })}>Create Task</Button>
        )}
      </div>
    </div>
  )
}
