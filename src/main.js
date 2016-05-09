import d3 from 'd3'
import R from 'ramda'
import stories from './data.json'
import './main.styl'


window.d3 = d3; window.R = R;

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

	const positive = stack(R.map(
		R.compose(
			R.take(10),
			R.map(
				({value, reference_date}) => ({x: new Date(reference_date), y: value > 0 ? value : 0})
			)
		)
	)(data))

	const negative = stack(R.map(
		R.compose(
			R.take(10),
			R.map(
				({value, reference_date}) => ({x: new Date(reference_date), y: value < 0 ? -1 * value : 0})
			)
		)
	)(data))

	console.log(d3.max(R.unnest(positive), R.prop('y')))
	console.log(d3.min(R.unnest(negative), R.prop('y')))

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

	var y_neg = d3.scale.linear()
			.domain(
				[
					0,
					neg_max
				]
			)
			.range([height * pos_max / (pos_max + neg_max), height])

	var color = d3.scale.linear().range(["#ac3", "#3ca"])
	var color_neg = d3.scale.linear().range(["#c93", "#c39"])

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
	    .data(stack(positive))
		.enter().append("path")
	    .attr("d", area)
	    .style("fill", function() { return color(Math.random()); });

	g_neg.selectAll("path")
	    .data(stack(negative))
		.enter().append("path")
	    .attr("d", area_neg)
	    .style("fill", function() { return color_neg(Math.random()); });

	return;










	/*
    const key_accessor = R.prop('element')
    const value_accessor = R.prop('value')


    const target_height = 13;


    const margin = {top: 20, right: 20, bottom: 30, left: 40}
    const width = 960 - margin.left - margin.right
    const height = target_height / 0.9 * data.length;

    const x = d3.scale.linear().range([0, width])

    const y = d3.scale.ordinal().rangeRoundBands([0, height], .1)

    const xAxis = d3.svg.axis()
        .scale(x)
        .orient('top')
        .ticks(6)

    const negative = d => value_accessor(d) < 0


    const svg = d3.select('body').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')


    x.domain(d3.extent(data, value_accessor))
    y.domain(data.map(key_accessor))

    svg.append('g')
        .attr('class', 'x axis')
        .call(xAxis)

    const bar = svg.selectAll('.bar')
        .data(data)
        .enter().append('g')
        .attr('class', d => 'bar ' + (negative(d) ? 'negative' : 'positive'))
        .attr('transform', d => 'translate(' + x(0) + ',' + y(key_accessor(d)) + ')')

    bar.append('rect')
        .attr('width', d => R.compose(x, Math.abs, value_accessor)(d) - x(0))
        .attr('height', y.rangeBand())
        .attr('x', d => negative(d) ? x(value_accessor(d)) - x(0) : 0)

    bar.append('text')
        .attr('class', 'y-label')
        .attr('x', d => negative(d) ? 10 : -10)
        .attr('y', y.rangeBand() * 0.8)
        .text(key_accessor)
	 */
}
