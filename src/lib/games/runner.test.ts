import { describe, expect, it, vi } from 'vitest';
import { Runner, obstacleLabels } from './runner';
import type { Painter } from './types';

function swipe(game: Runner, from: number, to: number) {
	game.input({ type: 'down', x: from, y: 0 });
	game.input({ type: 'move', x: to, y: 0 });
	game.input({ type: 'up', x: to, y: 0 });
}

describe('runner swipes', () => {
	it('requires two gestures to cross two lanes, regardless of distance or reversal', () => {
		const game = new Runner();
		game.lane = 0;
		game.input({ type: 'down', x: 0, y: 0 });
		for (const x of [100, 200, 350, -100]) game.input({ type: 'move', x, y: 0 });
		expect(game.lane).toBe(1);
		game.input({ type: 'up', x: -100, y: 0 });
		game.input({ type: 'move', x: 350, y: 0 });
		expect(game.lane).toBe(1);
		swipe(game, 0, 350);
		expect(game.lane).toBe(2);
		swipe(game, 350, 0);
		expect(game.lane).toBe(1);
		swipe(game, 350, 0);
		expect(game.lane).toBe(0);
	});

	it('ignores pointer movement without a gesture and tolerates small finger movements', () => {
		const game = new Runner();
		game.input({ type: 'move', x: 300, y: 0 });
		expect(game.lane).toBe(1);
		game.input({ type: 'down', x: 100, y: 0 });
		for (const x of [110, 90, 128]) game.input({ type: 'move', x, y: 0 });
		expect(game.lane).toBe(1);
		game.input({ type: 'move', x: 129, y: 0 });
		expect(game.lane).toBe(2);
	});

	it('consumes a swipe at the boundary instead of allowing a direction reversal', () => {
		const game = new Runner();
		game.lane = 2;
		game.input({ type: 'down', x: 100, y: 0 });
		game.input({ type: 'move', x: 200, y: 0 });
		game.input({ type: 'move', x: 0, y: 0 });
		expect(game.lane).toBe(2);
		game.input({ type: 'up', x: 0, y: 0 });
		swipe(game, 100, 0);
		expect(game.lane).toBe(1);
	});
});

describe('runner objects', () => {
	it('spawns mathematical obstacles whose labels fit the existing blocks', () => {
		const game = new Runner(() => 0.99);
		game.spawn = 0;
		game.update(1 / 60);
		expect(game.obstacles[0].coffee).toBe(false);
		expect(game.obstacles[0].label).toMatch(/[=∫∇λ]/);
		for (const label of obstacleLabels) {
			for (const line of label.split('\n')) expect([...line].length * 8).toBeLessThanOrEqual(74);
			expect(label.split('\n')).toHaveLength(label.includes('\n') ? 2 : 1);
		}
	});

	it('keeps formula obstacles harmful and coffee worth ten points', () => {
		const game = new Runner();
		game.spawn = 100;
		game.obstacles = [{ lane: 1, y: 460, coffee: false, label: 'Ax = λx' }];
		game.update(1 / 60);
		expect(game.lives).toBe(2);
		game.obstacles = [{ lane: 1, y: 460, coffee: true, label: '' }];
		game.update(1 / 60);
		expect(game.bonus).toBe(10);
	});

	it('shows the coffee bonus and formula label without the old C or lane slogans', () => {
		const game = new Runner();
		game.obstacles = [
			{ lane: 1, y: 200, coffee: true, label: '' },
			{ lane: 0, y: 300, coffee: false, label: 'Ax = λx' }
		];
		const drawText = vi.fn<Painter['text']>();
		const p = {
			emoji: vi.fn<Painter['emoji']>(),
			rect: vi.fn(),
			circle: vi.fn(),
			polygon: vi.fn(),
			line: vi.fn(),
			text: drawText
		};
		game.draw(p);
		expect(drawText.mock.calls.map(([value]) => value)).toEqual(['+10', 'Ax = λx']);
		expect(p.emoji).toHaveBeenCalledWith('coffee', 180, 200, 38);
		expect(p.emoji).toHaveBeenCalledWith('runner', 180, 466, 46);
	});
});
