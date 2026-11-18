import {
	cap,
	colors,
	HEIGHT,
	rounded,
	text,
	WIDTH,
	type Game,
	type Input,
	type Painter
} from './types';

import { drawGateLabels } from './flappy-labels';
import { gameInfo } from './catalog';

type Gate = { x: number; gap: number; passed: boolean; label: string; finish?: boolean };
const GATE_SPACING = 102 * 2.1;
export class Flappy implements Game {
	score = 0;
	lives = 1;
	over = false;
	y = 250;
	velocity = 0;
	elapsed = 0;
	spawn = 0; // Remaining world pixels until the next gate.
	gates: Gate[] = [];
	private gateCount = 0;
	constructor(
		private random = Math.random,
		private height = HEIGHT
	) {
		this.y = height / 2;
	}
	input(input: Input) {
		if (input.type === 'down') this.velocity = -285;
	}
	update(dt: number) {
		if (this.over) return;
		this.elapsed += dt;
		this.velocity += 730 * dt;
		this.y += this.velocity * dt;
		// Ramp up with play time, keeping the endless mode controllable.
		const speed = Math.min(240, 102 + this.elapsed * 1.5);
		const distance = speed * dt;
		for (const gate of this.gates) gate.x -= distance;
		this.spawn -= distance;
		while (this.spawn <= 0) {
			const index = this.gateCount++;
			this.gates.push({
				// Preserve spacing even when a frame overshoots the spawn point.
				x: WIDTH + 10 + this.spawn,
				gap: 155 + this.random() * (this.height - 320),
				passed: false,
				label: ['ANALISI', 'ALGEBRA', 'DEADLINE', 'NaN'][index % 4],
				finish: index + 1 === gameInfo(1).goal
			});
			this.spawn += GATE_SPACING;
		}
		const halfGap = 91;
		for (const gate of this.gates) {
			if (!gate.passed && gate.x + 60 < 85) {
				this.score++;
				gate.passed = true;
			}
			if (
				gate.x < 101 &&
				gate.x + 60 > 69 &&
				(this.y - 12 < gate.gap - halfGap || this.y + 12 > gate.gap + halfGap)
			)
				this.over = true;
		}
		this.gates = this.gates.filter((g) => g.x > -70);
		if (this.y < 16 || this.y > this.height - 22) this.over = true;
		if (this.over) this.lives = 0;
	}
	draw(ctx: Painter) {
		for (const g of this.gates) {
			rounded(ctx, g.x, -12, 60, g.gap - 91 + 12, colors.green);
			rounded(ctx, g.x, g.gap + 91, 60, this.height - g.gap - 91 + 12, colors.green);
			drawGateLabels(ctx, g.x, g.gap, this.height, g.label);
			if (g.finish) {
				// This is exactly the edge that awards the last CFU at x = 85.
				const x = g.x + 60;
				for (let y = 0; y < this.height; y += 28) {
					ctx.line(
						[
							{ x, y },
							{ x, y: Math.min(y + 16, this.height) }
						],
						'#ff5252',
						3
					);
				}
				text(ctx, 'LAUREA', x + 14, this.height / 2, 12, '#ff5252', Math.PI / 2);
			}
		}
		ctx.circle(85, this.y, 17, colors.gold);
		cap(ctx, 85, this.y - 17, 21);
		text(ctx, 'x', 85, this.y + 6, 17, colors.paper);
	}
}
