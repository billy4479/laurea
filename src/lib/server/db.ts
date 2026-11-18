import { env } from '$env/dynamic/private';
import { Scores } from './scores';
let store: Scores | undefined;
export function scores() {
	return (store ??= new Scores(env.DATABASE_PATH || 'data/laurea.sqlite'));
}

// Ephemeral abuse protection, not an identity or anti-cheat system.
const requests = new Map<string, { count: number; reset: number }>();
export function allowStart(address: string) {
	const now = Date.now();
	for (const [key, value] of requests) if (value.reset < now) requests.delete(key);
	const value = requests.get(address) ?? { count: 0, reset: now + 3_600_000 };
	if (value.count >= 3600 || (!requests.has(address) && requests.size >= 10_000)) return false;
	value.count++;
	requests.set(address, value);
	return true;
}
