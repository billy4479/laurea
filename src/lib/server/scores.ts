import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { isGameId, type GameId } from '../games/catalog';

export class ScoreError extends Error {
	constructor(
		message: string,
		public status = 400
	) {
		super(message);
	}
}
export type Entry = { name: string; score: number; created: number };
export class Scores {
	private db: DatabaseSync;
	constructor(path: string) {
		if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
		this.db = new DatabaseSync(path);
		this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, game INTEGER NOT NULL, started INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, game INTEGER NOT NULL, name TEXT NOT NULL, score INTEGER NOT NULL, created INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS leaderboard ON scores(game, score DESC, created ASC, id ASC);
    `);
	}
	start(game: GameId, now = Date.now()) {
		const id = randomUUID();
		this.db.prepare('DELETE FROM runs WHERE started < ?').run(now - 86_400_000);
		this.db.prepare('INSERT INTO runs VALUES (?, ?, ?)').run(id, game, now);
		return id;
	}
	submit(data: unknown, now = Date.now()) {
		if (!data || typeof data !== 'object') throw new ScoreError('Punteggio non valido.');
		const { token, game, name, score } = data as Record<string, unknown>;
		if (
			typeof game !== 'number' ||
			!isGameId(game) ||
			typeof token !== 'string' ||
			typeof name !== 'string' ||
			typeof score !== 'number' ||
			!Number.isSafeInteger(score) ||
			score < 1 ||
			score > 1_000_000
		)
			throw new ScoreError('Punteggio non valido.');
		const clean = name.trim().normalize('NFC');
		if (clean.length < 1 || [...clean].length > 20 || /[\p{C}<>]/u.test(clean))
			throw new ScoreError('Usa un nome da 1 a 20 caratteri, senza simboli speciali.');
		const run = this.db.prepare('SELECT game, started FROM runs WHERE id = ?').get(token) as
			{ game: number; started: number } | undefined;
		if (!run || run.game !== game) throw new ScoreError('Partita già salvata o non valida.', 409);
		const seconds = (now - run.started) / 1000;
		const maxRate = game === 1 ? 2 : game === 2 ? 35 : 100;
		if (seconds < 0 || seconds > 86_400 || score > Math.ceil(seconds * maxRate) + 10)
			throw new ScoreError('Il punteggio non è compatibile con la durata della partita.');
		// Consume the ticket and write the score atomically, also across processes.
		this.db.exec('BEGIN IMMEDIATE');
		try {
			const result = this.db.prepare('DELETE FROM runs WHERE id = ?').run(token);
			if (!result.changes) throw new ScoreError('Partita già salvata.', 409);
			this.db
				.prepare('INSERT INTO scores (game, name, score, created) VALUES (?, ?, ?, ?)')
				.run(game, clean, score, now);
			this.db.exec('COMMIT');
		} catch (error) {
			this.db.exec('ROLLBACK');
			throw error;
		}
		return this.list(game);
	}
	list(game: GameId): Entry[] {
		return this.db
			.prepare(
				'SELECT name, score, created FROM scores WHERE game = ? ORDER BY score DESC, created ASC, id ASC LIMIT 20'
			)
			.all(game) as Entry[];
	}
	close() {
		this.db.close();
	}
}
