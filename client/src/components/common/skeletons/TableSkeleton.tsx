import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"

interface TableSkeletonProps {
  /** Number of visible columns, so cells line up under the real headers. */
  columnCount: number
  rowCount?: number
}

/**
 * Placeholder rows for DataTable's body. Returns bare <TableRow>s so it drops
 * straight into an existing <TableBody> — the toolbar, headers and pagination
 * around it stay mounted.
 */
const TableSkeleton = ({ columnCount, rowCount = 5 }: TableSkeletonProps) => (
  <>
    {Array.from({ length: rowCount }).map((_, row) => (
      <TableRow key={row} aria-hidden>
        {Array.from({ length: columnCount }).map((_, col) => (
          <TableCell key={col}>
            {/* First column reads as the record's name, so make it wider. */}
            <Skeleton className={col === 0 ? "h-4 w-40" : "h-4 w-24"} />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
)

export default TableSkeleton
export { TableSkeleton }
