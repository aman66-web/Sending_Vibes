import type { Instrumentation } from "next";
import { errorFields, logEvent, safePath } from "@/lib/log";

// Every error the server didn't handle itself, as one line in Vercel → Logs: search for
// "request_error". The digest matches the one an error screen gets, to find a visitor's
// error. One on the way to being paid also emails the owner (lib/alert.ts).

const PAYMENT_PATHS = /^\/api\/(stripe|checkout)(\/|$)/;

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  try {
    const path = safePath(request.path);
    const fields = { path, method: request.method, routeType: context.routeType, routePath: context.routePath, ...errorFields(err) };
    logEvent("request_error", fields, "error");
    if (PAYMENT_PATHS.test(path) && process.env.NEXT_RUNTIME === "nodejs") {
      const { alertOwner } = await import("@/lib/alert");
      await alertOwner(`Payment step failed (${path})`, { error: fields.error, digest: fields.digest });
    }
  } catch {}
};
