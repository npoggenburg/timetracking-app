// Composable Data Table Components
// Following composition-first design principles

import React from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from './loading'

// Table structure components
export const Table = ({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="bg-white border rounded-lg overflow-hidden">
    <table className={cn('w-full', className)} {...props}>
      {children}
    </table>
  </div>
)

export const TableHeader = ({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('bg-gray-50 border-b', className)} {...props}>
    {children}
  </thead>
)

export const TableBody = ({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={className} {...props}>
    {children}
  </tbody>
)

export const TableRow = ({ 
  className, 
  children, 
  isClickable = false,
  ...props 
}: React.HTMLAttributes<HTMLTableRowElement> & { isClickable?: boolean }) => (
  <tr 
    className={cn(
      'border-b last:border-b-0',
      isClickable && 'hover:bg-gray-50 cursor-pointer',
      className
    )} 
    {...props}
  >
    {children}
  </tr>
)

export const TableHead = ({ 
  className, 
  align = 'left',
  children, 
  ...props 
}: React.ThHTMLAttributes<HTMLTableCellElement> & { 
  align?: 'left' | 'center' | 'right' 
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <th 
      className={cn(
        'px-4 py-3 font-medium text-gray-700',
        alignClasses[align],
        className
      )} 
      {...props}
    >
      {children}
    </th>
  )
}

export const TableCell = ({ 
  className, 
  align = 'left',
  children, 
  ...props 
}: React.TdHTMLAttributes<HTMLTableCellElement> & { 
  align?: 'left' | 'center' | 'right' 
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <td 
      className={cn(
        'px-4 py-3',
        alignClasses[align],
        className
      )} 
      {...props}
    >
      {children}
    </td>
  )
}

// Specialized cell components
export const TableCellMoney = ({ 
  amount, 
  currency = '',
  className,
  ...props 
}: {
  amount: number | null | undefined
  currency?: string
  className?: string
} & React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <TableCell align="right" className={cn('font-medium', className)} {...props}>
    {amount !== null && amount !== undefined 
      ? `${amount.toFixed(2)}${currency ? ` ${currency}` : ''}`
      : '-'
    }
  </TableCell>
)

export const TableCellTime = ({ 
  hours, 
  formatter,
  className,
  ...props 
}: {
  hours: number | null | undefined
  formatter: (hours: number | null | undefined) => string
  className?: string
} & React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <TableCell align="right" className={cn('font-medium', className)} {...props}>
    {formatter(hours)}
  </TableCell>
)

export const TableCellBadge = ({ 
  value, 
  color,
  backgroundColor,
  className,
  ...props 
}: {
  value: string | null | undefined
  color?: string
  backgroundColor?: string
  className?: string
} & React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <TableCell className={className} {...props}>
    {value ? (
      <span 
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium"
        style={{
          backgroundColor: backgroundColor || `${color}20`,
          color: color || '#374151'
        }}
      >
        {value}
      </span>
    ) : '-'}
  </TableCell>
)

export const TableCellLink = ({ 
  value, 
  href,
  onClick,
  className,
  ...props 
}: {
  value: string | null | undefined
  href?: string
  onClick?: () => void
  className?: string
} & React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <TableCell className={className} {...props}>
    {value ? (
      href ? (
        <a 
          href={href} 
          className="font-medium text-blue-600 hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          {value}
        </a>
      ) : onClick ? (
        <button 
          onClick={onClick}
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          {value}
        </button>
      ) : (
        <span className="font-medium text-blue-600">{value}</span>
      )
    ) : '-'}
  </TableCell>
)

// Loading state components
export const TableSkeleton = ({ 
  rows = 3, 
  cols = 4,
  showHeader = true 
}: { 
  rows?: number
  cols?: number 
  showHeader?: boolean
}) => (
  <Table>
    {showHeader && (
      <TableHeader>
        <TableRow>
          {Array.from({ length: cols }, (_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
    )}
    <TableBody>
      {Array.from({ length: rows }, (_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }, (_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

// Empty state component
export const TableEmpty = ({ 
  message = 'No data available',
  columns,
  className 
}: { 
  message?: string
  columns: number
  className?: string 
}) => (
  <Table className={className}>
    <TableBody>
      <TableRow>
        <TableCell colSpan={columns} className="text-center py-12 text-gray-500">
          {message}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
)

// Higher-order table component
export interface DataTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  className?: string
}

export interface TableColumn<T> {
  key: keyof T | string
  header: React.ReactNode
  cell?: (row: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

export function DataTable<T>({ 
  data, 
  columns, 
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className 
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton cols={columns.length} />
  }

  if (data.length === 0) {
    return <TableEmpty message={emptyMessage} columns={columns.length} />
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead 
              key={String(column.key) || index} 
              align={column.align}
              className={column.className}
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow 
            key={rowIndex}
            isClickable={!!onRowClick}
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((column, colIndex) => (
              <TableCell 
                key={String(column.key) || colIndex}
                align={column.align}
                className={column.className}
              >
                {column.cell 
                  ? column.cell(row) 
                  : String((row as any)[column.key] || '-')
                }
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}