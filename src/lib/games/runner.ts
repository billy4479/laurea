import { cap, colors, HEIGHT, rounded, text, type Game, type Input, type Painter } from './types';

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
	private startX = 0;
	constructor(private random = Math.random) {}
	input(input: Input) {
		if (input.type === 'left') this.lane = Math.max(0, this.lane - 1);
		if (input.type === 'right') this.lane = Math.min(2, this.lane + 1);
		if (input.type === 'down') this.startX = input.x;
		if (input.type === 'move' && Math.abs(input.x - this.startX) > 28) {
			this.lane = Math.max(0, Math.min(2, this.lane + Math.sign(input.x - this.startX)));
			this.startX = input.x;
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
				label: ['ESAME', 'BUG', 'TESI?'][Math.floor(this.random() * 3)]
			});
			this.spawn = Math.max(0.48, 1.05 - this.elapsed * 0.004);
		}
		for (const item of this.obstacles) {
			item.y += Math.min(330, 170 + this.elapsed * 1.5) * dt;
			if (item.lane === this.lane && Math.abs(item.y - 466) < 31) {
				if (item.coffee) {
					this.bonus += 10;
					item.y = HEIGHT + 100;
				} else if (this.invulnerable <= 0) {
					this.lives--;
					this.invulnerable = 1.2;
					item.y = HEIGHT + 100;
				}
			}
		}
		this.obstacles = this.obstacles.filter((item) => item.y < HEIGHT + 50);
		this.score = Math.floor(this.elapsed * 3) + this.bonus;
		this.over = this.lives <= 0;
	}
	draw(ctx: Painter) {
		for (let lane = 0; lane < 3; lane++) {
			rounded(ctx, 17 + lane * 110, 0, 106, HEIGHT, lane % 2 ? '#e6e9ec' : '#eef0ea');
			text(ctx, ['IERI', 'OGGI', 'DOMANI'][lane], 70 + lane * 110, 32, 10, '#88988e');
		}
		for (const x of [125, 235]) {
			for (let y = (this.elapsed * 170) % 30; y < HEIGHT; y += 30)
				ctx.line(
					[
						{ x, y },
						{ x, y: y + 12 }
					],
					'#c9d2c8',
					2
				);
		}
		for (const item of this.obstacles) {
			const x = 70 + item.lane * 110;
			if (item.coffee) {
				rounded(ctx, x - 19, item.y - 20, 38, 38, colors.gold, 8);
				text(ctx, 'C', x, item.y + 7, 24);
				text(ctx, '+10', x, item.y - 27, 11, colors.green);
			} else {
				rounded(ctx, x - 43, item.y - 24, 86, 48, colors.red, 8);
				text(ctx, item.label, x, item.y + 5, 13, '#fff9ed');
			}
		}
		if (this.invulnerable <= 0 || Math.floor(this.invulnerable * 12) % 2 === 0) {
			rounded(ctx, 70 + this.lane * 110 - 18, 451, 36, 40, '#6476ad');
			cap(ctx, 70 + this.lane * 110, 447, 25);
		}
	}
}
