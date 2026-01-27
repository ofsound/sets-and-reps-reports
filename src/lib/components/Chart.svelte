<script lang="ts">
	import * as d3 from 'd3';
	import type { ChartDataPoint } from '$lib/utils/chartData';

	interface Props {
		data: ChartDataPoint[];
		height?: number;
	}

	let { data, height = 400 }: Props = $props();

	// Chart container ref
	let chartContainer: HTMLDivElement | undefined = $state(undefined);

	// Render chart when data or container changes
	$effect(() => {
		if (!chartContainer || data.length === 0) {
			return;
		}

		// Store reference to SVG for cleanup
		const container = chartContainer;
		let cancelled = false;

		// Use requestAnimationFrame to ensure DOM is ready
		requestAnimationFrame(() => {
			if (cancelled) return;

			// Clear previous chart - necessary for D3 re-rendering
			container.innerHTML = '';

			// Chart dimensions
			const margin = { top: 20, right: 30, bottom: 60, left: 50 };
			const containerWidth = container.clientWidth;
			const width = containerWidth - margin.left - margin.right;
			const chartHeight = height - margin.top - margin.bottom;

			// Create SVG
			const svg = d3
				.select(container)
				.append('svg')
				.attr('width', containerWidth)
				.attr('height', height);

			const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

			// Set up scales
			const xScale = d3
				.scaleTime()
				.domain(d3.extent(data, (d) => d.date) as [Date, Date])
				.range([0, width]);

			const yScale = d3
				.scaleLinear()
				.domain([0, d3.max(data, (d) => d.value) || 0])
				.nice()
				.range([chartHeight, 0]);

			// Create line generator
			const line = d3
				.line<ChartDataPoint>()
				.x((d) => xScale(d.date))
				.y((d) => yScale(d.value))
				.curve(d3.curveMonotoneX);

			// Add grid lines
			g.append('g')
				.attr('class', 'grid')
				.attr('transform', `translate(0,${chartHeight})`)
				.call(
					d3
						.axisBottom(xScale)
						.tickSize(-chartHeight)
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
				.datum(data)
				.attr('fill', 'none')
				.attr('stroke', '#3b82f6')
				.attr('stroke-width', 2)
				.attr('d', line);

			// Add circles for data points
			g.selectAll('circle')
				.data(data)
				.enter()
				.append('circle')
				.attr('cx', (d) => xScale(d.date))
				.attr('cy', (d) => yScale(d.value))
				.attr('r', 4)
				.attr('fill', '#3b82f6')
				.attr('stroke', '#fff')
				.attr('stroke-width', 2);

			// Add X axis
			g.append('g')
				.attr('transform', `translate(0,${chartHeight})`)
				.call(d3.axisBottom(xScale).tickFormat((d) => d3.timeFormat('%m/%d/%Y')(d as Date)))
				.selectAll('text')
				.style('text-anchor', 'end')
				.attr('dx', '-.8em')
				.attr('dy', '.15em')
				.attr('transform', 'rotate(-45)');

			// Add Y axis
			g.append('g').call(d3.axisLeft(yScale));
		});

		// Cleanup function - remove SVG when effect re-runs or component unmounts
		return () => {
			cancelled = true;
			if (container) {
				container.innerHTML = '';
			}
		};
	});
</script>

{#if data.length > 0}
	<div bind:this={chartContainer} class="w-full overflow-x-auto bg-white p-4 pb-12"></div>
{:else}
	<div class="p-4">
		<p class="text-sm text-gray-500">No chart data available</p>
	</div>
{/if}
