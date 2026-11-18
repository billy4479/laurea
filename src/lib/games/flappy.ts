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

type Gate = { x: number; gap: number; passed: boolean; label: string };
export class Flappy implements Game {
	score = 0;
	lives = 1;
	over = false;
	y = 250;
	velocity = 0;
	elapsed = 0;
	spawn = 0;
	gates: Gate[] = [];
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
		this.spawn -= dt;
		const speed = Math.min(165, 102 + this.score * 2);
		if (this.spawn <= 0) {
			this.gates.push({
				x: WIDTH + 10,
				gap: 155 + this.random() * (this.height - 320),
				passed: false,
				label: ['ANALISI', 'ALGEBRA', 'DEADLINE', 'NaN'][this.gates.length % 4]
			});
			this.spawn = 2.1;
		}
		const halfGap = 91;
		for (const gate of this.gates) {
			gate.x -= speed * dt;
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
		text(ctx, '∫ procrastinazione dt = domani', 180, 110, 12, '#586473');
		text(ctx, '∀ ε > 0, manca sempre poco', 185, this.height - 70, 12, '#586473');
		for (const g of this.gates) {
			rounded(ctx, g.x, -12, 60, g.gap - 91 + 12, colors.green);
			rounded(ctx, g.x, g.gap + 91, 60, this.height - g.gap - 91 + 12, colors.green);
			text(ctx, g.label.slice(0, 5), g.x + 30, g.gap - 120, 10, '#fff9ed');
			text(ctx, '∑', g.x + 30, g.gap + 125, 23, '#fff9ed');
		}
		ctx.circle(85, this.y, 17, colors.gold);
		cap(ctx, 85, this.y - 17, 21);
		text(ctx, 'x', 85, this.y + 6, 17, colors.paper);
	}
}
