/** Backend URL (Operis API + ML). Override in `.env`: VITE_API_URL=http://127.0.0.1:8000 */
export const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
