import type { Pagination } from '@/api/types'

import { Button } from './Button'

interface PaginationControlsProps {
  onPageChange: (page: number) => void
  pagination?: Pagination
}

export function PaginationControls({
  onPageChange,
  pagination,
}: PaginationControlsProps) {
  if (!pagination || pagination.totalPages <= 1) {
    return null
  }

  return (
    <nav
      aria-label="Phân trang"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p aria-live="polite" className="text-sm text-muted">
        Trang <strong>{pagination.page}</strong> / {pagination.totalPages}
        {' · '}
        {pagination.total} kết quả
      </p>
      <div className="flex gap-2">
        <Button
          aria-label="Trang trước"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          variant="outline"
        >
          Trước
        </Button>
        <Button
          aria-label="Trang sau"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          variant="outline"
        >
          Sau
        </Button>
      </div>
    </nav>
  )
}
