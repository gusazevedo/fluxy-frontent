export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface ApiError {
  code: string
  message: string
}

export function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as Record<string, unknown>).code === 'string' &&
    'message' in err &&
    typeof (err as Record<string, unknown>).message === 'string'
  )
}
