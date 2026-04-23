import type { Request, Response } from "express";
import { ZodError, type ZodType } from "zod";

export function parseBody<T>(schema: ZodType<T>, request: Request): T {
  return schema.parse(request.body);
}

export function handleRouteError(error: unknown, response: Response) {
  if (error instanceof ZodError) {
    response.status(400).json({
      ok: false,
      error: "Validation error",
      details: error.flatten(),
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    ok: false,
    error: "Internal server error",
  });
}

