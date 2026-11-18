import { colors, HEIGHT, rounded, text, type Game, type Input, type Painter } from './types';

export const obstacleLabels = [
	'ESAME',
	'BUG',
	'TESI?',
	'Ax = λx',
	'∇L(θ) = 0',
	'∫₀¹ x²dx\n= 1/3',
	'sin²x +\ncos²x = 1'
] as const;

type Obstacle = { lane: number; y: number; coffee: boolean; label: string };
export class Runner implements Game {
	score = 0;
	lives = 3;
	over = false;
	lane = 1;
	elapsed = 0;
	bonus = 0;
	spawn = 0.7;
	invulnerable = 0;
	obstacles: Obstacle[] = [];
	private startX: number | null = null;
	private swiped = false;
	constructor(
		private random = Math.random,
		private height = HEIGHT
	) {}
	input(input: Input) {
		if (input.type === 'left') this.lane = Math.max(0, this.lane - 1);
		if (input.type === 'right') this.lane = Math.min(2, this.lane + 1);
		if (input.type === 'down') {
			this.startX = input.x;
			this.swiped = false;
		}
		if (input.type === 'up') this.startX = null;
		if (
			input.type === 'move' &&
			this.startX !== null &&
			!this.swiped &&
			Math.abs(input.x - this.startX) > 28
		) {
			this.lane = Math.max(0, Math.min(2, this.lane + Math.sign(input.x - this.startX)));
			this.swiped = true;
		}
	}
	update(dt: number) {
		if (this.over) return;
		this.elapsed += dt;
		this.spawn -= dt;
		this.invulnerable = Math.max(0, this.invulnerable - dt);
		if (this.spawn <= 0) {
			this.obstacles.push({
				lane: Math.floor(this.random() * 3),
				y: -45,
				coffee: this.random() < 0.3,
				label: obstacleLabels[Math.floor(this.random() * obstacleLabels.length)]
			});
			this.spawn = Math.max(0.48, 1.05 - this.elapsed * 0.004);
		}
		for (const item of this.obstacles) {
			item.y += Math.min(330, 170 + this.elapsed * 1.5) * dt;
			if (item.lane === this.lane && Math.abs(item.y - (this.height - 94)) < 31) {
				if (item.coffee) {
					this.bonus += 10;
					item.y = this.height + 100;
				} else if (this.invulnerable <= 0) {
					this.lives--;
					this.invulnerable = 1.2;
					item.y = this.height + 100;
				}
			}
		}
		this.obstacles = this.obstacles.filter((item) => item.y < this.height + 50);
		this.score = Math.floor(this.elapsed * 3) + this.bonus;
		this.over = this.lives <= 0;
	}
	draw(ctx: Painter) {
		for (let lane = 0; lane < 3; lane++) {
			rounded(ctx, 17 + lane * 110, 0, 106, this.height, lane % 2 ? '#171d25' : '#131820');
		}
		for (const x of [125, 235]) {
			for (let y = (this.elapsed * 170) % 30; y < this.height; y += 30)
				ctx.line(
					[
						{ x, y },
						{ x, y: y + 12 }
					],
					'#39414e',
					2
				);
		}
		for (const item of this.obstacles) {
			const x = 70 + item.lane * 110;
			if (item.coffee) {
				ctx.emoji('coffee', x, item.y, 38);
				text(ctx, '+10', x, item.y - 30, 12, colors.gold);
			} else {
				rounded(ctx, x - 43, item.y - 24, 86, 48, colors.red, 8);
				if (['ESAME', 'BUG', 'TESI?'].includes(item.label)) {
					ctx.emoji(
						item.label === 'BUG' ? 'bug' : item.label === 'TESI?' ? 'code' : 'exam',
						x - 23,
						item.y,
						32
					);
					text(ctx, item.label, x + 18, item.y + 5, 12, '#fff9ed');
				} else text(ctx, item.label, x, item.y + 5, 12, '#fff9ed');
			}
		}
		if (this.invulnerable <= 0 || Math.floor(this.invulnerable * 12) % 2 === 0) {
			ctx.emoji('runner', 70 + this.lane * 110, this.height - 94, 46);
		}
	}
}
