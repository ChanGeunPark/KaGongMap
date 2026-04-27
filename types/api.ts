export interface ApiErrorResponse {
  ok: false;
  message: string;
  code?: string;
}
export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
