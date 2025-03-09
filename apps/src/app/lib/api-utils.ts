import { NextResponse } from 'next/server';

/**
 * Standard API response type
 */
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

/**
 * Creates a standardized API response
 * @param data Optional response data
 * @param error Optional error message
 * @param status HTTP status code (defaults to 200)
 * @returns NextResponse with consistent structure
 */
export function createApiResponse<T>(
  data?: T, 
  error?: string, 
  status: number = 200
): NextResponse {
  return NextResponse.json({ data, error }, { status });
} 