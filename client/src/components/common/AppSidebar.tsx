import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { 
  Users, 
  CheckSquare, 
  FileText, 
  MessageSquare, 
  Mail, 
  Calendar 
} from "lucide-react"
import Logo from "@/assets/img/common/Logo.png"

const menuItems = [
  { title: "Contacts", icon: Users, url: "/contacts" },
  { title: "Tasks", icon: CheckSquare, url: "/tasks" },
  { title: "Notes", icon: FileText, url: "/notes" },
  { title: "Messages", icon: MessageSquare, url: "/messages" },
  { title: "Emails", icon: Mail, url: "/emails" },
  { title: "Calendar", icon: Calendar, url: "/calendar" },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <img src={Logo} alt="Logo" className="w-28" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}