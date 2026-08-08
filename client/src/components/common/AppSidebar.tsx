import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Users,
  CheckSquare,
  FileText,
  MessageSquare,
  Mail,
  Calendar,
} from "lucide-react"
import Logo from "@/assets/img/common/logo-new.png"
import Favicon from "@/assets/img/common/favicon.png"

const menuItems = [
  { title: "Contacts", icon: Users, url: "/contacts" },
  { title: "Tasks", icon: CheckSquare, url: "/tasks" },
  { title: "Notes", icon: FileText, url: "/notes" },
  { title: "Messages", icon: MessageSquare, url: "/messages" },
  { title: "Emails", icon: Mail, url: "/emails" },
  { title: "Calendar", icon: Calendar, url: "/calendar" },
]

const AppSidebar: React.FC = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar className="py-4" collapsible="icon" {...props}>
      <SidebarHeader className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="cursor-default hover:bg-transparent active:bg-transparent group-data-[collapsible=icon]:size-auto! group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:p-0!"
            >
              <a href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <img
                  src={Favicon}
                  alt="Logo"
                  className="hidden size-12 shrink-0 rounded-md object-contain group-data-[collapsible=icon]:block"
                />
                <img
                  src={Logo}
                  alt="Brand"
                  className="h-18 w-auto object-contain group-data-[collapsible=icon]:hidden"
                />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="flex items-center gap-3 ">
                    <item.icon className="h-6! w-6!" />
                    <span className="text-lg">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
