import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, totalElements, onPageChange }) {
  if (!totalPages || totalPages <= 1) {
    return totalElements > 0 ? (
      <p className="pagination-summary">
        {totalElements} {totalElements === 1 ? 'item' : 'items'}
      </p>
    ) : null;
  }

  return (
    <div className="pagination">
      <p className="pagination-summary">
        Page {page + 1} of {totalPages} · {totalElements} items
      </p>
      <div className="pagination-actions">
        <button
          type="button"
          className="pagination-button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
        >
          <ChevronLeft size={17} />
        </button>
        <button
          type="button"
          className="pagination-button"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
