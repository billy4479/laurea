import { describe, expect, it, vi } from 'vitest';
import { Runner } from './runner';
import { gameInfo } from './catalog';
import type { Painter } from './types';

function stepDistance(elapsed: number) {
	const game = new Runner(() => 0);
	game.elapsed = elapsed;
	game.spawn = 10000;
	game.obstacles = [{ lane: 0, y: 0, coffee: false, label: 'BUG' }];
	game.update(1 / 60);
	return game.obstacles[0].y;
}

describe('runner progression', () => {
	it('accelerates over time with a finite maximum speed', () => {
		expect(stepDistance(30)).toBeGreaterThan(stepDistance(0));
		expect(stepDistance(60)).toBeGreaterThan(stepDistance(30));
		expect(stepDistance(120)).toBeCloseTo(420 / 60);
		expect(stepDistance(1000)).toBeCloseTo(stepDistance(120));
	});

	it('keeps obstacle spacing fixed across speeds and frame overshoot', () => {
		for (const elapsed of [0, 30, 120]) {
			for (const dt of [1 / 60, 0.08]) {
				const game = new Runner(() => 0);
				game.elapsed = elapsed;
				game.spawn = 0;
				game.obstacles = [{ lane: 0, y: 135, coffee: false, label: 'BUG' }];
				for (let frame = 0; frame < 40; frame++) {
					game.update(dt);
					for (let i = 1; i < game.obstacles.length; i++) {
						expect(game.obstacles[i - 1].y - game.obstacles[i].y).toBeCloseTo(180, 8);
					}
				}
			}
		}
	});

	it('crosses the finish line at the victory score, with or without coffee', () => {
		for (const height of [560, 800]) {
			for (const bonus of [0, 50]) {
				const game = new Runner(() => 0, height);
				game.spawn = 10000;
				game.bonus = bonus;
				game.elapsed = (gameInfo(2).goal - bonus) / 3 - 0.01;
				expect(game.finishY).toBeLessThan(height - 94);
				game.update(0.02);
				expect(game.score).toBe(gameInfo(2).goal);
				expect(game.finishY).toBeGreaterThan(height - 94);
				expect(game.over).toBe(false);
				game.update(0.5);
				expect(game.score).toBeGreaterThan(gameInfo(2).goal);
			}
		}
	});

	it('moves the finish closer when coffee supplies the last ten points', () => {
		const game = new Runner();
		game.spawn = 10000;
		game.elapsed = (gameInfo(2).goal - 10) / 3;
		expect(game.finishY).toBeLessThan(466);
		game.obstacles = [{ lane: 1, y: 466, coffee: true, label: '' }];
		game.update(1 / 60);
		expect(game.score).toBe(gameInfo(2).goal);
		expect(game.finishY).toBeGreaterThan(466);
	});

	it('draws a horizontal dashed red finish line across the track', () => {
		const game = new Runner();
		game.elapsed = 59;
		const p = {
			emoji: vi.fn(),
			rect: vi.fn(),
			circle: vi.fn(),
			polygon: vi.fn(),
			line: vi.fn<Painter['line']>(),
			text: vi.fn<Painter['text']>()
		};
		game.draw(p);
		const dashes = p.line.mock.calls.filter(([, color]) => color === '#ff5252');
		expect(dashes).toHaveLength(12);
		for (const [points] of dashes) for (const point of points) expect(point.y).toBe(game.finishY);
		expect(dashes[0][0][0].x).toBe(17);
		expect(p.text.mock.calls.some(([value]) => value === 'LAUREA')).toBe(true);
	});

	it('ends on the first hit without negative lives from overlapping obstacles', () => {
		const game = new Runner();
		game.spawn = 10000;
		game.obstacles = ['BUG', 'ESAME'].map((label) => ({ lane: 1, y: 466, coffee: false, label }));
		game.update(1 / 60);
		expect(game.lives).toBe(0);
		expect(game.over).toBe(true);
		expect(new Runner().lives).toBe(1);
	});
});
