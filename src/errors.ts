import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  expose?: boolean;
  type?: string;
}

/** Turn validation failures into a readable message, e.g. "age must be a number". */
function describe(err: ZodError): string {
  return err.issues
    .map((issue) => {
      const field = issue.path.join(".") || "request body";
      return `${field} ${issue.message}`;
    })
    .join("; ");
}

// Client errors keep their 4xx status; anything else is a generic 500.
// Stack traces are never sent to the client.
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: describe(err) });
    return;
  }

  const httpError = err as HttpError;
  const status = httpError.status ?? httpError.statusCode;
  if (status !== undefined && status >= 400 && status < 500) {
    let message = httpError.expose ? httpError.message : "Bad request.";
    if (httpError.type === "entity.parse.failed") {
      message = "Request body is not valid JSON.";
    }
    res.status(status).json({ error: message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
};
