<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { getExercises } from './exercises.remote';
	import { page } from '$app/state';

	let { children } = $props();

	// Fetch exercises list for navigation menu using remote function
	const exercisesQuery = getExercises();
	const exercises = $derived(exercisesQuery.current ?? []);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header class="mb-6 border-b border-b-stone-200 bg-gray-100 px-4 py-3">
	<nav class="flex flex-wrap gap-2">
		{#if exercisesQuery.loading}
			<span class="text-sm text-gray-500">Loading exercises...</span>
		{:else if exercisesQuery.error}
			<span class="text-sm text-red-500">Error loading exercises</span>
		{:else}
			{#each exercises as exercise (exercise.id)}
				{@const active = page.url.pathname === `/exercises/${exercise.id}`}
				<a
					href="/exercises/{exercise.id}"
					class="rounded px-3 py-1 text-sm font-medium transition-colors {active
						? 'bg-blue-600 text-white hover:bg-blue-700'
						: 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'}"
				>
					{exercise.name}
				</a>
			{/each}
		{/if}
	</nav>
</header>

<main class="p-4">
	{@render children()}
</main>
