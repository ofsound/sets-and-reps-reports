<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header class="mb-6 flex items-center justify-between border-b bg-gray-100 px-4 py-3">
	<h1 class="text-2xl font-bold text-gray-800">Sets and Reps Tracker</h1>
	<a
		href="/"
		class="rounded bg-sky-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
	>
		Home
	</a>
</header>

{@render children()}
