import { colors, HEIGHT, rounded, type Game, type Input, type Point, type Painter } from './types';

type Treat = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	bad: boolean;
	kind: number;
	cut: boolean;
};
export function segmentDistance(p: Point, a: Point, b: Point) {
	const dx = b.x - a.x,
		dy = b.y - a.y;
	const t = Math.max(
		0,
		Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1))
	);
	return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
export class Slice implements Game {
	score = 0;
	lives = 3;
	over = false;
	elapsed = 0;
	spawn = 0.2;
	items: Treat[] = [];
	trail: (Point & { age: number })[] = [];
	private previous: Point | null = null;
	constructor(
		private random = Math.random,
		private height = HEIGHT
	) {}
	input(input: Input) {
		if (input.type === 'up') {
			this.previous = null;
			return;
		}
		if (input.type === 'down') {
			this.previous = input;
			return;
		}
		if (input.type !== 'move' || !this.previous || this.over) return;
		for (const item of this.items) {
			if (!item.cut && segmentDistance(item, this.previous, input) < 30) {
				item.cut = true;
				if (item.bad) this.lives = Math.max(0, this.lives - 1);
				else this.score += 10;
			}
		}
		this.trail.push({ x: input.x, y: input.y, age: 0.18 });
		this.previous = input;
		this.over = this.lives <= 0;
	}
	update(dt: number) {
		if (this.over) return;
		this.elapsed += dt;
		// Speed up the whole simulation, preserving the height of each arc.
		const step = dt * Math.min(1.7, 1 + this.elapsed * 0.012);
		this.spawn -= step;
		if (this.spawn <= 0) {
			const count = Math.min(5, 2 + Math.floor(this.elapsed / 12));
			for (let i = 0; i < count; i++) {
				// Start apart, then cross near the top of the arc and fan out again.
				const x = 95 + i * (170 / (count - 1)) + (this.random() - 0.5) * 16;
				this.items.push({
					x,
					y: this.height + 40,
					vx: (180 - x) / (1.05 + this.random() * 0.15),
					vy: -680 - this.random() * 100,
					bad: this.random() < 0.22,
					kind: Math.floor(this.random() * 3),
					cut: false
				});
			}
			this.spawn = 1.6;
		}
		for (const item of this.items) {
			item.vy += 650 * step;
			item.x += item.vx * step;
			item.y += item.vy * step;
			if (!item.cut && !item.bad && item.y > this.height + 30 && item.vy > 0) {
				this.lives = Math.max(0, this.lives - 1);
				item.cut = true;
			}
		}
		this.items = this.items.filter((item) => item.y < this.height + 65 && !item.cut);
		this.trail.forEach((p) => (p.age -= dt));
		this.trail = this.trail.filter((p) => p.age > 0);
		this.over = this.lives <= 0;
	}
	draw(ctx: Painter) {
		for (const item of this.items) {
			const { x, y } = item;
			if (item.bad) {
				rounded(ctx, x - 30, y - 27, 60, 54, colors.red, 6);
				ctx.emoji(item.kind ? 'code' : 'exam', x, y, 44);
			} else {
				ctx.emoji(item.kind === 0 ? 'cake' : item.kind === 1 ? 'graduate' : 'candy', x, y, 54);
			}
		}
		if (this.trail.length > 1) {
			ctx.line(this.trail, colors.ink, 3);
		}
	}
}
