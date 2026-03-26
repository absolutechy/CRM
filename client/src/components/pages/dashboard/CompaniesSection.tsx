import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import type { PieSectorShapeProps } from "recharts/types/polar/Pie"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip } from "recharts"
import {
  ChartContainer,
} from "@/components/ui/chart"

interface Company {
  id: string
  name: string
  industry: string
  location: string
  status: "active" | "lead"
  logo?: string
}

interface CompanyCategory {
  name: string
  count: number
  percentage: number
  color: string
}

interface CompaniesSectionProps {
  companies?: Company[]
  categories?: CompanyCategory[]
  title?: string
}

const CompaniesSection: React.FC<CompaniesSectionProps> = ({
  title = "Companies",
  companies = [
    {
      id: "1",
      name: "Product Hunt",
      industry: "Web Design",
      location: "New York City, NY",
      status: "active",
    },
    {
      id: "2",
      name: "Google",
      industry: "Search Engine",
      location: "New York City, NY",
      status: "active",
    },
    {
      id: "3",
      name: "Wordpress",
      industry: "Web Development",
      location: "New York City, NY",
      status: "active",
    },
    {
      id: "4",
      name: "Tripadvisor",
      industry: "Travel Reviews",
      location: "New York City, NY",
      status: "lead",
    },
    {
      id: "5",
      name: "Slack",
      industry: "Communication",
      location: "New York City, NY",
      status: "lead",
    },
  ],
  categories = [
    { name: "Agency", count: 0, percentage: 56, color: "#000" },
    { name: "Marketing", count: 0, percentage: 30, color: "#d3d3d3" },
    { name: "Communication", count: 0, percentage: 8, color: "#a9a9a9" },
    { name: "Web Development", count: 0, percentage: 6, color: "#808080" },
    { name: "Travel", count: 0, percentage: 0, color: "#696969" },
  ],
}) => {
  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-orange-100 text-orange-800"
  }

  const ACTIVE_INDEX = 0

  // Transform categories data for pie chart
  const pieData = categories.map((cat) => ({
    name: cat.name,
    value: cat.percentage,
    color: cat.color,
  }))

  const chartConfig = {
    categories: {
      label: "Categories",
    },
  }

  // Custom tooltip for pie chart
  const CustomTooltip = (props: any) => {
    const { active, payload } = props
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {payload[0].name}
          </p>
          <p className="text-sm text-gray-600">{payload[0].value}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* Companies Table and Chart - Side by side */}
      <div className="flex gap-6">
        {/* Table - Left side */}
        <div className="flex-1 rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Sort by
              </Button>
              <Button variant="outline" size="sm">
                Filter
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-600">Companies Name</TableHead>
                <TableHead className="text-gray-600">Industry</TableHead>
                <TableHead className="text-gray-600">Location</TableHead>
                <TableHead className="text-gray-600">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                        {company.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {company.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {company.industry}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {company.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(company.status)}>
                      {company.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pie Chart - Right side */}
        <div className="w-80 rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">
            Company Categories
          </h4>

          {/* Chart with center text overlay */}
          <div className="relative mx-auto overflow-visible">
            <ChartContainer
              config={chartConfig}
              className="mx-auto overflow-visible"
              style={{ height: "250px", width: "100%" }}
            >
              <ResponsiveContainer width="100%" height="100%" debounce={500}>
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }} >
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={false}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={0}
                    dataKey="value"
                    label={false}
                    isAnimationActive={false}
                    shape={({
                      index,
                      outerRadius = 0,
                      ...props
                    }: PieSectorShapeProps) =>
                      index === ACTIVE_INDEX ? (
                        <Sector {...props} outerRadius={outerRadius + 10} />
                      ) : (
                        <Sector {...props} outerRadius={outerRadius} />
                      )
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Center text - absolutely positioned */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-gray-900">341</p>
              <p className="text-xs text-gray-500">Companies</p>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 space-y-2">
            {categories.map((category, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color as string }}
                  />
                  <span className="font-medium text-gray-700">
                    {category.name}
                  </span>
                </div>
                <span className="text-gray-600">{category.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompaniesSection
