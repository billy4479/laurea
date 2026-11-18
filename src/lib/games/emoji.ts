import Phaser from 'phaser';
import glyphs from './emoji-glyphs.json';

export type EmojiKind = keyof typeof glyphs;
export const emojiTexture = (kind: EmojiKind) => `emoji:${kind}`;
const kinds = Object.keys(glyphs) as EmojiKind[];

export function preloadEmojiTextures(scene: Phaser.Scene) {
	for (const kind of kinds) scene.load.image(emojiTexture(kind), `/fonts/emoji-${kind}.png`);
}

export function createEmojiTextures(scene: Phaser.Scene) {
	for (const kind of kinds)
		scene.textures.get(emojiTexture(kind)).setFilter(Phaser.Textures.FilterMode.NEAREST);
}
