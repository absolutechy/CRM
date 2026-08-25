import { useEffect } from "react"
import { useNavigate } from "react-router"
import { Bell, HelpCircle, ChevronDown, LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { SidebarTrigger } from "../ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { logout, selectCurrentUser } from "@/store/authSlice"
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  selectAllNotifications,
  selectUnreadCount,
} from "@/store/notificationsSlice"

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

const AppHeader: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const notifications = useAppSelector(selectAllNotifications)
  const unread = useAppSelector(selectUnreadCount)

  useEffect(() => {
    dispatch(fetchNotifications())
    dispatch(fetchUnreadCount())
  }, [dispatch])

  const handleLogout = async () => {
    await dispatch(logout())
    navigate("/login", { replace: true })
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
      {/* Left - Sidebar Trigger & Search Input */}
      <div className="flex flex-1 items-center gap-4">
        <SidebarTrigger />
        <Input type="search" placeholder="Search..." className="max-w-md" />
      </div>

      {/* Right - Notifications, Help & User Menu */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unread > 0 && (
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => dispatch(markAllNotificationsRead())}
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex flex-col items-start gap-0.5"
                  onSelect={() => {
                    if (!n.readAt) dispatch(markNotificationRead(n.id))
                  }}
                >
                  <span className="flex w-full items-center justify-between gap-2 text-sm font-medium">
                    {n.title}
                    {!n.readAt && (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </span>
                  <span className="w-full text-xs text-muted-foreground">
                    {n.body}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          <span>Help Center</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
              <Avatar>
                <AvatarFallback>{user ? initials(user.name) : "?"}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{user?.name ?? "Unknown"}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {user?.name}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {user?.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={handleLogout}
              className="cursor-pointer"
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default AppHeader
