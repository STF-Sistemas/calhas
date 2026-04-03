export interface TApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
