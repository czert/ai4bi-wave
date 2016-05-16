import d3 from 'd3'
import R from 'ramda'
import stories from './data.json'
import './main.styl'
import $ from 'jquery'


window.d3 = d3; window.R = R; window.$ = $;


const sum = R.reduce(R.add, 0)
const square = x => x * x
const rms = list => Math.sqrt(sum(R.map(square, list)) / list.length)


export default function main() {
    let data = R.compose(
		R.filter(  // filter out series where all points are zero
			R.any(
				R.compose(
					R.complement(R.equals(0)),
					R.prop('value')
				)
			)
		),
		R.map(story => story.reported_values)
	)(stories)

	const stack = d3.layout.stack().offset('zero')
	const sort = R.sortBy(series => rms(R.map(R.prop('y'), series)))

	let positive = R.map(
		R.compose(
			R.take(10),
			R.map(
				({value, reference_date}) => ({x: new Date(reference_date), y: value > 0 ? value : 0})
			)
		)
	)(data)
	positive = R.mapAccum((counter, series) => [counter + 1, R.map(item => R.merge(item, {series: counter}), series)], 0, positive)[1]
	positive = R.reverse(sort(positive))
	let rest = R.takeLastWhile(s => rms(R.map(R.prop('y'), s)) < 100000, positive)
	positive = R.slice(0, -1 * rest.length, positive)
	positive.push(R.map(col => ({x: col[0].x, y: sum(R.map(R.prop('y'), col))}), R.transpose(rest)))
	positive = stack(positive)


	let negative = R.map(
		R.compose(
			R.take(10),
			R.map(
				({value, reference_date}) => ({x: new Date(reference_date), y: value < 0 ? -1 * value : 0})
			)
		)
	)(data)
	negative = R.mapAccum((counter, series) => [counter + 1, R.map(item => R.merge(item, {series: counter}), series)], 0, negative)[1]
	negative = R.reverse(sort(negative))
	let rest_neg = R.takeLastWhile(s => rms(R.map(R.prop('y'), s)) < 100000, negative)
	negative = R.slice(0, -1 * rest_neg.length, negative)
	negative.push(R.map(col => ({x: col[0].x, y: sum(R.map(R.prop('y'), col))}), R.transpose(rest_neg)))
	negative = stack(negative)

	window.data = data;
	window.positive = positive;
	window.negative = negative;

	var width = 1200,
		height = 800;

	var x = d3.time.scale()
			.domain(
				d3.extent(R.unnest(positive), R.prop('x'))
			)
			.range([0, width])


	const neg_max = d3.max(R.map(o => o.y0 + o.y, R.last(negative)))
	const pos_max = d3.max(R.map(o => o.y0 + o.y, R.last(positive)))
	console.log(
		neg_max,
		pos_max
	)

	var y = d3.scale.linear()
			.domain(
				[
					0,
					pos_max
				]
			)
			.range([height * pos_max / (pos_max + neg_max), 0])


	const pixel = y.invert(0) - y.invert(1)
	positive = R.map(R.map(point => R.merge(point, {y: point.y + pixel})))(positive)
	negative = R.map(R.map(point => R.merge(point, {y0: point.y0 - pixel, y: point.y + pixel})))(negative)

	var y_neg = d3.scale.linear()
			.domain(
				[
					0,
					neg_max
				]
			)
			.range([height * pos_max / (pos_max + neg_max), height])

	var color = d3.scale.linear().range(["#0d3c55", "#117899"])
	var color_neg = d3.scale.linear().range(["#f16c20", "#c03e1d"])

	const interpolation_method = 'monotone'

	var area = d3.svg.area()
			.x(R.compose(x, R.prop('x')))
			.y0(R.compose(y, R.prop('y0')))
			.y1(R.compose(y, o => o.y0 + o.y))
			.interpolate(interpolation_method)

	var area_neg = d3.svg.area()
			.x(R.compose(x, R.prop('x')))
			.y0(R.compose(y_neg, R.prop('y0')))
			.y1(R.compose(y_neg, o => o.y0 + o.y))
			.interpolate(interpolation_method)

	var svg = d3.select("body").append("svg")
			.attr("width", width)
			.attr("height", height);

	var g_pos = svg.append('g')
	var g_neg = svg.append('g')

	g_pos.selectAll("path")
	    .data(positive)
		.enter().append("path")
	    .attr('class', (series) => 'positive series series' + series[0].series)
	    .attr('data-series-index', (series) => series[0].series)
	    .attr("d", area)
	    .style("fill", (series, i) => {
			if (i < positive.length - 1)
				return color((i % 2 ? (i/2) : (i/2 + positive.length / 2)) / positive.length)
				//return color((i^1) / positive.length)
				//return color((rms(R.map(R.prop('y'), series)) % 100) / 100)
			else
				return '#ddd'
		});

	g_neg.selectAll("path")
	    .data(negative)
		.enter().append("path")
	    .attr('class', (series) => 'negative series series' + series[0].series)
	    .attr('data-series-index', (series) => series[0].series)
	    .attr("d", area_neg)
	    .style("fill", (series, i) => {
			if (i < negative.length - 1)
				return color_neg((i % 2 ? (i/2) : (i/2 + negative.length / 2)) / negative.length)
				//return color_neg(i / negative.length)
			else
				return '#ddd'
		});

	$('svg').on('mouseenter', '.series', e => {
		$('svg path.series.series' + $(e.target).data('series-index')).addClass('hover')
	})
	$('svg').on('mouseleave', '.series', e => {
		$('svg path.series.series' + $(e.target).data('series-index')).removeClass('hover')
	})

}
