export interface UseCaseError {
  code: string;
  message: string;
  field?: string;
  fields?: string[];
}

export type UseCaseResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: UseCaseError };

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
