// Loaded dynamically in the browser only: Phaser accesses window at import time.
import Phaser from 'phaser';
import { createGame } from './index';
import { createEmojiTextures, preloadEmojiTextures, emojiTexture, type EmojiKind } from './emoji';
import type { GameId } from './catalog';
import { HEIGHT, WIDTH, type Game, type Input, type Painter, type Point } from './types';

class PhaserPainter implements Painter {
	private graphics: Phaser.GameObjects.Graphics;
	private labels: Phaser.GameObjects.Text[] = [];
	private used = 0;
	private sprites: Phaser.GameObjects.Image[] = [];
	private usedSprites = 0;
	constructor(private scene: Phaser.Scene) {
		this.graphics = scene.add.graphics();
		createEmojiTextures(scene);
	}
	begin() {
		this.graphics.clear();
		this.used = 0;
		this.usedSprites = 0;
	}
	end() {
		for (let i = this.used; i < this.labels.length; i++) this.labels[i].setVisible(false);
		for (let i = this.usedSprites; i < this.sprites.length; i++) this.sprites[i].setVisible(false);
	}
	emoji(kind: EmojiKind, x: number, y: number, size: number) {
		let sprite = this.sprites[this.usedSprites++];
		if (!sprite) {
			sprite = this.scene.add.image(x, y, emojiTexture(kind)).setDepth(1);
			this.sprites.push(sprite);
		}
		sprite
			.setTexture(emojiTexture(kind))
			.setPosition(x, y)
			.setDisplaySize(size, size)
			.setVisible(true);
	}
	private color(value: string) {
		return Number.parseInt(value.slice(1), 16);
	}
	rect(x: number, y: number, w: number, h: number, color: string) {
		this.graphics.fillStyle(this.color(color));
		this.graphics.fillRect(x, y, w, h);
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
	text(value: string, x: number, y: number, size: number, color: string, rotation = 0) {
		// BigBlue's native grid is 8×12. Avoid fractional font sizes and fake bold.
		size = Math.max(12, Math.round(size / 12) * 12);
		const resolution = Math.max(1, Math.ceil(this.scene.cameras.main.zoom));
		let label = this.labels[this.used++];
		if (!label) {
			label = this.scene.add
				.text(0, 0, '', { fontFamily: 'BigBlueTerminal, monospace', resolution, align: 'center' })
				.setOrigin(0.5, 0.8)
				.setDepth(2);
			label.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
			this.labels.push(label);
		}
		if (label.style.resolution !== resolution) label.setResolution(resolution);
		if (label.style.fontSize !== `${size}px` || label.style.color !== color) {
			label.setStyle({ fontSize: `${size}px`, color });
		}
		label
			.setVisible(true)
			.setOrigin(0.5, rotation ? 0.5 : 0.8)
			.setRotation(rotation)
			.setPosition(x, y)
			.setText(value);
	}
}

export function mountGame(parent: HTMLElement, id: GameId, onFrame: (game: Game) => void) {
	// Keep a phone-width world, extending its height on tall mobile screens.
	const height = Math.max(HEIGHT, (WIDTH * parent.clientHeight) / Math.max(1, parent.clientWidth));
	let model = createGame(id, height);
	let active = false;
	let accumulator = 0;
	let dragging = false;
	let observer: ResizeObserver | undefined;
	const density = Math.min(3, window.devicePixelRatio || 1);
	class ArcadeScene extends Phaser.Scene {
		private painter!: PhaserPainter;
		preload() {
			preloadEmojiTextures(this);
		}
		create() {
			this.painter = new PhaserPainter(this);
			const resize = () => {
				this.cameras.main.setZoom(Math.min(this.scale.width / WIDTH, this.scale.height / height));
				this.cameras.main.centerOn(WIDTH / 2, height / 2);
			};
			resize();
			// RESIZE mode uses CSS pixels for the backing canvas. Manage physical
			// pixels explicitly instead, letting Phaser map touch coordinates back.
			observer = new ResizeObserver(() => {
				const dpr = Math.min(3, window.devicePixelRatio || 1);
				const width = Math.max(1, Math.round(parent.clientWidth * dpr));
				const height = Math.max(1, Math.round(parent.clientHeight * dpr));
				if (this.scale.zoom !== 1 / dpr) this.scale.setZoom(1 / dpr);
				if (this.scale.width !== width || this.scale.height !== height)
					this.scale.resize(width, height);
			});
			observer.observe(parent);
			this.scale.on('resize', resize);
			this.events.once('shutdown', () => this.scale.off('resize', resize));
			this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
				if (active) {
					dragging = true;
					const point = this.cameras.main.getWorldPoint(p.x, p.y);
					model.input({ type: 'down', x: point.x, y: point.y });
				}
			});
			this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
				if (active && dragging) {
					const point = this.cameras.main.getWorldPoint(p.x, p.y);
					model.input({ type: 'move', x: point.x, y: point.y });
				}
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
		width: Math.round(parent.clientWidth * density),
		height: Math.round(parent.clientHeight * density),
		backgroundColor: '#101318',
		scene: ArcadeScene,
		scale: { mode: Phaser.Scale.NONE, zoom: 1 / density },
		input: { keyboard: false, activePointers: 1 },
		render: { antialias: false, pixelArt: true, roundPixels: true },
		audio: { noAudio: true },
		banner: false
	});
	return {
		restart() {
			model = createGame(id, height);
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
			observer?.disconnect();
			phaser.destroy(true);
		}
	};
}
export type GameController = ReturnType<typeof mountGame>;
