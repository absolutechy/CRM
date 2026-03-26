import React from "react"
import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AgendaItem {
  id: string
  title: string
  time: string
  description: string
  status: "completed" | "pending" | "in-progress"
}

interface UpcomingAgendaProps {
  items?: AgendaItem[]
}

const UpcomingAgenda: React.FC<UpcomingAgendaProps> = ({
  items = [
    {
      id: "1",
      title: "Meeting with Client",
      time: "10:00 - 10:30",
      description: "Sync monthly progress agendas",
      status: "completed",
    },
    {
      id: "2",
      title: "Meeting with Client",
      time: "14:00 - 14:30",
      description: "Sync monthly progress agendas",
      status: "in-progress",
    },
    {
      id: "3",
      title: "Meeting with Client",
      time: "16:00 - 16:30",
      description: "Sync monthly progress agendas",
      status: "pending",
    },
    {
      id: "4",
      title: "Meeting with Client",
      time: "17:00 - 18:00",
      description: "Sync monthly progress agendas",
      status: "pending",
    },
  ],
}) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">
        Upcoming Agenda
      </h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-4 border-b border-gray-100 pb-4 last:border-0"
          >
            <div className="rounded-full bg-gray-100 p-2">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-500">{item.description}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">{item.time}</span>
                <Badge className={`capitalize ${getStatusStyles(item.status)}`}>
                  {item.status === "in-progress" ? "In Progress" : item.status}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UpcomingAgenda
