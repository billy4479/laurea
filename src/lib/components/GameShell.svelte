<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { gameInfo, type GameId } from '$lib/games/catalog';
	import type { Game } from '$lib/games/types';
	import type { GameController } from '$lib/games/phaser-client';
	import Leaderboard from './Leaderboard.svelte';

	let { id }: { id: GameId } = $props();
	const info = $derived(gameInfo(id));
	const maxLives = $derived(id === 3 ? 3 : 1);
	let host: HTMLDivElement;
	let controller: GameController | undefined;
	let phase = $state<'ready' | 'playing' | 'paused' | 'won' | 'over'>('ready');
	let ready = $state(false);
	let starting = $state(false);
	let score = $state(0);
	const graduationPercent = $derived(Math.min(100, Math.floor((score / info.goal) * 100)));
	let lives = $state(1);
	let won = $state(false);
	let token = $state<string | undefined>();
	let nickname = $state('');
	let saving = $state(false);
	let saved = $state(false);
	let message = $state('');
	let runtimeError = $state('');
	let showBoard = $state(false);
	let boardVersion = $state(0);
	let disposed = false;
	let requests = new AbortController();

	function frame(game: Game) {
		score = game.score;
		lives = Math.max(0, game.lives);
		if (game.over) {
			won ||= score >= info.goal;
			phase = 'over';
			controller?.setActive(false);
		} else if (!won && score >= info.goal) {
			won = true;
			phase = 'won';
			controller?.setActive(false);
		}
	}
	onMount(() => {
		disposed = false;
		requests = new AbortController();
		lives = maxLives;
		Promise.all([
			import('$lib/games/phaser-client'),
			document.fonts.load('12px BigBlueTerminal').catch(() => [])
		])
			.then(([{ mountGame }]) => {
				if (disposed) return;
				controller = mountGame(host, id, frame);
				ready = true;
			})
			.catch(() => {
				runtimeError = 'Il gioco non si è caricato. Ricarica la pagina per riprovare.';
			});
		return () => {
			disposed = true;
			requests.abort();
			controller?.destroy();
		};
	});
	async function start() {
		if (!ready || starting || saving) return;
		starting = true;
		message = '';
		token = undefined;
		try {
			const response = await fetch('/api/runs', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ game: id }),
				signal: requests.signal
			});
			if (!response.ok) throw new Error();
			token = (await response.json()).token;
		} catch {
			message = 'Giochi senza classifica: il server non risponde. Puoi comunque divertirti.';
		}
		if (disposed) return;
		if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
		controller?.restart();
		score = 0;
		lives = maxLives;
		won = false;
		saved = false;
		showBoard = false;
		starting = false;
		phase = document.hidden ? 'paused' : 'playing';
		controller?.setActive(phase === 'playing');
	}
	function pause() {
		if (phase === 'playing') {
			phase = 'paused';
			controller?.setActive(false);
		}
	}
	function resume() {
		if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
		phase = 'playing';
		controller?.setActive(true);
	}
	function openBoard() {
		pause();
		showBoard = true;
	}
	function keydown(event: KeyboardEvent) {
		if (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLButtonElement ||
			event.target instanceof HTMLAnchorElement ||
			phase !== 'playing'
		)
			return;
		if ([' ', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) event.preventDefault();
		if (event.repeat) return;
		if (event.key === 'Escape') pause();
		else if (event.key === ' ') controller?.input({ type: 'down', x: 180, y: 280 });
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
			controller?.input({ type: event.key === 'ArrowLeft' ? 'left' : 'right', x: 0, y: 0 });
	}
	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (!token || saving || saved) return;
		saving = true;
		message = '';
		try {
			const response = await fetch('/api/scores', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ token, game: id, name: nickname, score }),
				signal: requests.signal
			});
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Non riesco a salvare. Riprova.');
			}
			saved = true;
			showBoard = true;
			boardVersion++;
		} catch (error) {
			message = error instanceof Error ? error.message : 'Connessione assente. Riprova.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head><title>{info.title} · laurea.exe</title></svelte:head>
<svelte:window onkeydown={keydown} onblur={pause} />
<svelte:document
	onvisibilitychange={() => {
		if (document.hidden) pause();
	}}
/>

<main class="play-page" style:--accent={info.color} aria-label={info.title}>
	<div class="phaser-host" bind:this={host}></div>
	<header class="game-toolbar">
		<h1>{info.title}</h1>
		<button
			class="text-button"
			onclick={pause}
			disabled={phase !== 'playing'}
			aria-label="Metti in pausa">[pausa]</button
		>
		<progress
			class="graduation-progress"
			max={info.goal}
			value={Math.min(score, info.goal)}
			aria-label="Progresso verso la laurea"
			aria-valuetext={`${graduationPercent}% verso la laurea`}>{graduationPercent}%</progress
		>
	</header>
	<div class="hud">
		<span><strong>{score}</strong> {info.unit} {won ? '✓' : `/ ${info.goal}`}</span>
		<span class="lives" aria-label={`${lives} vite`}
			>{'●'.repeat(lives)}{'○'.repeat(Math.max(0, maxLives - lives))}</span
		>
	</div>
	{#if phase !== 'playing' || showBoard}
		<div class="game-overlay">
			<div class="overlay-card" aria-live="polite">
				{#if showBoard}
					<h2>classifica</h2>
					{#if phase === 'paused'}
						<p>La tua partita è in pausa. Puoi riprenderla quando vuoi.</p>
					{/if}
					<button
						class="button"
						onclick={() => {
							showBoard = false;
							if (phase === 'paused') resume();
						}}>{phase === 'paused' ? 'Riprendi partita' : '← Torna al gioco'}</button
					>
					{#key `${id}-${boardVersion}`}<Leaderboard {id} />{/key}
					<a class="button secondary" href={resolve('/')}>Menu</a>
				{:else if phase === 'ready'}
					<h2>{info.title}</h2>
					{#if info.instructions}<p>{info.instructions}</p>{/if}
					<p>
						<strong>{info.goal} {info.unit} per la vittoria.</strong>{#if info.controls}<br
							/>{info.controls}{/if}
					</p>
					{#if runtimeError}<p role="alert">{runtimeError}</p>
					{:else}<button class="button" onclick={start} disabled={!ready || starting}
							>{starting ? 'un attimo…' : ready ? '[ start ]' : 'caricamento…'}</button
						>{/if}
					<button class="button secondary" onclick={openBoard}>Classifica</button>
				{:else if phase === 'paused'}
					<h2>// pausa caffè</h2>
					<button class="button" onclick={resume}>Riprendi</button>
					<button
						class="button secondary"
						onclick={() => {
							phase = 'over';
						}}>Termina e salva</button
					>
					<button class="button secondary" onclick={openBoard}>Classifica</button>
					<p class="small">Puoi guardare la classifica senza perdere la partita.</p>
					<a class="button secondary" href={resolve('/')}>Menu</a>
				{:else if phase === 'won'}
					<h2>laurea sbloccata :)</h2>
					<p>{info.victory}</p>
					<button class="button" onclick={resume}>Dottorato infinito →</button>
					<button
						class="button secondary"
						onclick={() => {
							phase = 'over';
						}}>Termina e salva</button
					>
				{:else}
					<h2>{won ? 'ce l’hai fatta :)' : 'game over'}</h2>
					<div class="final-score">{score}<span>{info.unit}</span></div>
					<p>{won ? 'Grazie per aver festeggiato con me!' : info.loss}</p>
					{#if saved}<p class="saved" role="status">✓ Punteggio salvato.</p>
					{:else if token && score > 0}
						<form onsubmit={save} class="score-form">
							<label for="nickname">Nome in classifica <span>(facoltativo)</span></label>
							<div class="name-row">
								<input
									id="nickname"
									bind:value={nickname}
									maxlength="20"
									required
									placeholder="nickname"
									autocomplete="nickname"
								/><button class="button" type="submit" disabled={saving}
									>{saving ? '…' : 'Salva'}</button
								>
							</div>
						</form>
					{/if}
					<div class="result-actions">
						<button class="button" onclick={start} disabled={starting || saving}
							>{starting ? '…' : 'Riprova'}</button
						><a class="button secondary" href={resolve('/')}>Menu</a>
					</div>
					<button class="button secondary" onclick={openBoard}>Classifica</button>
				{/if}
				{#if message}<p class="small" role="status">{message}</p>{/if}
			</div>
		</div>
	{/if}
</main>
