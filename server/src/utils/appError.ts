export class AppError extends Error {
  public readonly statusCode: number
  public readonly status: string
  public readonly isOperational: boolean
  public readonly code: string
  public readonly details?: unknown

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    details?: unknown
  ) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true
    this.code = code
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: unknown) {
    return new AppError(message, 400, code, details)
  }

  static unauthorized(message = 'Unauthorized access', code = 'UNAUTHORIZED') {
    return new AppError(message, 401, code)
  }

  static forbidden(message = 'Access forbidden', code = 'FORBIDDEN') {
    return new AppError(message, 403, code)
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new AppError(message, 404, code)
  }

  static conflict(message: string, code = 'CONFLICT') {
    return new AppError(message, 409, code)
  }

  static internal(message = 'An unexpected error occurred', details?: unknown) {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR', details)
  }
}
