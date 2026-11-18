import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Scores } from './scores';
const stores: Scores[] = [];
const folders: string[] = [];
function store(path = ':memory:') {
	const db = new Scores(path);
	stores.push(db);
	return db;
}
afterEach(() => {
	stores.forEach((db) => db.close());
	stores.length = 0;
	folders.forEach((dir) => rmSync(dir, { recursive: true }));
	folders.length = 0;
});
const now = 100_000;

describe('public leaderboard', () => {
	it('isolates games, sorts by score then submission time, and consumes tickets', () => {
		const db = store();
		const token = db.start(1, now);
		db.submit({ token, game: 1, name: '  Billy  ', score: 12 }, now + 60_000);
		db.submit({ token: db.start(1, now), game: 1, name: 'Ada', score: 30 }, now + 61_000);
		db.submit({ token: db.start(1, now), game: 1, name: 'Alan', score: 30 }, now + 62_000);
		db.submit({ token: db.start(2, now), game: 2, name: 'Grace', score: 180 }, now + 63_000);
		expect(db.list(1).map((e) => e.name)).toEqual(['Ada', 'Alan', 'Billy']);
		expect(db.list(2).map((e) => e.name)).toEqual(['Grace']);
		expect(db.list(3)).toEqual([]);
		expect(() => db.submit({ token, game: 1, name: 'Billy', score: 12 }, now + 65_000)).toThrow(
			'già salvata'
		);
	});
	it('rejects wrong-game, expired, implausible and malformed submissions without consuming valid tickets', () => {
		const db = store();
		const token = db.start(1, now);
		for (const change of [
			{ game: 2 },
			{ name: '<script>' },
			{ name: '' },
			{ name: 'x'.repeat(21) },
			{ name: 'A\nB' },
			{ score: -1 },
			{ score: 1.5 },
			{ score: 999999 }
		]) {
			expect(() =>
				db.submit({ token, game: 1, name: 'Ada', score: 12, ...change }, now + 30_000)
			).toThrow();
		}
		expect(() => db.submit({ token, game: 1, name: 'Ada', score: 12 }, now + 90_000_000)).toThrow();
		db.submit({ token, game: 1, name: 'Ada', score: 12 }, now + 30_000);
		expect(db.list(1)).toHaveLength(1);
	});
	it('persists scores when the database is reopened', () => {
		const folder = mkdtempSync(join(tmpdir(), 'laurea-test-'));
		folders.push(folder);
		const path = join(folder, 'data', 'scores.sqlite');
		const first = new Scores(path);
		first.submit({ token: first.start(3, now), game: 3, name: 'Torta', score: 200 }, now + 60_000);
		first.close();
		expect(store(path).list(3)[0]).toMatchObject({ name: 'Torta', score: 200 });
	});
	it('returns only the top 10 entries', () => {
		const db = store();
		for (let i = 1; i <= 25; i++)
			db.submit({ token: db.start(1, now), game: 1, name: `Ospite ${i}`, score: i }, now + 60_000);
		expect(db.list(1)).toHaveLength(10);
		expect(db.list(1)[0].score).toBe(25);
		expect(db.list(1)[9].score).toBe(16);
	});
});
