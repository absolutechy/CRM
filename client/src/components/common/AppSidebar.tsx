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
  UserPlus,
  Building2,
  TrendingUp,
  Activity,
  Megaphone,
  Workflow,
  CheckSquare,
  FolderOpen,
  Mail,
} from "lucide-react"
import { Link, useLocation } from "react-router"
import Logo from "@/assets/img/common/logo-new.png"
import Favicon from "@/assets/img/common/favicon.png"

const menuItems = [
  { title: "Leads", icon: UserPlus, url: "/leads" },
  { title: "Contacts", icon: Users, url: "/contacts" },
  { title: "Companies", icon: Building2, url: "/companies" },
  { title: "Deals", icon: TrendingUp, url: "/deals" },
  { title: "Activity", icon: Activity, url: "/activities" },
  { title: "Campaigns", icon: Megaphone, url: "/campaigns" },
  { title: "Automations", icon: Workflow, url: "/automations" },
  { title: "Tasks", icon: CheckSquare, url: "/tasks" },
  // Notes is hidden — customer notes now live on the interaction timeline.
  // The /notes route still resolves, so existing local data isn't stranded.
  { title: "Documents", icon: FolderOpen, url: "/documents" },
  // Messages is hidden for now. The /messages route still resolves, and
  // message history remains visible on each contact's interaction timeline.
  { title: "Emails", icon: Mail, url: "/email" },
  // Calendar is hidden until it has a route and a page to land on.
]

const AppSidebar: React.FC = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { pathname } = useLocation()

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
              <Link to="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
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
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  // Keep the nav item lit on nested routes (e.g. /contacts/ct1).
                  isActive={
                    pathname === item.url ||
                    pathname.startsWith(`${item.url}/`)
                  }
                  tooltip={item.title}
                  // Resting colour comes from --sidebar-foreground and hover
                  // from --sidebar-accent (primary-50); the active item steps up
                  // to primary-100 + primary-700 so the two stay distinguishable
                  // on a light rail.
                  className="data-active:bg-primary-100 data-active:font-semibold data-active:text-primary-700"
                >
                  <Link to={item.url} className="flex items-center gap-3">
                    <item.icon className="h-5! w-5!" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
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
