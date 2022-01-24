<template>
    <main v-if="!loading">
        <client-only>
            <Toolbar :category="category" :year="year" @change-year="setYear" @change-category="setCategory"
                     @reset="setToDefault"/>
            <b-container fluid>
                <b-row>
                    <b-col cols="6">
                        <b-card no-body>
                            <div class="hint position-absolute d-flex justify-content-center align-items-center">
                                <span class="text-right mr-1">Click on a country<br/>to select it</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                     stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </div>
                            <WorldMap :data="worldMapDataComputed" :geo-data="geoData" :category="category" :year="year"
                                      :resetSelection="resetSelection"
                                      @select="triggerSelectedCountries"/>
                        </b-card>
                    </b-col>
                    <b-col cols="6">
                        <b-row class="mb-3 mr-0">
                            <b-col cols="7" class="pl-0 pr-2">
                                <b-card no-body>
                                    <ScatterPlot :data="scatterPlotDataComputed" :category="category"
                                                 :iso_codes="iso_codes"
                                                 :year="year"/>
                                </b-card>
                            </b-col>
                            <b-col cols="5" class="pr-0 pl-2">
                                <b-card no-body>
                                    <LineChart :data="lineChartDataComputed" :category="category"/>
                                </b-card>
                            </b-col>
                        </b-row>
                        <b-row class="mr-0">
                            <b-card no-body>
                                <BarChart :category="category" :data="barChartDataComputed" :selected="selected"
                                          :region="default_region"/>
                            </b-card>
                        </b-row>
                    </b-col>
                </b-row>
            </b-container>
        </client-only>
    </main>
</template>

<script>
import ScatterPlot from '@/components/ScatterPlot'
import Toolbar from '@/components/toolbar'
import * as d3 from 'd3'
import BarChart from '~/components/BarChart'
import LineChart from '~/components/LineChart'
import WorldMap from '~/components/WorldMap'
import {
    getCountryData,
    getLineChartData,
    getRegionalData, getRegionForIso,
    SESSION_STORAGE_KEY
} from '~/composables/helpers'

export default {
    components: { Toolbar, ScatterPlot, WorldMap, LineChart, BarChart },
    data () {
        return {
            loading: true,
            year: 2016,
            default_iso_codes: [ 'AUT' ],
            default_region: 'Western Europe',
            category: 'hf_score',
            selected: false,
            iso_codes: [],
            resetSelection: 0,
        }
    },
    async asyncData () {
        const csvHost = process.env.NODE_ENV === 'development'
                        ? 'http://localhost:3000/'
                        : process.env.PROD_URL
        const data = new Map()
        const [ , geoData ] = await Promise.all([
            d3.csv(`${ csvHost }human-freedom-index.csv`, (d) => {
                const { year, ISO_code, countries, region, hf_score, pf_score, ef_score, ..._ } = d

                const currentData = data.get(+year)
                const newData = [ {
                    iso: ISO_code,
                    country: countries,
                    region,
                    hf_score: +hf_score,
                    pf_score: +pf_score,
                    ef_score: +ef_score,
                } ]
                if (!currentData) {
                    data.set(+year, newData)
                } else {
                    data.set(+year, currentData.concat(newData))
                }
            }),
            d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
        ])

        return {
            data,
            geoData,
        }
    },
    async mounted () {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)

        this.loading = true

        this.loading = false
    },
    computed: {
        worldMapDataComputed () {
            return this.data.get(this.year)
        },
        scatterPlotDataComputed () {
            if (this.selected) {
                return getRegionalData(this.data, getRegionForIso(this.data, this.iso_codes, this.year), this.year)
            }

            return this.data.get(this.year)
        },
        lineChartDataComputed () {
            return getLineChartData(
                this.data,
                this.selected ? this.iso_codes : this.default_iso_codes,
            )
        },
        barChartDataComputed () {
            if (this.selected) {
                return getCountryData(this.data, this.iso_codes, this.year)
            }

            return getRegionalData(this.data, [ this.default_region ], this.year)
        }
    },
    methods: {
        setToDefault () {
            sessionStorage.removeItem(SESSION_STORAGE_KEY)
            this.year = 2016
            this.default_iso_codes = [ 'AUT' ]
            this.default_region = 'Western Europe'
            this.category = 'hf_score'
            this.selected = false
            this.resetSelection++
        },
        setYear (year) {
            this.year = year
        },
        setCategory (category) {
            this.category = category
        },
        triggerSelectedCountries (countryString) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, countryString)

            const iso_codes = countryString.split(',')
            iso_codes.pop()
            this.iso_codes = iso_codes

            this.selected = iso_codes.length !== 0
        }
    }
}
</script>
<style>
body {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

main {
    width: 1440px;
    max-width: 1440px;
    height: 685px;
    max-height: 685px;
    overflow: hidden;
}

div.hint {
    top: 1rem;
    right: 0.5rem;
    font-size: 0.8rem;
    line-height: 1;
}
</style>
