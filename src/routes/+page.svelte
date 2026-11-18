<script lang="ts">
	import { resolve } from '$app/paths';
	import { games } from '$lib/games/catalog';
</script>

<svelte:head>
	<title>laurea.exe</title>
	<meta
		name="description"
		content="Mi sono laureato. Nel dubbio, ho fatto tre giochini. Grazie di essere qui!"
	/>
</svelte:head>

<main class="menu page">
	<h1>laurea.exe<span class="cursor" aria-hidden="true">_</span></h1>
	<p class="muted">// matematica, codice e cose rimandate a domani</p>
	<p>
		Alla fine mi sono laureato.<br />Questi giochini sono un piccolo ricordo. Grazie di essere qui
		:)
	</p>

	<nav aria-label="Scegli un gioco">
		<p class="menu-prompt">Scegli il tuo esame:</p>
		<ol class="game-list">
			{#each games as game (game.id)}
				<li>
					<a href={resolve('/g/[id]', { id: String(game.id) })}>[{game.id}] {game.title}</a>
					<p class="muted">{game.subtitle}<br />Obiettivo: {game.goal} {game.unit}.</p>
				</li>
			{/each}
		</ol>
	</nav>
	<footer>// nessuna voglia di studiare è stata impiegata nella creazione di questa pagina</footer>
</main>
