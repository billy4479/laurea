import { gameInfo } from './catalog';
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

const BASE_SPEED = 170;
const ACCELERATION = 3;
const MAX_SPEED = 420;
const OBSTACLE_SPACING = 180;

function roadDistance(time: number) {
	const accelerating = Math.min(time, (MAX_SPEED - BASE_SPEED) / ACCELERATION);
	return (
		BASE_SPEED * accelerating +
		(ACCELERATION * accelerating ** 2) / 2 +
		MAX_SPEED * (time - accelerating)
	);
}

type Obstacle = { lane: number; y: number; coffee: boolean; label: string };
export class Runner implements Game {
	score = 0;
	lives = 1;
	over = false;
	lane = 1;
	elapsed = 0;
	bonus = 0;
	spawn = BASE_SPEED * 0.7; // World pixels until the next obstacle.
	obstacles: Obstacle[] = [];
	private startX: number | null = null;
	private swiped = false;
	constructor(
		private random = Math.random,
		private height = HEIGHT
	) {}
	get distance() {
		return roadDistance(this.elapsed);
	}
	get finishY() {
		const targetTime = Math.max(0, (gameInfo(2).goal - this.bonus) / 3);
		return this.height - 94 - (roadDistance(targetTime) - this.distance);
	}
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
		const previousDistance = this.distance;
		this.elapsed += dt;
		const distance = this.distance - previousDistance;
		for (const item of this.obstacles) item.y += distance;
		this.spawn -= distance;
		while (this.spawn <= 0) {
			this.obstacles.push({
				lane: Math.floor(this.random() * 3),
				y: -45 - this.spawn,
				coffee: this.random() < 0.3,
				label: obstacleLabels[Math.floor(this.random() * obstacleLabels.length)]
			});
			this.spawn += OBSTACLE_SPACING;
		}
		for (const item of this.obstacles) {
			if (item.lane === this.lane && Math.abs(item.y - (this.height - 94)) < 31) {
				if (item.coffee) {
					this.bonus += 10;
					item.y = this.height + 100;
				} else {
					this.lives = 0;
					this.over = true;
					break;
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
			for (let y = this.distance % 30; y < this.height; y += 30)
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
		const finishY = this.finishY;
		if (finishY >= 0 && finishY <= this.height) {
			for (let x = 17; x < 343; x += 28) {
				ctx.line(
					[
						{ x, y: finishY },
						{ x: Math.min(x + 16, 343), y: finishY }
					],
					'#ff5252',
					3
				);
			}
			text(ctx, 'LAUREA', 180, finishY - 12, 12, '#ff5252');
		}
		ctx.emoji('runner', 70 + this.lane * 110, this.height - 94, 46);
	}
}
