import type { ErrorRequestHandler } from "express";

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const status = error instanceof HttpError ? error.status : 500;
  res.status(status).json({ error: status === 500 ? "Internal Server Error" : error.message });
};
