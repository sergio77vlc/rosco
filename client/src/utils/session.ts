export interface StoredSession {
  hostToken?: string;
  playerId?: string;
}

function storageKey(prefix: string, code: string): string {
  return `${prefix}:session:${code}`;
}

export function saveSession(prefix: string, code: string, patch: StoredSession): void {
  const existing = loadSession(prefix, code) ?? {};
  try {
    localStorage.setItem(storageKey(prefix, code), JSON.stringify({ ...existing, ...patch }));
  } catch {
    // localStorage no disponible (modo privado, cuota llena...): la reconexión automática
    // simplemente no funcionará, pero el resto de la app sigue operando con normalidad.
  }
}

export function loadSession(prefix: string, code: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(storageKey(prefix, code));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession(prefix: string, code: string): void {
  try {
    localStorage.removeItem(storageKey(prefix, code));
  } catch {
    // ver saveSession
  }
}
