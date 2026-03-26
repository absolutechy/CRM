import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { HelpCircle, ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { SidebarTrigger } from "../ui/sidebar"

const AppHeader: React.FC = () => {
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4">
      {/* Left - Sidebar Trigger & Search Input */}
      <div className="flex flex-1 items-center gap-4">
        <SidebarTrigger />
        <Input type="search" placeholder="Search..." className="max-w-md" />
      </div>

      {/* Right - Help Center & User Avatar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          <span>Help Center</span>
        </Button>

        <div className="flex items-center gap-2 py-2">
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <span className="text-sm">John Doe</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    </header>
  )
}

export default AppHeader
