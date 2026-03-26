import React from "react"
import { Phone, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Person {
  id: string
  name: string
  email: string
  phone: string
  category: string
  location: string
  gender: string
  avatar?: string
}

interface PeopleTableProps {
  people?: Person[]
  title?: string
}

const PeopleTable: React.FC<PeopleTableProps> = ({
  title = "People",
  people = [
    {
      id: "1",
      name: "Robert Fox",
      email: "robertfox@example.com",
      phone: "(671) 555-0110",
      category: "Employee",
      location: "Austin",
      gender: "Male",
    },
    {
      id: "2",
      name: "Cody Fisher",
      email: "codyfisher@example.com",
      phone: "(505) 555-0125",
      category: "Customers",
      location: "Orange",
      gender: "Male",
    },
    {
      id: "3",
      name: "Albert Flores",
      email: "albertflores@example.com",
      phone: "(704) 555-0127",
      category: "Customers",
      location: "Palmerston",
      gender: "Female",
    },
    {
      id: "4",
      name: "Floyd Miles",
      email: "floydmiles@example.com",
      phone: "(402) 555-0128",
      category: "Employee",
      location: "Fairfield",
      gender: "Male",
    },
    {
      id: "5",
      name: "Arlene McCoy",
      email: "arlenemccoy@example.com",
      phone: "(219) 555-0114",
      category: "Partners",
      location: "Toledo",
      gender: "Female",
    },
  ],
}) => {
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "employee":
        return "bg-purple-100 text-purple-800"
      case "customers":
        return "bg-blue-100 text-blue-800"
      case "partners":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">{title}</h3>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-gray-600">Name</TableHead>
            <TableHead className="text-gray-600">Email</TableHead>
            <TableHead className="text-gray-600">Phone</TableHead>
            <TableHead className="text-gray-600">Category</TableHead>
            <TableHead className="text-gray-600">Location</TableHead>
            <TableHead className="text-gray-600">Gender</TableHead>
            <TableHead className="text-gray-600">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((person) => (
            <TableRow key={person.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={person.avatar} />
                    <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-900">
                    {person.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {person.email}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {person.phone}
              </TableCell>
              <TableCell>
                <Badge className={getCategoryColor(person.category)}>
                  {person.category}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {person.location}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {person.gender === "Male" ? "♂" : "♀"} {person.gender}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon-sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default PeopleTable
