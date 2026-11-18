import { describe, expect, it, vi } from 'vitest';
import { Flappy } from './flappy';
import { gameInfo } from './catalog';
import type { Painter } from './types';

function painter() {
	return {
		rect: vi.fn(),
		circle: vi.fn(),
		polygon: vi.fn(),
		line: vi.fn<Painter['line']>(),
		text: vi.fn<Painter['text']>()
	};
}

function distanceAt(elapsed: number, score = 0) {
	const game = new Flappy();
	game.elapsed = elapsed;
	game.score = score;
	game.spawn = 100;
	game.gates = [{ x: 300, gap: 280, passed: false, label: 'ANALISI' }];
	game.update(1 / 60);
	return 300 - game.gates[0].x;
}

describe('Flappy progression', () => {
	it('keeps a fixed column spacing at every speed, including frame overshoot', () => {
		for (const elapsed of [0, 30, 120]) {
			for (const dt of [1 / 60, 1 / 30, 0.08]) {
				const game = new Flappy(() => 0.5);
				game.elapsed = elapsed;
				game.gates = [{ x: 370 - 214.2, gap: 280, passed: false, label: 'ANALISI' }];
				for (let frame = 0; frame < 40; frame++) {
					game.y = 280;
					game.velocity = 0;
					game.update(dt);
					expect(game.over).toBe(false);
					for (let i = 1; i < game.gates.length; i++) {
						expect(game.gates[i].x - game.gates[i - 1].x).toBeCloseTo(214.2, 8);
					}
				}
			}
		}
	});

	it('spawns columns more frequently as the world speeds up', () => {
		function firstInterval(elapsed: number) {
			const game = new Flappy(() => 0.5);
			game.elapsed = elapsed;
			const born: number[] = [];
			let previous = game.gates.at(-1);
			for (let frame = 0; frame < 240; frame++) {
				game.y = 280;
				game.velocity = 0;
				game.update(1 / 60);
				const newest = game.gates.at(-1);
				if (newest && newest !== previous) {
					born.push(frame / 60);
					previous = newest;
				}
			}
			expect(born.length).toBeGreaterThanOrEqual(2);
			return born[1] - born[0];
		}
		expect(firstInterval(120)).toBeLessThan(firstInterval(0));
	});

	it('accelerates with elapsed time, not score, and caps endless-mode speed', () => {
		expect(distanceAt(30)).toBeGreaterThan(distanceAt(0));
		expect(distanceAt(60)).toBeGreaterThan(distanceAt(30));
		expect(distanceAt(0, 100)).toBe(distanceAt(0));
		expect(distanceAt(120)).toBeCloseTo(240 / 60);
		expect(distanceAt(1000)).toBe(distanceAt(120));
	});

	it('only marks the graduation gate and awards victory when its finish line is crossed', () => {
		const game = new Flappy(() => 0.5);
		const goal = gameInfo(1).goal;
		for (let i = 1; i <= goal; i++) {
			game.gates = [];
			game.spawn = 0;
			game.update(0.01);
			expect(game.gates[0].finish).toBe(i === goal);
		}
		game.spawn = 100;
		game.score = goal - 1;
		const gate = game.gates[0];
		gate.x = 25.1;
		gate.gap = game.y;
		expect(gate.x + 60).toBeGreaterThan(85);
		game.update(1 / 60);
		expect(gate.x + 60).toBeLessThan(85);
		expect(game.score).toBe(goal);
		expect(game.over).toBe(false);
		game.spawn = 0;
		game.update(1 / 60);
		expect(game.gates.at(-1)?.finish).toBe(false);
	});

	it('draws a full-height dashed red line at the final gate edge', () => {
		const game = new Flappy(() => 0.5, 800);
		game.gates = [{ x: 200, gap: 400, passed: false, label: 'NaN', finish: true }];
		const p = painter();
		game.draw(p);
		const dashes = p.line.mock.calls.filter(([, color]) => color === '#ff5252');
		expect(dashes).toHaveLength(Math.ceil(800 / 28));
		expect(dashes[0][0]).toEqual([
			{ x: 260, y: 0 },
			{ x: 260, y: 16 }
		]);
		expect(dashes.at(-1)?.[0].at(-1)?.y).toBe(800);
		expect(p.text.mock.calls.some(([value]) => value === 'LAUREA')).toBe(true);
	});

	it('has no static background slogans or finish line on ordinary gates', () => {
		const game = new Flappy();
		const empty = painter();
		game.draw(empty);
		expect(empty.text.mock.calls.map(([value]) => value)).toEqual(['x']);
		game.gates = [{ x: 200, gap: 280, passed: false, label: 'ANALISI' }];
		const ordinary = painter();
		game.draw(ordinary);
		expect(ordinary.line.mock.calls.some(([, color]) => color === '#ff5252')).toBe(false);
	});
});
