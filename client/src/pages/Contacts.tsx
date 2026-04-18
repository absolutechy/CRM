import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Search } from "lucide-react"
import PageHeader from '@/components/common/PageHeader'
import MainContentWrapper from '@/components/common/MainContentWrapper'

// Dummy data
const INITIAL_CONTACTS = [
  { id: 1, name: "Alice Smith", email: "alice@example.com", company: "Acme Corp", role: "CEO", status: "Active" },
  { id: 2, name: "Bob Jones", email: "bob@example.com", company: "Globex", role: "Developer", status: "Inactive" },
  { id: 3, name: "Charlie Brown", email: "charlie@example.com", company: "Initech", role: "Manager", status: "Active" },
  { id: 4, name: "Diana Prince", email: "diana@example.com", company: "Wayne Ent", role: "Designer", status: "Active" },
  { id: 5, name: "Evan Wright", email: "evan@example.com", company: "Stark Ind", role: "Engineer", status: "Pending" },
  { id: 6, name: "Fiona Gallagher", email: "fiona@example.com", company: "Acme Corp", role: "Sales", status: "Active" },
  { id: 7, name: "George Costanza", email: "george@example.com", company: "Vandelay", role: "Importer", status: "Inactive" },
  { id: 8, name: "Hannah Abbott", email: "hannah@example.com", company: "Hogwarts", role: "Student", status: "Active" },
]

type SortField = 'name' | 'email' | 'company' | 'role' | 'status';
type SortOrder = 'asc' | 'desc';

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Active': return 'default';
    case 'Inactive': return 'secondary';
    case 'Pending': return 'outline';
    default: return 'default';
  }
};

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

const companies = useMemo<string[]>(() => 
  ['all', ...Array.from(new Set(INITIAL_CONTACTS.map(c => c.company)))], 
  [INITIAL_CONTACTS] // Only recalculate if the raw data changes
);

const roles = useMemo<string[]>(() => 
  ['all', ...Array.from(new Set(INITIAL_CONTACTS.map(c => c.role)))], 
  [INITIAL_CONTACTS]
);

const statuses = useMemo<string[]>(() => 
  ['all', ...Array.from(new Set(INITIAL_CONTACTS.map(c => c.status)))], 
  [INITIAL_CONTACTS]
);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

const filteredAndSortedContacts = useMemo(() => {
  // 2. Pre-process search query once
  const query = searchQuery.toLowerCase().trim();

  // 3. Chain filtering and sorting efficiently
  const filtered = INITIAL_CONTACTS.filter(contact => {
    const matchesRole = filterRole === 'all' || contact.role === filterRole;
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus;
    const matchesCompany = filterCompany === 'all' || contact.company === filterCompany;
    
    // Short-circuit: if basic filters fail, don't bother with expensive string search
    if (!matchesRole || !matchesStatus || !matchesCompany) return false;

    if (!query) return true;

    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.company.toLowerCase().includes(query)
    );
  });

  // 4. Optimized Sort
  return filtered.sort((a, b) => {
    const aVal = String(a[sortField]).toLowerCase();
    const bVal = String(b[sortField]).toLowerCase();
    
    const comparison = aVal.localeCompare(bVal);
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}, [searchQuery, filterRole, filterStatus, filterCompany, sortField, sortOrder]);

  return (
    <>
     <PageHeader />
     <MainContentWrapper classname='space-y-8 px-8'>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterCompany} onValueChange={setFilterCompany}>
            <SelectTrigger className="w-35">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map(company => (
                <SelectItem key={company} value={company}>
                  {company === 'all' ? 'All Companies' : company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-35">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-35">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('name')} className="px-0 font-semibold hover:bg-transparent">
                  Name <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('email')} className="px-0 font-semibold hover:bg-transparent">
                  Email <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('company')} className="px-0 font-semibold hover:bg-transparent">
                  Company <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('role')} className="px-0 font-semibold hover:bg-transparent">
                  Role <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('status')} className="px-0 font-semibold hover:bg-transparent">
                  Status <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No contacts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.company}</TableCell>
                  <TableCell>{contact.role}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(contact.status) as any}>
                      {contact.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
     </MainContentWrapper>
    </>
  )
}

export default Contacts