export interface TPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
