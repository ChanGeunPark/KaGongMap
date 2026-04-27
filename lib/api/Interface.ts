export interface ApiResponseBase<T> {
  ok: boolean;
  message: string;
  code?: string;
  data?: T;
}
