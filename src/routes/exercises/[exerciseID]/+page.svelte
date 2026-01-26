<script lang="ts">
	import { page } from '$app/state';

	import { transformAttemptsToChartData } from '$lib/utils/chartData';
	import { getExercise } from './exercise.remote';

	import * as d3 from 'd3';

	// Use remote function to fetch exercise data
	const exerciseID = $derived(page.params.exerciseID);
	const exerciseQuery = $derived(exerciseID ? getExercise(exerciseID) : null);
	const exercise = $derived(exerciseQuery?.current ?? null);

	// Chart container ref
	let chartContainer: HTMLDivElement | undefined = $state(undefined);

	// Compute chart data from exercise attempts
	const chartData = $derived(exercise ? transformAttemptsToChartData(exercise.attempts) : []);

	// Render chart when chartData or container changes
	$effect(() => {
		if (!chartContainer || !exercise || chartData.length === 0) {
			return;
		}

		// Store reference to SVG for cleanup
		const container = chartContainer;

		// Clear previous chart - necessary for D3 re-rendering
		container.innerHTML = '';

		// Chart dimensions
		const margin = { top: 20, right: 30, bottom: 60, left: 50 };
		const width = container.clientWidth - margin.left - margin.right;
		const height = 400 - margin.top - margin.bottom;

		// Create SVG
		const svg = d3
			.select(container)
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);

		const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		// Set up scales
		const xScale = d3
			.scaleTime()
			.domain(d3.extent(chartData, (d: { date: Date; value: number }) => d.date) as [Date, Date])
			.range([0, width]);

		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(chartData, (d: { date: Date; value: number }) => d.value) || 0])
			.nice()
			.range([height, 0]);

		// Create line generator
		const line = d3
			.line<{ date: Date; value: number }>()
			.x((d: { date: Date; value: number }) => xScale(d.date))
			.y((d: { date: Date; value: number }) => yScale(d.value))
			.curve(d3.curveMonotoneX);

		// Add grid lines
		g.append('g')
			.attr('class', 'grid')
			.attr('transform', `translate(0,${height})`)
			.call(
				d3
					.axisBottom(xScale)
					.tickSize(-height)
					.tickFormat(() => '')
			)
			.selectAll('line')
			.attr('stroke', '#e5e7eb')
			.attr('stroke-dasharray', '3,3');

		g.append('g')
			.attr('class', 'grid')
			.call(
				d3
					.axisLeft(yScale)
					.tickSize(-width)
					.tickFormat(() => '')
			)
			.selectAll('line')
			.attr('stroke', '#e5e7eb')
			.attr('stroke-dasharray', '3,3');

		// Add the line path
		g.append('path')
			.datum(chartData)
			.attr('fill', 'none')
			.attr('stroke', '#3b82f6')
			.attr('stroke-width', 2)
			.attr('d', line);

		// Add circles for data points
		g.selectAll('circle')
			.data(chartData)
			.enter()
			.append('circle')
			.attr('cx', (d: { date: Date; value: number }) => xScale(d.date))
			.attr('cy', (d: { date: Date; value: number }) => yScale(d.value))
			.attr('r', 4)
			.attr('fill', '#3b82f6')
			.attr('stroke', '#fff')
			.attr('stroke-width', 2);

		// Add X axis
		g.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(d3.axisBottom(xScale).tickFormat((d) => d3.timeFormat('%m/%d/%Y')(d as Date)))
			.selectAll('text')
			.style('text-anchor', 'end')
			.attr('dx', '-.8em')
			.attr('dy', '.15em')
			.attr('transform', 'rotate(-45)');

		// Add Y axis
		g.append('g').call(d3.axisLeft(yScale));

		// Cleanup function - remove SVG when effect re-runs or component unmounts
		return () => {
			if (container) {
				container.innerHTML = '';
			}
		};
	});
</script>

{#if exerciseQuery?.loading}
	<p>Loading exercise...</p>
{:else if exerciseQuery?.error}
	<p>Error loading exercise: {exerciseQuery.error.message}</p>
{:else if exercise}
	<div>
		<h1 class="mb-2 text-3xl font-bold">{exercise.name}</h1>
		<!-- <p>Total attempts: {exercise.attempts.length}</p>
		<p>Order: {exercise.order}</p>
		<p>Current: {exercise.isCurrent ? 'Yes' : 'No'}</p> -->

		{#if chartData.length > 0}
			<div class="mt-6">
				<div bind:this={chartContainer} class="w-full overflow-x-auto bg-white p-4 pb-12"></div>
			</div>
		{:else if !exerciseQuery?.loading}
			<div class="mt-6">
				<p class="text-sm text-gray-500">No chart data available</p>
			</div>
		{/if}

		<div class="mt-4">
			<h2 class="mb-2 text-2xl font-semibold">Attempts</h2>
			{#each exercise.attempts as attempt, attemptIndex (attemptIndex)}
				{#if attempt.length > 0}
					<div class="mb-4 rounded border p-4">
						<h3 class="font-semibold">Attempt {attemptIndex + 1}</h3>
						<p class="ml-4 text-sm text-gray-500">
							Date: {new Date(attempt[0].date)
								.toLocaleString(undefined, {
									month: '2-digit',
									day: '2-digit',
									year: 'numeric',
									hour: 'numeric',
									minute: '2-digit',
									hour12: true
								})
								.replace(',', '')
								.replace(
									/(\d{1,2}:\d{2})\s([AP]M)/,
									(_, t, ap) => t.toLowerCase() + ap.toLowerCase()
								)}
						</p>

						{#each attempt as set, setIndex (setIndex)}
							<div class="ml-4">
								<p>
									{set.reps} x {set.measurement}
									{#if set.notes}
										<span class="text-sm text-gray-600">Notes: {set.notes}</span>
									{/if}
								</p>
								<div class="composite">
									{set.reps * parseInt(set.measurement)}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	</div>
{:else}
	<p>Exercise not found.</p>
{/if}
