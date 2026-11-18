// Loaded dynamically in the browser only: Phaser accesses window at import time.
import Phaser from 'phaser';
import { createGame } from './index';
import type { GameId } from './catalog';
import { HEIGHT, WIDTH, type Game, type Input, type Painter, type Point } from './types';

class PhaserPainter implements Painter {
	private graphics: Phaser.GameObjects.Graphics;
	private labels: Phaser.GameObjects.Text[] = [];
	private used = 0;
	constructor(private scene: Phaser.Scene) {
		this.graphics = scene.add.graphics();
	}
	begin() {
		this.graphics.clear();
		this.used = 0;
	}
	end() {
		for (let i = this.used; i < this.labels.length; i++) this.labels[i].setVisible(false);
	}
	private color(value: string) {
		return Number.parseInt(value.slice(1), 16);
	}
	rect(x: number, y: number, w: number, h: number, color: string, radius = 0) {
		this.graphics.fillStyle(this.color(color));
		this.graphics.fillRoundedRect(x, y, w, h, Math.min(radius, w / 2, h / 2));
	}
	circle(x: number, y: number, radius: number, color: string) {
		this.graphics.fillStyle(this.color(color));
		this.graphics.fillCircle(x, y, radius);
	}
	polygon(points: Point[], color: string) {
		this.graphics.fillStyle(this.color(color));
		this.graphics.fillPoints(points, true);
	}
	line(points: Point[], color: string, width: number) {
		this.graphics.lineStyle(width, this.color(color));
		this.graphics.strokePoints(points);
	}
	text(value: string, x: number, y: number, size: number, color: string) {
		let label = this.labels[this.used++];
		if (!label) {
			label = this.scene.add
				.text(0, 0, '', { fontFamily: 'system-ui, sans-serif', fontStyle: 'bold' })
				.setOrigin(0.5, 0.8);
			this.labels.push(label);
		}
		if (label.style.fontSize !== `${size}px` || label.style.color !== color) {
			label.setStyle({ fontSize: `${size}px`, color });
		}
		label.setVisible(true).setPosition(x, y).setText(value);
	}
}

export function mountGame(parent: HTMLElement, id: GameId, onFrame: (game: Game) => void) {
	let model = createGame(id);
	let active = false;
	let accumulator = 0;
	let dragging = false;
	class ArcadeScene extends Phaser.Scene {
		private painter!: PhaserPainter;
		create() {
			this.painter = new PhaserPainter(this);
			this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
				if (active) {
					dragging = true;
					model.input({ type: 'down', x: p.x, y: p.y });
				}
			});
			this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
				if (active && dragging) model.input({ type: 'move', x: p.x, y: p.y });
			});
			const release = () => {
				dragging = false;
				model.input({ type: 'up', x: 0, y: 0 });
			};
			this.input.on('pointerup', release);
			this.input.on('pointerupoutside', release);
			this.input.on('gameout', release);
			this.game.canvas.setAttribute(
				'aria-label',
				'Area di gioco. Istruzioni e punteggio sono disponibili sopra e sotto.'
			);
		}
		update(_time: number, delta: number) {
			if (!this.painter) return;
			if (active) {
				accumulator += Math.min(delta / 1000, 0.08);
				while (accumulator >= 1 / 60 && active) {
					model.update(1 / 60);
					accumulator -= 1 / 60;
					onFrame(model);
				}
			}
			this.painter.begin();
			model.draw(this.painter);
			this.painter.end();
		}
	}
	const phaser = new Phaser.Game({
		type: Phaser.AUTO,
		parent,
		width: WIDTH,
		height: HEIGHT,
		backgroundColor: '#f1f0e5',
		scene: ArcadeScene,
		scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
		input: { keyboard: false, activePointers: 1 },
		render: { antialias: true },
		audio: { noAudio: true },
		banner: false
	});
	return {
		restart() {
			model = createGame(id);
			accumulator = 0;
			dragging = false;
		},
		setActive(value: boolean) {
			active = value;
			accumulator = 0;
			dragging = false;
			model.input({ type: 'up', x: 0, y: 0 });
		},
		input(input: Input) {
			if (active) model.input(input);
		},
		destroy() {
			phaser.destroy(true);
		}
	};
}
export type GameController = ReturnType<typeof mountGame>;
