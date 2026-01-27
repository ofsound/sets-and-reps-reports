<script lang="ts">
	import * as d3 from 'd3';
	import type { ChartDataPoint } from '$lib/utils/chartData';

	interface Props {
		data: ChartDataPoint[];
		height?: number;
	}

	let { data, height = 500 }: Props = $props();

	// Chart container ref
	let chartContainer: HTMLDivElement | undefined = $state(undefined);

	// Render chart when data or container changes
	$effect(() => {
		if (!chartContainer || data.length === 0) {
			return;
		}

		// Store reference to container for cleanup
		const container = chartContainer;

		// Clear previous chart - necessary for D3 re-rendering
		container.innerHTML = '';

		// Chart dimensions
		const margin = { top: 20, right: 30, bottom: 60, left: 50 };
		let containerWidth = container.clientWidth;
		let width = containerWidth - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;

		// Create SVG
		const svg = d3
			.select(container)
			.append('svg')
			.attr('viewBox', `0 0 ${containerWidth} ${height}`)
			.attr('preserveAspectRatio', 'xMidYMid meet');

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

		// Create chart elements (store references for updates)
		const xGrid = g
			.append('g')
			.attr('class', 'grid')
			.attr('transform', `translate(0,${chartHeight})`);

		const yGrid = g.append('g').attr('class', 'grid');

		const linePath = g
			.append('path')
			.datum(data)
			.attr('fill', 'none')
			.attr('stroke', '#3b82f6')
			.attr('stroke-width', 2);

		const circles = g
			.selectAll('circle')
			.data(data)
			.enter()
			.append('circle')
			.attr('r', 4)
			.attr('fill', '#3b82f6')
			.attr('stroke', '#fff')
			.attr('stroke-width', 2);

		const xAxis = g.append('g').attr('transform', `translate(0,${chartHeight})`);

		const yAxis = g.append('g');

		// Function to redraw chart with new dimensions
		const redraw = () => {
			containerWidth = container.clientWidth;
			width = containerWidth - margin.left - margin.right;

			// Update viewBox
			svg.attr('viewBox', `0 0 ${containerWidth} ${height}`);

			// Update scales with new width
			xScale.range([0, width]);
			yScale.range([chartHeight, 0]);

			// Update line path
			linePath.attr('d', line);

			// Update circles
			circles.attr('cx', (d) => xScale(d.date)).attr('cy', (d) => yScale(d.value));

			// Update grid lines
			xGrid
				.call(
					d3
						.axisBottom(xScale)
						.tickSize(-chartHeight)
						.tickFormat(() => '')
				)
				.selectAll('line')
				.attr('stroke', '#e5e7eb')
				.attr('stroke-dasharray', '3,3');

			yGrid
				.call(
					d3
						.axisLeft(yScale)
						.tickSize(-width)
						.tickFormat(() => '')
				)
				.selectAll('line')
				.attr('stroke', '#e5e7eb')
				.attr('stroke-dasharray', '3,3');

			// Update axes
			xAxis
				.call(d3.axisBottom(xScale).tickFormat((d) => d3.timeFormat('%m/%d/%Y')(d as Date)))
				.selectAll('text')
				.style('text-anchor', 'end')
				.attr('dx', '-.8em')
				.attr('dy', '.15em')
				.attr('transform', 'rotate(-45)');

			yAxis.call(d3.axisLeft(yScale));
		};

		// Initial draw
		redraw();

		// Handle window resize
		const resizeHandler = () => {
			redraw();
		};
		d3.select(window).on('resize', resizeHandler);

		// Cleanup function - remove resize listener and clear container when effect re-runs or component unmounts
		return () => {
			d3.select(window).on('resize', null);
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
