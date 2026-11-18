import { describe, expect, it } from 'vitest';
import { Flappy } from './flappy';
import { Runner } from './runner';
import { segmentDistance, Slice } from './slice';
import { gameInfo } from './catalog';

describe('Flappy Laurea', () => {
	it('awards one CFU only after clearing a gate, then keeps going past graduation', () => {
		const game = new Flappy(() => 0.5);
		game.spawn = 100;
		game.y = 260;
		game.score = gameInfo(1).goal - 1;
		game.gates = [{ x: 24, gap: 260, passed: false, label: 'ESAME' }];
		game.update(1 / 60);
		expect(game.score).toBe(gameInfo(1).goal);
		expect(game.over).toBe(false);
		game.update(1 / 60);
		expect(game.score).toBe(gameInfo(1).goal);
	});
	it('flaps upward and loses on contact with a gate or screen edge', () => {
		const game = new Flappy();
		game.input({ type: 'down', x: 0, y: 0 });
		game.update(1 / 60);
		expect(game.velocity).toBeLessThan(0);
		game.gates = [{ x: 80, gap: 450, passed: false, label: 'ESAME' }];
		game.update(1 / 60);
		expect(game.over).toBe(true);
		expect(game.lives).toBe(0);
		const edge = new Flappy();
		edge.y = 559;
		edge.update(1 / 60);
		expect(edge.over).toBe(true);
	});
});

describe('La corsa alla laurea', () => {
	it('changes lanes with swipes and keys without leaving the track', () => {
		const game = new Runner();
		game.input({ type: 'down', x: 200, y: 0 });
		game.input({ type: 'move', x: 100, y: 0 });
		expect(game.lane).toBe(0);
		game.input({ type: 'left', x: 0, y: 0 });
		expect(game.lane).toBe(0);
		game.input({ type: 'right', x: 0, y: 0 });
		expect(game.lane).toBe(1);
	});
	it('collects coffee, damages once per collision and ends after three hits', () => {
		const game = new Runner();
		game.spawn = 100;
		game.obstacles = [{ lane: 1, y: 460, coffee: true, label: '' }];
		game.update(1 / 60);
		expect(game.score).toBe(10);
		for (let hit = 0; hit < 3; hit++) {
			game.invulnerable = 0;
			game.obstacles = [{ lane: 1, y: 460, coffee: false, label: 'BUG' }];
			game.update(1 / 60);
			game.update(1 / 60);
			expect(game.lives).toBe(2 - hit);
		}
		expect(game.over).toBe(true);
	});
	it('keeps scoring after reaching the victory target', () => {
		const game = new Runner();
		game.spawn = 1000;
		game.elapsed = 60;
		game.update(1);
		expect(game.score).toBeGreaterThan(gameInfo(2).goal);
		expect(game.over).toBe(false);
	});
});

describe('Taglia la sessione', () => {
	it('detects the entire swipe, not just its endpoints', () => {
		expect(segmentDistance({ x: 180, y: 200 }, { x: 0, y: 200 }, { x: 360, y: 200 })).toBe(0);
		const game = new Slice();
		game.items = [{ x: 180, y: 200, vx: 0, vy: 0, bad: false, kind: 0, cut: false }];
		game.input({ type: 'down', x: 0, y: 200 });
		game.input({ type: 'move', x: 360, y: 200 });
		expect(game.score).toBe(10);
		game.input({ type: 'move', x: 0, y: 200 });
		expect(game.score).toBe(10);
	});
	it('does not cut while the pointer is released; exams and missed treats cost lives', () => {
		const game = new Slice();
		game.spawn = 100;
		game.items = [{ x: 180, y: 200, vx: 0, vy: 0, bad: true, kind: 0, cut: false }];
		game.input({ type: 'move', x: 180, y: 200 });
		expect(game.lives).toBe(3);
		game.input({ type: 'down', x: 100, y: 200 });
		game.input({ type: 'move', x: 240, y: 200 });
		expect(game.lives).toBe(2);
		game.input({ type: 'up', x: 0, y: 0 });
		game.items = [{ x: 180, y: 622, vx: 0, vy: 100, bad: false, kind: 0, cut: false }];
		game.update(1 / 60);
		expect(game.lives).toBe(1);
		game.items = [{ x: 180, y: 622, vx: 0, vy: 100, bad: false, kind: 0, cut: false }];
		game.update(1 / 60);
		expect(game.over).toBe(true);
	});
});
