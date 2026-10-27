// A simple in-memory limit on how often something can happen per key (an IP address, an
// email address). It resets when the server restarts, so it's a brake, not a wall.
export function limiter(windowMs: number, max: number) {
  const recent = new Map<string, number[]>();
  return (key: string) => {
    const now = Date.now();
    const times = (recent.get(key) ?? []).filter((t) => now - t < windowMs);
    if (times.length >= max) return false;
    times.push(now);
    recent.set(key, times);
    if (recent.size > 5000) {
      for (const [k, list] of recent) if (list.every((t) => now - t >= windowMs)) recent.delete(k);
    }
    return true;
  };
}

export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
}
