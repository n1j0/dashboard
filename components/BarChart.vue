<script>
import {
    colorBarChartGroups,
    createChart, createTooltip,
    getShortSpeakableCategoryName,
    getSpeakableCategoryName,
    margin,
} from '~/composables/helpers'
import * as d3 from 'd3'

export default {
    name: 'BarChart',
    props: {
        width: {
            type: Number,
            default: 1440 / 12 * 6 - (margin.left + margin.right) + 30,
        },
        height: {
            type: Number,
            default: (685 - (56 + 1.5 * 16) - 50 - (margin.top + margin.bottom) - 4) / 2 - 36,
        },
        data: {
            type: Array,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        region: {
            type: String,
            required: true,
        },
        selected: {
            type: Boolean,
            required: true,
        }
    },
    watch: {
        data () {
            this.updateBarChart(this.selected)
        },
        category () {
            this.updateBarChart(this.selected)
        },
    },
    data () {
        return {
            chart: null,
            x: d3.scaleBand().range([ 0, this.width ]).padding([ 0.2 ]),
            y: d3.scaleLinear().domain([ 0, 10 ]).range([ this.height, 0 ]),
            xAxis: null,
            subgroups: [ 'hf_score', 'pf_score', 'ef_score' ],
            xSubgroups: null,
            colorGroup: null,
            tooltip: null,
        }
    },
    mounted () {
        this.tooltip = createTooltip('barChart')
        this.xSubgroups = d3.scaleBand().domain(this.subgroups).padding([ 0.05 ])
        this.colorGroup = d3.scaleOrdinal().domain(this.subgroups).range(colorBarChartGroups)
        this.chart = createChart('barChart', this.width, this.height, 30)
        this.xAxis = this.chart.append('g').attr('transform', `translate(0,${ this.height })`)
        this.chart.append('g')
        .call(d3.axisLeft(this.y))
        .call(g => g.append('text')
        .attr('class', 'y-label')
        .attr('x', -margin.left + 45)
        .attr('y', -15)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start'))

        this.chart.selectAll('lineTitle')
        .data([this.region])
        .enter()
        .append('text')
        .attr('x', 280)
        .attr('y', -14)
        .attr('class', 'title')
        .style('fill', '#000000')
        .text(d => `Region: ${d}`)
        .attr('text-anchor', 'left')
        .style('alignment-baseline', 'middle')
        .style('font-size', '14px')
        .style('opacity', 1)

        const size = 80
        this.chart.selectAll('myrects')
        .data(this.subgroups)
        .join('rect')
        .attr('x', (d, i) => 230 + i * size)
        .attr('y', -22)
        .attr('height', 14)
        .attr('width', 14)
        .attr('class', 'label-symbol')
        .style('fill', d => this.colorGroup(d))
        .style('opacity', 0)

        this.chart.selectAll('mylabels')
        .data(this.subgroups)
        .enter()
        .append('text')
        .attr('x', (d, i) => 247 + i * size)
        .attr('y', -14)
        .attr('class', 'label')
        .style('fill', d => this.colorGroup(d))
        .text(d => getShortSpeakableCategoryName(d))
        .attr('text-anchor', 'left')
        .style('alignment-baseline', 'middle')
        .style('font-size', '12px')
        .style('opacity', 0)

        this.updateBarChart(this.selected)
    },
    methods: {
        showTooltip (evt, d) {
            this.tooltip
            .transition()
            .duration(200)
            .style('opacity', 1)

            const value = this.selected
                          ? `${d.value.toFixed(2)}`
                          : `${d[this.category].toFixed(2)}`
            this.tooltip
            .html(value)
            .style('left', evt.offsetX - 30 + 'px')
            .style('top', evt.offsetY - 60 + 'px')
        },
        hideTooltip () {
            this.tooltip
            .transition()
            .duration(200)
            .style('opacity', 0)
        },
        updateBarChart (selected) {
            this.x.domain(this.data.map(d => d.country))

            this.xAxis
            .call(d3.axisBottom(this.x))
            .selectAll('text')
            .attr('transform', 'translate(-10,0)rotate(-45)')
            .style('text-anchor', 'end')

            this.chart.select('.y-label')
            .text(selected ? '' : getSpeakableCategoryName(this.category))

            if (selected) {
                this.xSubgroups.range([ 0, this.x.bandwidth() ])

                d3.selectAll('.bar-chart-rect').remove()
                this.chart.selectAll('.bar-chart-group')
                .data(this.data)
                .join('g')
                .attr('class', 'bar-chart-group')
                .attr('transform', d => `translate(${ this.x(d.country) }, 0)`)
                .selectAll('rect')
                .data(d => this.subgroups.map(key => ({ key: key, value: d[key] })))
                .join('rect')
                .on('mouseover', this.showTooltip)
                .on('mouseleave', this.hideTooltip)
                .transition()
                .duration(1000)
                .attr('class', 'bar-chart-group-bar')
                .attr('x', d => this.xSubgroups(d.key))
                .attr('y', d => this.y(d.value))
                .attr('width', this.xSubgroups.bandwidth())
                .attr('height', d => this.height - this.y(d.value))
                .attr('fill', d => this.colorGroup(d.key))

                this.chart.selectAll('.label-symbol')
                .style('opacity', 1)

                this.chart.selectAll('.label')
                .style('opacity', 1)

                this.chart.selectAll('.title')
                .style('opacity', 0)
            } else {
                this.chart.selectAll('.label-symbol').style('opacity', 0)
                this.chart.selectAll('.label').style('opacity', 0)
                this.chart.selectAll('.title').style('opacity', 1)

                this.chart.selectAll('.bar-chart-group-bar').remove()

                this.chart.selectAll('.bar-chart-rect')
                .data(this.data)
                .join('rect')
                .attr('class', 'bar-chart-rect')
                .on('mouseover', this.showTooltip)
                .on('mouseleave', this.hideTooltip)
                .transition()
                .duration(1000)
                .attr('x', d => this.x(d.country))
                .attr('y', d => this.y(d[this.category]))
                .attr('width', this.x.bandwidth())
                .attr('height', d => this.height - this.y(d[this.category]))
                .attr('fill', '#69b3a2')
            }
        }
    }
}
</script>

<template>
    <div id="barChart"></div>
</template>

<style scoped>

</style>