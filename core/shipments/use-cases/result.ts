export interface UseCaseError {
  code: string;
  message: string;
  field?: string;
  fields?: string[];
}

type UseCaseSuccess<T> = [T] extends [void]
  ? { ok: true; data?: undefined }
  : { ok: true; data: T };

export type UseCaseResult<T = void> =
  | UseCaseSuccess<T>
  | { ok: false; error: UseCaseError };

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
