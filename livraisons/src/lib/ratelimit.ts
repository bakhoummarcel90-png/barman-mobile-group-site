/*
 * Limite par adresse IP, en plus de la limite par identifiant : empêche
 * d'essayer un mot de passe courant sur des centaines de comptes.
 */
const ipFailures = new Map<string, number[]>();
const IP_MAX_FAILURES = 20;
const IP_WINDOW_MS = 15 * 60_000;

export function ipLockedFor(ip: string): number {
  const now = Date.now();
  const recent = (ipFailures.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  ipFailures.set(ip, recent);
  if (recent.length < IP_MAX_FAILURES) return 0;
  return Math.ceil((recent[0] + IP_WINDOW_MS - now) / 60000);
}

export function recordIpFailure(ip: string): void {
  const list = ipFailures.get(ip) ?? [];
  list.push(Date.now());
  ipFailures.set(ip, list);
}
