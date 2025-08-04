import { useState, useMemo } from 'react';

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: PaginationConfig;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
}

export const usePagination = <T>(
  data: T[],
  initialPageSize: number = 10
): PaginationResult<T> => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, page, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const nextPage = () => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  };

  const previousPage = () => {
    if (hasPreviousPage) {
      setPage(page - 1);
    }
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    // Reset to first page when page size changes
    setPage(1);
  };

  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total: data.length,
    },
    hasNextPage,
    hasPreviousPage,
    totalPages,
    setPage: goToPage,
    setPageSize: handlePageSizeChange,
    nextPage,
    previousPage,
    goToPage,
  };
};

// Hook for server-side pagination
export const useServerPagination = (
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: any[], total: number }>,
  initialPageSize: number = 10
) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction(page, pageSize);
      setData(result.data);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  };

  const previousPage = () => {
    if (hasPreviousPage) {
      setPage(page - 1);
    }
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page
  };

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
    },
    hasNextPage,
    hasPreviousPage,
    totalPages,
    loading,
    error,
    setPage: goToPage,
    setPageSize: handlePageSizeChange,
    nextPage,
    previousPage,
    goToPage,
    loadData,
  };
};

// Utility function to create pagination info text
export const getPaginationInfo = (pagination: PaginationConfig): string => {
  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total);
  
  if (pagination.total === 0) {
    return "Geen resultaten";
  }
  
  return `${start}-${end} van ${pagination.total} resultaten`;
};