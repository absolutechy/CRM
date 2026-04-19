import React, { useState, useEffect } from 'react'
import PageHeader from '../components/common/PageHeader'
import { Button } from '../components/ui/button'
import { Plus, Trash2, Bold, Italic, Strikethrough, List, ListOrdered, Quote, Heading2, Undo, Redo } from 'lucide-react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import MainContentWrapper from '@/components/common/MainContentWrapper'

interface Note {
  id: string
  title: string
  content: string
  updatedAt: Date
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50 rounded-t-md">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-muted' : ''}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-muted' : ''}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'bg-muted' : ''}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-muted' : ''}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-muted' : ''}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'bg-muted' : ''}
      >
        <Quote className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface EditorProps {
  note: Note
  onUpdate: (content: string, title: string) => void
}

const NoteEditor = ({ note, onUpdate }: EditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: note.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const textNode = editor.getText()
      const firstLine = textNode.split('\n')[0].trim()
      const title = firstLine.length > 0 ? firstLine.substring(0, 40) : 'Untitled Note'
      onUpdate(html, title)
    },
  })

  useEffect(() => {
    if (editor && editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content)
    }
  }, [note.id, editor])

  return (
    <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
      <MenuBar editor={editor} />
      <div className="flex-1 overflow-y-auto p-6 prose prose-sm sm:prose-base max-w-none dark:prose-invert focus-visible:outline-none">
        <EditorContent editor={editor} className="min-h-full outline-none" />
      </div>
    </div>
  )
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('crm-notes')
    if (saved) {
      return JSON.parse(saved).map((n: any) => ({ ...n, updatedAt: new Date(n.updatedAt) }))
    }
    return [
      { id: '1', title: 'Welcome to Notes', content: '<p>This is a default note. Select it to start editing!</p>', updatedAt: new Date() }
    ]
  })
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes.length > 0 ? notes[0].id : null)

  const activeNote = notes.find(n => n.id === activeNoteId)

  useEffect(() => {
    localStorage.setItem('crm-notes', JSON.stringify(notes))
  }, [notes])

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '<p></p>',
      updatedAt: new Date()
    }
    setNotes([newNote, ...notes])
    setActiveNoteId(newNote.id)
  }

  const deleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const newNotes = notes.filter(n => n.id !== id)
    setNotes(newNotes)
    if (activeNoteId === id) {
      setActiveNoteId(newNotes.length > 0 ? newNotes[0].id : null)
    }
  }

  const handleNoteUpdate = (content: string, title: string) => {
    setNotes(prev => prev.map(note => 
      note.id === activeNoteId 
        ? { ...note, content, title, updatedAt: new Date() } 
        : note
    ))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)]">
      <PageHeader>
        <div className="ml-auto">
          <Button onClick={createNote} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
      </PageHeader>
      
      <MainContentWrapper className="flex flex-1 overflow-hidden gap-3">
        {/* Sidebar List */}
        <div className="w-1/3 md:w-80 border-r bg-muted/20 flex flex-col overflow-y-auto border rounded-md">
          {notes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No notes yet. Create one to get started.
            </div>
          ) : (
            <div className="divide-y">
              {notes.map(note => (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors group relative ${activeNoteId === note.id ? 'bg-muted/80' : ''}`}
                >
                  <h3 className="font-medium text-sm truncate pr-8">{note.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.updatedAt.toLocaleDateString()}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => deleteNote(e, note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-background">
          {activeNoteId && activeNote ? (
            <NoteEditor note={activeNote} onUpdate={handleNoteUpdate} />
          ) : (
             <div className="flex-1 flex items-center justify-center text-muted-foreground">
               Select or create a note
             </div>
          )}
        </div>
        </MainContentWrapper>
    </div>
  )
}

export default Notes