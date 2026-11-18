<script lang="ts">
	import { resolve } from '$app/paths';
	import { games } from '$lib/games/catalog';
</script>

<svelte:head>
	<title>laurea.exe</title>
</svelte:head>

<main class="menu page">
	<h1>laurea.exe<span class="cursor" aria-hidden="true">_</span></h1>
	<p class="muted">// matematica, AI, bocconi <s>e bocchini</s></p>

	<nav aria-label="Scegli un gioco">
		<p class="menu-prompt">Scegli il tuo esame:</p>
		<ol class="game-list">
			{#each games as game (game.id)}
				<li>
					<a href={resolve('/g/[id]', { id: String(game.id) })}>[{game.id}] {game.title}</a>
					<p class="muted">
						{#if game.subtitle}{game.subtitle}<br />{/if}Obiettivo: {game.goal}
						{game.unit}.
					</p>
				</li>
			{/each}
		</ol>
	</nav>
	<footer>Made with poca voglia di studiare e tanto tempo da perdere</footer>
</main>
