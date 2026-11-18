<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { gameInfo, type GameId } from '$lib/games/catalog';
	import type { Game } from '$lib/games/types';
	import type { GameController } from '$lib/games/phaser-client';
	import Leaderboard from './Leaderboard.svelte';

	let { id }: { id: GameId } = $props();
	const info = $derived(gameInfo(id));
	let host: HTMLDivElement;
	let controller: GameController | undefined;
	let phase = $state<'ready' | 'playing' | 'paused' | 'won' | 'over'>('ready');
	let ready = $state(false);
	let starting = $state(false);
	let score = $state(0);
	let lives = $state(3);
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
		lives = id === 1 ? 1 : 3;
		import('$lib/games/phaser-client')
			.then(({ mountGame }) => {
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
		lives = id === 1 ? 1 : 3;
		won = false;
		saved = false;
		showBoard = false;
		starting = false;
		phase = document.hidden ? 'paused' : 'playing';
		controller?.setActive(phase === 'playing');
		if (window.innerWidth <= 700) host.closest('.game-column')?.scrollIntoView({ block: 'start' });
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

<svelte:head><title>{info.title} · Laurea all’ultimo minuto</title></svelte:head>
<svelte:window onkeydown={keydown} onblur={pause} />
<svelte:document
	onvisibilitychange={() => {
		if (document.hidden) pause();
	}}
/>

<main class="play-page page" style:--accent={info.color}>
	<header class="masthead">
		<a class="back-link" href={resolve('/')}>← Tutti i giochi</a><a
			class="brand"
			href={resolve('/')}
			aria-label="Menu giochi">L<span class="brand-dot">.</span></a
		><span>GIOCO 0{id} / 03</span>
	</header>
	<div class="play-layout">
		<aside class="game-description">
			<p class="eyebrow">{info.label} / 0{id}</p>
			<h1>{info.title}<span class="brand-dot">.</span></h1>
			<p class="tagline">{info.subtitle}</p>
			<div class="instructions">
				<p class="eyebrow">COME SI GIOCA</p>
				<p>{info.instructions}</p>
				<p class="control-note">{info.controls}</p>
			</div>
			<div class="goal-note">
				<span>✳</span>
				<p>
					<strong>{info.goal} {info.unit} per laurearti.</strong><br />Poi, se vuoi, continui
					all’infinito.
				</p>
			</div>
			<button
				class="text-button"
				onclick={() => {
					pause();
					showBoard = !showBoard;
				}}
			>
				{showBoard ? 'Chiudi classifica ↑' : 'Guarda la classifica ↗'}</button
			>
		</aside>
		<section class="game-column" aria-label={info.title}>
			<div class="hud">
				<span><strong>{score}</strong> {info.unit}</span><span
					class="lives"
					aria-label={`${lives} vite`}
					>{'●'.repeat(lives)}{'○'.repeat(Math.max(0, (id === 1 ? 1 : 3) - lives))}</span
				><button
					class="text-button"
					onclick={pause}
					disabled={phase !== 'playing'}
					aria-label="Metti in pausa">Ⅱ</button
				>
			</div>
			<div class="game-stage">
				<div class="phaser-host" bind:this={host}></div>
				{#if phase !== 'playing'}
					<div class="game-overlay">
						<div class="overlay-card" aria-live="polite">
							{#if phase === 'ready'}
								<span class="overlay-symbol">{info.symbol}</span>
								<p class="eyebrow">PRONTO PER L’APPELLO?</p>
								<h2>Inizio domani.<br />Anzi, adesso.</h2>
								<p>{info.instructions}</p>
								<p>
									<strong>{info.goal} {info.unit} per la vittoria.</strong><br />{info.controls}
								</p>
								{#if runtimeError}<p role="alert">{runtimeError}</p>{:else}<button
										class="button"
										onclick={start}
										disabled={!ready || starting}
										>{starting ? 'Un attimo…' : ready ? 'Si gioca →' : 'Carico il gioco…'}</button
									>{/if}
							{:else if phase === 'paused'}
								<span class="overlay-symbol">Ⅱ</span>
								<h2>Pausa caffè.</h2>
								<p>Il mondo può aspettare ancora un minuto.</p>
								<button class="button" onclick={resume}>Riprendi →</button>
								<button
									class="button secondary"
									onclick={() => {
										phase = 'over';
									}}>Termina e salva</button
								><a class="button secondary" href={resolve('/')}>Menu giochi</a>
							{:else if phase === 'won'}
								<span class="overlay-symbol">✳</span>
								<p class="eyebrow">OBIETTIVO RAGGIUNTO</p>
								<h2>Laureato!</h2>
								<p>{info.victory}</p>
								<button class="button" onclick={resume}>Dottorato infinito →</button><button
									class="button secondary"
									onclick={() => {
										phase = 'over';
									}}>Termina e salva</button
								>
							{:else}
								<p class="eyebrow">{won ? 'MISSIONE COMPIUTA' : 'SESSIONE TERMINATA'}</p>
								<h2>{won ? 'Alla fine, laureato.' : 'Ci si vede al prossimo appello.'}</h2>
								<div class="final-score">{score}<span>{info.unit}</span></div>
								<p>{won ? 'Grazie per aver festeggiato con me!' : info.loss}</p>
								{#if saved}<p class="saved" role="status">✓ Punteggio salvato. Sei sul libretto!</p>
								{:else if token && score > 0}
									<form onsubmit={save} class="score-form">
										<label for="nickname"
											>Il tuo nome in classifica <span>(facoltativo)</span></label
										>
										<div class="name-row">
											<input
												id="nickname"
												bind:value={nickname}
												maxlength="20"
												required
												placeholder="Come ti chiami?"
												autocomplete="nickname"
											/><button class="button" type="submit" disabled={saving}
												>{saving ? '…' : 'Salva'}</button
											>
										</div>
										<p class="small muted">
											Nome e punteggio saranno pubblici. Puoi usare un soprannome.
										</p>
									</form>
								{/if}
								<div class="result-actions">
									<button class="button" onclick={start} disabled={starting || saving}
										>{starting ? 'Un attimo…' : 'Riprova ↻'}</button
									><a class="button secondary" href={resolve('/')}>Menu giochi</a>
								</div>
								<button
									class="text-button"
									onclick={() => {
										showBoard = !showBoard;
									}}>{showBoard ? 'Chiudi classifica' : 'Classifica ↗'}</button
								>
							{/if}
							{#if message}<p class="small" role="status">{message}</p>{/if}
						</div>
					</div>
				{/if}
			</div>
			{#if id === 2}<div class="lane-controls">
					<button
						aria-label="Corsia a sinistra"
						disabled={phase !== 'playing'}
						onclick={() => controller?.input({ type: 'left', x: 0, y: 0 })}>←</button
					><span>OCCHIO ALLE SCADENZE</span><button
						aria-label="Corsia a destra"
						disabled={phase !== 'playing'}
						onclick={() => controller?.input({ type: 'right', x: 0, y: 0 })}>→</button
					>
				</div>{/if}
			<div class="progress-label">
				<span>{won ? 'LAUREA SBLOCCATA ✓' : 'VERSO LA LAUREA'}</span><span
					>{Math.min(100, Math.floor((score / info.goal) * 100))}%</span
				>
			</div>
			<progress
				max={info.goal}
				value={Math.min(score, info.goal)}
				aria-label="Progresso verso la vittoria"
			></progress>
		</section>
	</div>
	{#if showBoard}<div class="board-panel">
			{#key `${id}-${boardVersion}`}<Leaderboard {id} />{/key}
		</div>{/if}
	<footer class="play-footer">Una formula incomprensibile alla volta. Grazie di essere qui.</footer>
</main>
