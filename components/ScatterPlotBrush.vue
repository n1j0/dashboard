<script>
import * as d3 from 'd3'
import { colorsForRegions, createChart, margin } from '@/composables/helpers'

export default {
    name: 'ScatterPlot',
    props: {
        width: {
            type: Number,
            default: 460 - margin.left - margin.right,
        },
        height: {
            type: Number,
            default: 400 - margin.top - margin.bottom,
        },
        data: {
            type: Array,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        iso_codes: {
            type: Array,
            required: true,
        }
    },
    watch: {
        data () {
            this.updateScatterPlot()
        },
        category () {
            this.updateScatterPlot()
        },
    },
    data () {
        return {
            chart: null,
            clip: null,
            brush: null,
            scatter: null,
            radius: 3,
            colors: colorsForRegions(),
            x: d3.scaleLinear().domain([ 0, 10 ]).range([ 0, this.width ]),
            y: d3.scaleLinear().domain([ 0, 10 ]).range([ this.height, 0 ]),
            xAxis: null,
            xDomain: undefined,
            yDomain: undefined,
            idleTimeout: null,
        }
    },
    mounted () {
        const { X, Y, Z, I, xScale, yScale } = this.prepare()

        this.chart = createChart('scatterPlot', this.width, this.height)
        this.xAxis = this.chart.append('g').attr('transform', `translate(0, ${ this.height })`).call(d3.axisBottom(this.x))

        this.chart.append('g').call(d3.axisLeft(this.y))

        this.clip = this.chart.append('defs').append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('x', 0)
        .attr('y', 0)

        this.brush = d3.brushX()
        .extent([ [ 0, 0 ], [ this.width, this.height ] ])
        .on('end', this.updateScatterPlot)

        this.scatter = this.chart.append('g')
        .attr('clip-path', 'url(#clip)')

        this.scatter
        .selectAll('circle')
        .data(I)
        .enter()
        .append('circle')
        .attr('fill', i => this.colors(Z[i]))
        .attr('cx', i => xScale(X[i]))
        .attr('cy', i => yScale(Y[i]))
        .attr('r', this.radius)

        this.scatter.append('g')
        .attr('class', 'brush')
        .call(this.brush)
    },
    methods: {
        prepare () {
            const inset = 2 * this.radius
            const X = this.data.map(d => d['pf_score'])
            const Y = this.data.map(d => d['hf_score'])
            const Z = this.data.map(d => d['region'])
            const I = d3.range(X.length).filter(i => !isNaN(X[i]) && !isNaN(Y[i]))

            this.xDomain = this.xDomain || d3.extent(X)
            this.yDomain = this.yDomain || d3.extent(Y)

            const xScale = d3.scaleLinear(this.xDomain, [ margin.left + inset, this.width - margin.right - inset ])
            const yScale = d3.scaleLinear(this.yDomain, [ this.height - margin.bottom - inset, margin.top + inset ])

            return {
                X,
                Y,
                Z,
                I,
                xScale,
                yScale,
            }
        },
        updateScatterPlot (evt) {
            const { X, Y, Z, I, xScale, yScale } = this.prepare()

            if (evt) {
                const extent = evt.selection
                if (!extent) {
                    if (!this.idleTimeout) return this.idleTimeout = setTimeout(this.idle, 350)
                    this.x.domain([ 0, 10 ])
                } else {
                    this.x.domain([ this.x.invert(extent[0]), this.x.invert(extent[1]) ])
                    this.scatter.select('.brush').call(this.brush.move, null)
                }
            } else {
                console.log('test')
                this.x.domain([ 0, 10 ])
            }

            this.xAxis.transition().duration(1000).call(d3.axisBottom(this.x))

            this.scatter.selectAll('circle')
            .data(I)
            .join('circle')
            .transition().duration(1000)
            .attr('fill', i => this.colors(Z[i]))
            .attr('opacity', i => this.iso_codes.length === 0 || this.iso_codes.includes(this.data[i].iso) ? 1 : 0.3)
            .attr('cx', i => xScale(X[i]))
            .attr('cy', i => yScale(Y[i]))
            .attr('r', this.radius)
        },
        idle () {
            this.idleTimeout = null
        }
    },
}
</script>

<template>
    <div id="scatterPlot"></div>
</template>

<style scoped>

</style>