<script lang="ts">
	import { resolve } from '$app/paths';
	import { games } from '$lib/games/catalog';
</script>

<svelte:head>
	<title>Laurea, all’ultimo minuto · La sala giochi</title>
	<meta
		name="description"
		content="Tre giochi, qualche formula incomprensibile e una laurea conquistata all’ultimo minuto. Un piccolo ricordo della mia festa."
	/>
</svelte:head>

<main class="menu page">
	<header class="masthead">
		<a class="brand" href={resolve('/')}>L<span class="brand-dot">.</span></a><span
			>UN PICCOLO RICORDO, DA GIOCARE</span
		><span class="edition">EDIZIONE LAUREA</span>
	</header>
	<section class="intro">
		<p class="eyebrow">MATEMATICA · CODICE · PROCRASTINAZIONE</p>
		<h1>Alla fine,<br />mi sono <em>laureato.</em><span class="asterisk">✳</span></h1>
		<p class="intro-copy">
			Dicevo sempre «inizio domani». Oggi invece si festeggia.<br class="desktop-break" /> Tre giochi,
			zero esami. Grazie di essere qui.
		</p>
		<div class="handnote">∫ studio dt = ce l’abbiamo fatta</div>
	</section>
	<section class="selection" aria-label="Scegli un gioco">
		<div class="section-label">
			<span>IL PROGRAMMA DI OGGI</span><span>TRE GIOCHI. PROVALI TUTTI.</span>
		</div>
		<div class="game-grid">
			{#each games as game (game.id)}
				<a
					class="game-card"
					href={resolve('/g/[id]', { id: String(game.id) })}
					style:--accent={game.color}
				>
					<div class="card-top"><span>0{game.id} / {game.label}</span><span>↗</span></div>
					<div class="game-art" aria-hidden="true">
						<span class="art-formula"
							>{game.id === 1 ? '∑ CFU' : game.id === 2 ? 't → 0' : '∂ / ∂ torta'}</span
						><span class="art-symbol">{game.symbol}</span><span class="art-orbit"></span>
					</div>
					<h2>{game.title}</h2>
					<p>{game.subtitle}</p>
					<div class="card-bottom">
						<span>{game.goal} {game.unit} PER LA GLORIA</span><span class="play-link"
							>Giochiamo →</span
						>
					</div>
				</a>
			{/each}
		</div>
	</section>
	<footer class="menu-footer">
		<span>Non serve capire le formule. Nemmeno io, prima del caffè.</span><span
			>FATTO CON CALMA. ALL’ULTIMO MINUTO.</span
		>
	</footer>
</main>
