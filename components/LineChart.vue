<script>
import * as d3 from 'd3'
import {
    color,
    createChart,
    getShortSpeakableCategoryName,
    getSpeakableCategoryName,
    margin
} from '~/composables/helpers'

const axisNumberFormat = {
    'decimal': '.',
    'thousands': ' ',
    'grouping': [ 3 ],
    'currency': [ '', '' ],
}

export default {
    name: 'LineChart',
    props: {
        width: {
            type: Number,
            default: 1440 / 12 * 6 / 12 * 5 - (margin.left + margin.right) + 30,
        },
        height: {
            type: Number,
            default: (685 - (56 + 1.5 * 16) - 50 - (margin.top + margin.bottom) - 4) / 2 - 33,
        },
        data: {
            type: Map,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
    },
    watch: {
        data () {
            this.updateLineChart()
        },
        category () {
            this.updateLineChart()
        },
    },
    data () {
        return {
            chart: null,
            x: d3.scaleLinear()
            .domain([ 2008, 2016 ])
            .range([ 0, this.width ]),
            y: d3.scaleLinear()
            .range([ this.height, 0 ])
        }
    },
    mounted () {
        this.chart = createChart('lineChart', this.width, this.height, 30)
        this.chart.append('g')
        .attr('transform', `translate(0, ${ this.height })`)
        .call(d3.axisBottom(this.x).tickFormat(
            d3.formatDefaultLocale(axisNumberFormat).format(''))
        )
        .selectAll('text')
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end')

        this.chart.append('g')
        .attr('class', 'myYaxis')
        .call(g => g.append('text')
        .attr('class', 'y-label')
        .attr('x', -margin.left + 45)
        .attr('y', -15)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start'))

        this.updateLineChart()
    },
    methods: {
        updateLineChart () {
            const values = []
            this.data.forEach(el => {
                el.forEach(d => {
                    values.push(d.d[this.category])
                })
            })
            const min = +d3.min(values, d => d)
            this.y.domain([ min === 0 ? min : min - 0.5, +d3.max(values, d => d) + 0.5 ])

            this.chart.selectAll('.myYaxis')
            .transition()
            .duration(1000)
            .call(d3.axisLeft(this.y).tickSizeOuter(0))

            this.chart.select('.y-label')
            .text(getSpeakableCategoryName(this.category))

            this.chart.selectAll('.line')
            .data(this.data)
            .join('path')
            .attr('class', 'line')
            .attr('fill', 'none')
            .transition()
            .duration(1000)
            .attr('stroke', (d) => color(d[0]))
            .attr('stroke-width', 2.5)
            .attr('d', (d) => d3.line()
                .x((d) => this.x(d.year))
                .y((d) => this.y(d.d[this.category]))
                (d[1])
            )

            const size = 55
            this.chart.selectAll('.label-rect')
            .data(this.data.keys())
            .join('rect')
            .attr('x', (d, i) => i * size)
            .attr('y', 235)
            .attr('height', 14)
            .attr('width', 14)
            .attr('class', 'label-rect')
            .style('fill', d => color(d))

            this.chart.selectAll('.label-line')
            .data(this.data.keys())
            .join('text')
            .attr('x', (d, i) => 17 + i * size)
            .attr('y', 243)
            .attr('class', 'label-line')
            .style('fill', d => color(d))
            .text(d => d)
            .attr('text-anchor', 'left')
            .style('alignment-baseline', 'middle')
            .style('font-size', '12px')
        }
    },
}
</script>

<template>
    <div id="lineChart"></div>
</template>

<style scoped>

</style>