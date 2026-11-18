import {
	cap,
	colors,
	HEIGHT,
	rounded,
	text,
	type Game,
	type Input,
	type Point,
	type Painter
} from './types';

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
	constructor(private random = Math.random) {}
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
				if (item.bad) this.lives--;
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
		this.spawn -= dt;
		if (this.spawn <= 0) {
			const count = this.elapsed > 12 ? 3 : 2;
			for (let i = 0; i < count; i++) {
				const x = 65 + this.random() * 230;
				this.items.push({
					x,
					y: HEIGHT + 40,
					vx: (180 - x) * 0.45 + (this.random() - 0.5) * 70,
					vy: -510 - this.random() * 110,
					bad: this.random() < 0.22,
					kind: Math.floor(this.random() * 3),
					cut: false
				});
			}
			this.spawn = Math.max(0.8, 1.6 - this.elapsed * 0.006);
		}
		for (const item of this.items) {
			item.vy += 650 * dt;
			item.x += item.vx * dt;
			item.y += item.vy * dt;
			if (!item.cut && !item.bad && item.y > HEIGHT + 60 && item.vy > 0) {
				this.lives--;
				item.cut = true;
			}
		}
		this.items = this.items.filter((item) => item.y < HEIGHT + 65 && !item.cut);
		this.trail.forEach((p) => (p.age -= dt));
		this.trail = this.trail.filter((p) => p.age > 0);
		this.over = this.lives <= 0;
	}
	draw(ctx: Painter) {
		text(ctx, 'UN TAGLIO NETTO CON GLI ESAMI.', 180, 60, 12, '#bcb7a6');
		for (const item of this.items) {
			const { x, y } = item;
			if (item.bad) {
				rounded(ctx, x - 30, y - 27, 60, 54, colors.red, 6);
				text(ctx, item.kind ? '</>' : 'ESAME', x, y + 5, item.kind ? 20 : 12, '#fff9ed');
			} else if (item.kind === 0) {
				rounded(ctx, x - 25, y - 10, 50, 32, '#d79a97', 5);
				rounded(ctx, x - 25, y - 13, 50, 10, '#fffaf1', 4);
				ctx.rect(x - 2, y - 29, 4, 16, colors.gold);
				text(ctx, '✦', x, y - 31, 16, colors.red);
			} else if (item.kind === 1) cap(ctx, x, y, 29);
			else {
				ctx.circle(x, y, 24, colors.gold);
				text(ctx, '✧', x, y + 6, 19);
			}
		}
		if (this.trail.length > 1) {
			ctx.line(this.trail, colors.green, 5);
		}
	}
}
