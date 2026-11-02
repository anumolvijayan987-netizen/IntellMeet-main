import { Response } from 'express'

export interface IApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: {
    code: string
    details?: unknown
    stack?: string
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    [key: string]: unknown
  }
  timestamp: string
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Request successful',
    statusCode = 200,
    meta?: IApiResponse['meta']
  ): Response {
    const payload: IApiResponse<T> = {
      success: true,
      message,
      data,
      ...(meta && { meta }),
      timestamp: new Date().toISOString(),
    }
    return res.status(statusCode).json(payload)
  }

  static created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully'
  ): Response {
    return ApiResponse.success(res, data, message, 201)
  }

  static error(
    res: Response,
    message = 'An error occurred',
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details?: unknown,
    stack?: string
  ): Response {
    const payload: IApiResponse = {
      success: false,
      message,
      error: {
        code,
        ...(details !== undefined ? { details } : {}),
        ...(stack !== undefined ? { stack } : {}),
      },
      timestamp: new Date().toISOString(),
    }
    return res.status(statusCode).json(payload)
  }
}
