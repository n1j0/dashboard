<script>
import * as d3 from 'd3'
import { regions, colorsForRegions, createChart, shortRegions, createTooltip } from '@/composables/helpers'

const margin = { top: 30, right: 30, bottom: 70, left: 60 }

export default {
    name: 'ScatterPlot',
    props: {
        width: {
            type: Number,
            default: 1440 / 12 * 6 / 12 * 7 - (margin.left + margin.right) - 150,
        },
        height: {
            type: Number,
            default: (685 - (56 + 1.5 * 16) - 50 - (margin.top + margin.bottom) - 4) / 2 - 33,
        },
        data: {
            type: Array,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        iso_codes: {
            type: Array,
            required: true,
        }
    },
    watch: {
        data () {
            this.resetBrush()
            this.updateScatterPlot()
        },
    },
    data () {
        return {
            chart: null,
            radius: 3,
            tooltip: null,
            colors: colorsForRegions(),
            x: d3.scaleLinear().domain([ 0, 10 ]).range([ 0, this.width ]),
            y: d3.scaleLinear().domain([ 0, 10 ]).range([ this.height, 0 ]),
            xDomain: undefined,
            yDomain: undefined,
            brush: null,
            observer: undefined,
        }
    },
    mounted () {
        const { X, Y, Z, I } = this.prepare()

        this.tooltip = createTooltip('scatterPlot')
        this.tooltip.style('right', '0.75rem').style('bottom', '0.75rem')

        this.chart = createChart('scatterPlot', 800, this.height, 30)

        this.chart.append('g')
        .attr('transform', `translate(0, ${ this.height })`)
        .call(d3.axisBottom(this.x))
        .call(g => g.append('text')
        .attr('x', this.width)
        .attr('y', margin.bottom - 30)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'end')
        .text('Personal Freedom Score'))

        this.chart.append('g')
        .call(d3.axisLeft(this.y))
        .call(g => g.append('text')
        .attr('x', -margin.left + 45)
        .attr('y', -15)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start')
        .text('Human Freedom Score'))

        this.chart.append('g')
        .selectAll('.bubbles')
        .data(I)
        .join('circle')
        .attr('class', i => `bubbles ${ this.data[i].region.replace(/[&\s]/g, '') }`)
        .attr('fill', i => this.colors(Z[i]))
        .attr('cx', i => this.x(X[i]))
        .attr('cy', i => this.y(Y[i]))
        .attr('r', this.radius)

        const size = 15
        this.chart.selectAll('mycircles')
        .data(regions)
        .join('circle')
        .attr('cx', 210)
        .attr('cy', (d, i) => 10 + i * (size + 5))
        .attr('r', 7)
        .style('fill', d => this.colors(d))
        .on('mouseover', this.highlight)
        .on('mouseleave', this.noHighlight)

        this.chart.selectAll('mylabels')
        .data(regions)
        .enter()
        .append('text')
        .attr('x', 210 + size * .8)
        .attr('y', (d, i) => i * (size + 5.5) + (size / 2))
        .style('fill', d => this.colors(d))
        .text((d, i) => shortRegions[i])
        .attr('text-anchor', 'left')
        .style('alignment-baseline', 'middle')
        .style('font-size', '12px')
        .on('mouseover', this.highlight)
        .on('mouseleave', this.noHighlight)

        this.brush = this.chart.append('g')

        this.brush.call(d3.brush()
        .extent([ [ 0, 0 ], [ 180, this.height ] ])
        .on('brush', (event) => {
            const countries = []
            this.data.forEach((e, i) => {
                if (this.isBrushed(event.selection, this.x(X[i]), this.y(Y[i]))) {
                    countries.push(e['hf_score'])
                }
            })
            if (countries.length > 0) {
                const avg = countries.reduce((acc, next) => acc + next, 0)
                this.tooltip.html(`Avg. hf score: ${ (avg / countries.length).toFixed(2) }`)

                this.tooltip.style('opacity', 1)
            } else {
                this.tooltip.style('opacity', 0)
            }
        }))

        const brushedArea = document.querySelector('div#scatterPlot rect.selection')
        this.observer = new MutationObserver((mutation) => {
            if (mutation[0].target.style['0'] === 'display') {
                this.resetBrush()
            }
        })

        this.observer.observe(brushedArea, {
            attributeFilter: ['style'],
        })
    },
    beforeDestroy () {
        this.observer.disconnect()
    },
    methods: {
        prepare () {
            const X = this.data.map(d => d['pf_score'])
            const Y = this.data.map(d => d['hf_score'])
            const Z = this.data.map(d => d['region'])

            this.xDomain = this.xDomain || d3.extent(X)
            this.yDomain = this.yDomain || d3.extent(Y)

            const I = d3.range(X.length).filter(i => !isNaN(X[i]) && !isNaN(Y[i]))

            return {
                X,
                Y,
                Z,
                I,
            }
        },
        updateScatterPlot () {
            const { X, Y, Z, I } = this.prepare()

            this.chart.selectAll('.bubbles')
            .data(I)
            .join('circle')
            .transition().duration(500)
            .attr('class', i => `bubbles ${ this.data[i].region.replace(/[&\s]/g, '') }`)
            .attr('fill', i => this.colors(Z[i]))
            .attr('opacity', 1)
            .attr('stroke', i => this.iso_codes.length === 0 || !this.iso_codes.includes(this.data[i].iso) ? 'none' : 'black')
            .attr('cx', i => this.x(X[i]))
            .attr('cy', i => this.y(Y[i]))
            .attr('r', this.radius)
        },
        highlight (event, d) {
            this.resetBrush()
            if (this.iso_codes.length === 0) {
                const countries = this.data.filter(e => e.region === d).map(e => e['hf_score'])
                const avg = countries.reduce((acc, next) => acc + next, 0)
                this.tooltip.html(`Avg. hf score: ${ (avg / countries.length).toFixed(2) }`)

                this.tooltip.transition().duration(200).style('opacity', 1)
                d3.selectAll('.bubbles').style('opacity', .05)
                d3.selectAll('.' + d.replace(/[&\s]/g, '')).style('opacity', 1)
            }
        },
        noHighlight () {
            if (this.iso_codes.length === 0) {
                this.tooltip.transition().duration(200).style('opacity', 0)
                d3.selectAll('.bubbles').style('opacity', 1)
            }
        },
        isBrushed (brush_coords, cx, cy) {
            const x0 = brush_coords[0][0],
                x1 = brush_coords[1][0],
                y0 = brush_coords[0][1],
                y1 = brush_coords[1][1]
            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1
        },
        resetBrush() {
            this.brush.call(d3.brush().clear)
        },
    },
}
</script>

<template>
    <div id="scatterPlot"></div>
</template>

<style scoped>

</style>