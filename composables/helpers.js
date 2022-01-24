import * as d3 from 'd3'

const colors = d3.schemeTableau10

export const regions = ['Eastern Europe', 'Middle East & North Africa', 'Sub-Saharan Africa', 'Latin America & the Caribbean', 'Caucasus & Central Asia', 'Oceania', 'Western Europe', 'South Asia', 'North America', 'East Asia']

export const shortRegions = ['Eastern Europe', 'Middle East/North Africa', 'Sub-Saharan Africa', 'Latin America', 'Central Asia', 'Oceania', 'Western Europe', 'South Asia', 'North America', 'East Asia']

export const margin = { top: 30, right: 30, bottom: 70, left: 60 }

export const SESSION_STORAGE_KEY = 'countries'

export const MAX_SELECTIONS = 4

export const color = d3.scaleOrdinal().range(d3.schemeSet2)

export const colorBarChartGroups = d3.schemeDark2

export const getSpeakableCategoryName = (category_code) => {
    const categories = {
        'hf_score': 'Human',
        'pf_score': 'Personal',
        'ef_score': 'Economic',
    }
    return `${categories[category_code]} Freedom Score`
}

export const getShortSpeakableCategoryName = (category_code) => {
    const categories = {
        'hf_score': 'h',
        'pf_score': 'p',
        'ef_score': 'e',
    }
    return `${categories[category_code]}f score`
}

export const colorsForRegions = () => d3.scaleOrdinal().domain(regions).range(colors)

export const createChart = (id, width, height, translateX = 60, translateY = 30) => {
    return d3.select(`#${ id }`)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${ translateX }, ${ translateY })`)
}

export const createTooltip = (id) => {
    return d3.select(`#${ id }`)
    .append('div')
    .style('opacity', 0)
    .attr('class', 'tooltip badge badge-info')
    .style('background-color', '#6c757d')
    .style('color', '#fff')
    .style('border-radius', '0.25rem')
    .style('padding', '0.25em .4em')
    .style('text-align', 'center')
    .style('vertical-align', 'baseline')
    .style('white-space', 'nowrap')
    .style('font-weight', '700')
}

export const getLineChartData = (data, iso_codes) => {
    const years = Array.from(data.keys())
    const map = new Map()
    iso_codes.forEach(iso => {
        map.set(iso, years.map(year => ({
            year,
            d: data.get(year).filter(el => el.iso === iso)[0],
        })))
    })
    return map
}

export const getRegionalData = (data, regions, year) => data.get(year).filter(e => regions.includes(e.region))

export const getRegionForIso = (data, iso_codes, year) => {
    const regions = iso_codes.map(iso => data.get(year).filter(el => el.iso === iso)[0].region)
    return [ ...new Set(regions) ]
}

export const getCountryData = (data, iso_codes, year) => {
    return data.get(year).filter(e => iso_codes.includes(e.iso))
}