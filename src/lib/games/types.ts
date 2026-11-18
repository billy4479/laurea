export const WIDTH = 360;
export const HEIGHT = 560;
export type Point = { x: number; y: number };
export type Input = { type: 'down' | 'move' | 'up' | 'left' | 'right'; x: number; y: number };
export interface Painter {
	rect(x: number, y: number, w: number, h: number, color: string, radius?: number): void;
	circle(x: number, y: number, radius: number, color: string): void;
	polygon(points: Point[], color: string): void;
	line(points: Point[], color: string, width: number): void;
	text(value: string, x: number, y: number, size: number, color: string, rotation?: number): void;
}
export interface Game {
	score: number;
	lives: number;
	over: boolean;
	update(dt: number): void;
	input(input: Input): void;
	draw(painter: Painter): void;
}
export const colors = {
	ink: '#d8dee9',
	red: '#923744',
	green: '#3d704c',
	gold: '#e0af68',
	paper: '#101318'
};
export function text(
	p: Painter,
	value: string,
	x: number,
	y: number,
	size = 16,
	color = colors.ink,
	rotation = 0
) {
	p.text(value, x, y, size, color, rotation);
}
export function rounded(
	p: Painter,
	x: number,
	y: number,
	w: number,
	h: number,
	color: string,
	r = 10
) {
	p.rect(x, y, w, h, color, r);
}
export function cap(p: Painter, x: number, y: number, size = 24, color = colors.ink) {
	p.polygon(
		[
			{ x: x - size, y },
			{ x, y: y - size / 2 },
			{ x: x + size, y },
			{ x, y: y + size / 2 }
		],
		color
	);
	p.rect(x - size / 2, y + size / 2, size, size / 4, color);
	p.line(
		[
			{ x: x + size, y },
			{ x: x + size, y: y + size * 0.8 }
		],
		colors.gold,
		3
	);
}
