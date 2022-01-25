<script>
import * as d3 from 'd3'
import {
    createChart,
    createTooltip,
    getSpeakableCategoryName,
    SESSION_STORAGE_KEY,
    margin,
    MAX_SELECTIONS,
} from '@/composables/helpers'
import { Legend } from '@/composables/legend'

export default {
    name: 'WorldMap',
    props: {
        width: {
            type: Number,
            default: 1440 / 12 * 6 - (margin.left + margin.right) - 34,
        },
        height: {
            type: Number,
            default: 685 - (56 + 1.5 * 16) - 50 - (margin.top + margin.bottom) - 4,
        },
        data: {
            type: Array,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        geoData: {
            type: Object,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        resetSelection: {
            type: [Number, String, Boolean],
            required: true,
        },
    },
    watch: {
        data () {
            this.updateWorldMap()
        },
        category () {
            this.updateWorldMap()
        },
        resetSelection() {
            this.clearAllStrokes()
        }
    },
    data () {
        return {
            chart: null,
            tooltip: null,
            projection: d3.geoMercator()
            .scale(105)
            .center([ 0, 40 ])
            .translate([ this.width / 2, this.height / 2 ]),
            colorScale: d3.scaleThreshold()
            .domain([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ])
            .range(d3.schemeRdBu[11]),
            legend: null,
        }
    },
    mounted () {
        const that = this
        this.tooltip = createTooltip('worldMap')
        this.tooltip.style('right', '1rem').style('top', '4rem')

        this.legend = Legend(d3.scaleThreshold([1,2,3,4,5,6,7,8,9], d3.schemeRdBu[10]), 'mapLegend', {})
        this.legend
        .call(g => g.append('text')
        .attr('class', 'y-label')
        .attr('x', 0)
        .attr('y', -15)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start')
        .text(getSpeakableCategoryName(this.category)))

        this.chart = createChart('worldMap', this.width, this.height, 45, 15)
        this.chart.append('g')
        .selectAll('path')
        .data(this.geoData.features)
        .enter()
        .append('path')
        .attr('data-tooltip', (d) => {
            const country = this.data.find(el => el.iso === d.id)
            return country ? country[this.category] : ''
        })
        .attr('d', d3.geoPath()
            .projection(this.projection)
        )
        .attr('fill', (d) => {
            const country = this.data.find(el => el.iso === d.id)
            return country ? this.colorScale(country[this.category]) : '#a1a0a0'
        })
        .on('click', function (evt) {
            const id = evt.target.__data__.id

            if (!that.hasCountryValueForCategory(id)) return

            let selected = sessionStorage.getItem(SESSION_STORAGE_KEY) || ''

            const selectedPath = d3.select(this)
            .transition()
            .duration(500)

            if (selected.indexOf(id) === -1) {
                if (selected.split(',').length === MAX_SELECTIONS + 1) {
                    that.$bvToast.toast(`Please deselect a country first (max. ${MAX_SELECTIONS} countries).`, {
                        title: 'Too many countries',
                        variant: 'warning',
                        autoHideDelay: 5000,
                    })
                    return
                }
                selected += `${ id },`
                selectedPath.style('stroke', 'black')
            } else {
                selected = selected.replace(`${ id },`, '')
                selectedPath.style('stroke', 'none')
            }

            that.$emit('select', selected)
        })
        .on('mouseover', function (evt) {
            const id = evt.target.__data__.id

            if (!that.hasCountryValueForCategory(id)) return

            that.tooltip.transition().duration(200).style('opacity', 1)

            d3.select(this)
            .style('cursor', 'pointer')
            .style('opacity', 0.5)

        })
        .on('mouseleave', function () {
            d3.select(this)
            .style('opacity', 1)

            that.tooltip.transition().duration(200).style('opacity', 0)
        })
        .on('mousemove', function (evt) {
            const name = evt.target.__data__.properties.name
            const value = (+this.getAttribute('data-tooltip')).toFixed(2)

            that.tooltip.html(`${ name }: ${ value }`)
        })
    },
    methods: {
        hasCountryValueForCategory (iso_code) {
            const countryData = this.data.filter(e => e.iso === iso_code)

            return countryData.length > 0 && countryData[0] && typeof countryData[0][this.category] === 'number'
        },
        clearAllStrokes() {
            this.chart.selectAll('g')
            .selectAll('path')
            .data(this.geoData.features)
            .join('path')
            .style('stroke', 'none')
        },
        updateWorldMap () {
            this.legend
            .call(g => g.select('.y-label')
            .attr('class', 'y-label')
            .attr('x', 0)
            .attr('y', -15)
            .attr('fill', 'currentColor')
            .attr('text-anchor', 'start')
            .text(getSpeakableCategoryName(this.category)))

            this.chart.selectAll('g')
            .selectAll('path')
            .data(this.geoData.features)
            .join('path')
            .transition()
            .duration(1000)
            .attr('data-tooltip', (d) => {
                const country = this.data.find(el => el.iso === d.id)
                return country ? country[this.category] : ''
            })
            .attr('fill', (d) => {
                const country = this.data.find(el => el.iso === d.id)
                return country ? this.colorScale(country[this.category]) : '#a1a0a0'
            })
        },
    }
}
</script>

<template>
    <div>
        <div class="d-flex justify-content-center">
            <svg id="mapLegend"></svg>
        </div>
        <div id="worldMap"></div>
    </div>
</template>

<style scoped>

</style>