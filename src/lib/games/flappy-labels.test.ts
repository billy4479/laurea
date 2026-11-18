import { describe, expect, it, vi } from 'vitest';
import { drawGateLabels, formulas } from './flappy-labels';
import { Flappy } from './flappy';
import type { Painter } from './types';

describe('vertical gate text', () => {
	it('shows full exam names and multi-line formulas, rotated 90 degrees', () => {
		const draw = vi.fn<Painter['text']>();
		const painter = { text: draw } as unknown as Painter;
		drawGateLabels(painter, 100, 300, 780, 'DEADLINE');
		expect(draw.mock.calls.map((call) => call[0])).toEqual(['DEADLINE', formulas.DEADLINE]);
		for (const call of draw.mock.calls) {
			expect(call[1]).toBe(130);
			expect(call[3]).toBe(12);
			expect(call[5]).toBe(Math.PI / 2);
		}
	});

	it('keeps both texts inside a pillar and below the HUD at every gap height', () => {
		for (const height of [560, 780, 1000]) {
			for (let gap = 155; gap <= height - 165; gap += 5) {
				for (const name of Object.keys(formulas)) {
					const draw = vi.fn<Painter['text']>();
					drawGateLabels({ text: draw } as unknown as Painter, 100, gap, height, name);
					for (const [value, , y] of draw.mock.calls) {
						const lines = value.split('\n');
						const halfLength = Math.max(...lines.map((line) => [...line].length)) * 4;
						const start = y - halfLength,
							end = y + halfLength;
						expect((start >= 96 && end <= gap - 91) || (start >= gap + 91 && end <= height)).toBe(
							true
						);
						expect(lines.length * 12).toBeLessThanOrEqual(60);
					}
				}
			}
		}
	});

	it('continues cycling subjects after old gates leave the screen', () => {
		const game = new Flappy(() => 0.5);
		const names: string[] = [];
		for (let i = 0; i < 8; i++) {
			game.gates = [];
			game.spawn = 0;
			game.update(0.01);
			names.push(game.gates[0].label);
		}
		expect(names).toEqual([
			'ANALISI',
			'ALGEBRA',
			'DEADLINE',
			'NaN',
			'ANALISI',
			'ALGEBRA',
			'DEADLINE',
			'NaN'
		]);
	});
});
