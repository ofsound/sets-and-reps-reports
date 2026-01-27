<script lang="ts">
	import * as d3 from 'd3';
	import type { ChartDataPoint } from '$lib/utils/chartData';
	import {
		formatAttemptDate,
		formatAttemptDateDay,
		formatAttemptDateTime
	} from '$lib/utils/dataConversions';

	interface Props {
		data: ChartDataPoint[];
		height?: number;
	}

	let { data, height = 500 }: Props = $props();

	// Chart container ref
	let chartContainer: HTMLDivElement | undefined = $state(undefined);

	// Tooltip state
	let tooltipVisible = $state(false);
	let tooltipData = $state<ChartDataPoint | null>(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

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
			.attr('r', 8)
			.attr('fill', '#ffffff')
			.attr('stroke', '#3b82f6')
			.attr('stroke-width', 2)
			.style('cursor', 'pointer')
			.on('mouseover', function (event, d) {
				tooltipVisible = true;
				tooltipData = d;
				tooltipX = event.pageX;
				tooltipY = event.pageY;
			})
			.on('mouseout', function () {
				tooltipVisible = false;
				tooltipData = null;
			});

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

{#if tooltipVisible && tooltipData}
	<div class="tooltip" style="left: {tooltipX + 10}px; top: {tooltipY - 30}px;">
		<div class="mb-0.5 text-[15px]">
			{formatAttemptDate(tooltipData.attempt[0].date)}
		</div>
		<div class="mb-0.5 text-[13px] text-white/80">
			{formatAttemptDateDay(tooltipData.attempt[0].date)}
		</div>
		<div class="mb-2 border-b border-white/20 pb-2 text-xs text-white/70">
			{formatAttemptDateTime(tooltipData.attempt[0].date)}
		</div>
		<div class="flex flex-col gap-1">
			{#each tooltipData.attempt as set, index (index)}
				<div class="text-[13px] font-semibold text-white/95">
					{set.measurement} × {set.reps}
					{#if set.notes}
						<span class="ml-2 text-[11px] font-normal text-white/60 italic">{set.notes}</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.tooltip {
		position: fixed;
		background-color: rgba(15, 23, 42, 0.95);
		color: white;
		padding: 12px 14px;
		border-radius: 6px;
		font-size: 14px;
		pointer-events: none;
		z-index: 1000;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(4px);
		min-width: 180px;
	}
</style>
