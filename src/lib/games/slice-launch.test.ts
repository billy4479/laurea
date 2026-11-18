import { describe, expect, it } from 'vitest';
import { Slice } from './slice';

function item(y: number, vy: number, bad = false, cut = false) {
	return { x: 180, y, vx: 0, vy, bad, kind: 0, cut };
}

describe('slice launches', () => {
	it.each([
		[0, 2],
		[11, 2],
		[12, 3],
		[23, 3],
		[24, 4],
		[35, 4],
		[36, 5],
		[3600, 5]
	])('launches %i seconds into the game with the expected wave size (%i)', (elapsed, count) => {
		const game = new Slice(() => 0.5);
		game.elapsed = elapsed;
		game.spawn = 0;
		game.update(1 / 60);
		expect(game.items).toHaveLength(count);
		for (const object of game.items) {
			expect(Number.isFinite(object.x)).toBe(true);
			expect(object.x).toBeGreaterThan(30);
			expect(object.x).toBeLessThan(330);
		}
	});

	it('throws objects higher into a tall phone screen', () => {
		const game = new Slice(() => 0.5, 800);
		game.spawn = 0;
		game.update(1 / 60);
		expect(game.items.every((object) => object.vy < -650)).toBe(true);
		game.spawn = 1000;
		for (let i = 0; i < 60; i++) game.update(1 / 60);
		expect(game.items[0].y).toBeLessThan(450);
	});

	it('starts apart, crosses near the apex and falls toward opposite sides at every speed', () => {
		for (const elapsed of [0, 13, 120]) {
			const game = new Slice(() => 0.5, 800);
			game.elapsed = elapsed;
			game.spawn = 0;
			game.update(1 / 60);
			game.spawn = 1000;
			const first = game.items[0],
				last = game.items.at(-1)!;
			expect(last.x - first.x).toBeGreaterThan(150);
			let closest = Infinity,
				crossingY = 840;
			for (let i = 0; i < 84; i++) {
				game.update(1 / 60);
				const separation = Math.abs(last.x - first.x);
				if (separation < closest) {
					closest = separation;
					crossingY = first.y;
				}
			}
			expect(closest).toBeLessThan(5);
			expect(crossingY).toBeLessThan(500);
			expect(first.x).toBeGreaterThan(last.x);
			expect(Math.min(first.x, last.x)).toBeGreaterThan(30);
			expect(Math.max(first.x, last.x)).toBeLessThan(330);
		}
	});

	it('accelerates object movement and wave timing with a speed cap', () => {
		function step(elapsed: number) {
			const game = new Slice();
			game.elapsed = elapsed;
			game.spawn = 100;
			game.items = [item(300, 50)];
			game.update(1 / 60);
			return { y: game.items[0].y, spawn: game.spawn };
		}
		expect(step(60).y).toBeGreaterThan(step(0).y);
		expect(step(60).spawn).toBeLessThan(step(0).spawn);
		expect(step(1000)).toEqual(step(60));
	});

	it('preserves the arc height while shortening its real flight time', () => {
		function flight(elapsed: number) {
			const game = new Slice(Math.random, 800);
			game.elapsed = elapsed;
			game.spawn = 1000;
			game.items = [item(840, -730)];
			let peak = 840,
				frames = 0;
			while (game.items.length && frames < 240) {
				game.update(1 / 60);
				frames++;
				if (game.items.length) peak = Math.min(peak, game.items[0].y);
			}
			return { peak, frames };
		}
		const early = flight(0),
			late = flight(60);
		expect(late.frames).toBeLessThan(early.frames);
		expect(Math.abs(late.peak - early.peak)).toBeLessThan(6);
	});
});

describe('missed objects', () => {
	it('charges one life for a missed good object, but not while it is launching', () => {
		const game = new Slice();
		game.spawn = 1000;
		game.items = [item(600, -730)];
		game.update(1 / 60);
		expect(game.lives).toBe(3);
		game.items[0].y = 591;
		game.items[0].vy = 100;
		game.update(1 / 60);
		expect(game.lives).toBe(2);
		expect(game.items).toHaveLength(0);
		game.update(1 / 60);
		expect(game.lives).toBe(2);
	});

	it('allows dangerous and already-cut objects to fall without a penalty', () => {
		const game = new Slice();
		game.spawn = 1000;
		game.items = [item(630, 100, true), item(630, 100, false, true)];
		game.update(1 / 60);
		expect(game.lives).toBe(3);
		expect(game.items).toHaveLength(0);
	});

	it('ends at zero lives even if several good objects fall together', () => {
		const game = new Slice();
		game.spawn = 1000;
		game.items = Array.from({ length: 4 }, () => item(591, 100));
		game.update(1 / 60);
		expect(game.lives).toBe(0);
		expect(game.over).toBe(true);
	});
});
