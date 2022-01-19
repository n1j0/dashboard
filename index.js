import * as d3 from 'https://cdn.skypack.dev/d3@7'

// lookup location: https://extreme-ip-lookup.com/json/?key=H81BYHhmdO53CiVsIRZc

const DEFAULT_YEAR = 2016
const DEFAULT_REGION = 'Western Europe'

const colors = [ '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999' ]

const margin = { top: 30, right: 30, bottom: 70, left: 60 },
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom

let data = new Map()
await d3.csv('./human-freedom-index.csv', function (d) {
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
})

const triggerSelectedCountries = (countryString) => {
    sessionStorage.setItem('countries', countryString)

    const iso_codes = countryString.split(',')
    iso_codes.pop()

    if (iso_codes.length === 0) {
        updateBarChart(regional_data)
        getLineChartData(['AUT'])
    } else {
        updateBarChart(getCountryData(iso_codes), true)
        updateLineChart(getLineChartData(iso_codes))
    }
}

const getAllRegions = () => {
    return [ ...new Set(data.get(DEFAULT_YEAR).map(d => d.region)) ]
}

const getLineChartData = (iso_codes) => {
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

const getAllCountriesData = (year = DEFAULT_YEAR) => data.get(year)

const getRegionalData = (year = DEFAULT_YEAR, region = DEFAULT_REGION) => {
    return data.get(year).filter(e => e.region === region)
}

const getCountryData = (iso_codes, year = DEFAULT_YEAR) => {
    return data.get(year).filter(e => iso_codes.includes(e.iso))
}

const createChart = (id) => {
    return d3.select(`#${ id }`)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${ margin.left }, ${ margin.top })`)
}

const barChart = createChart('barChart')
const lineChart = createChart('lineChart')

const regional_data = getRegionalData()

const xBarChart = d3.scaleBand()
.range([ 0, width ])
.padding([ 0.2 ])
const xAxisBarChart = barChart.append('g')
.attr('transform', `translate(0,${ height })`)

const yBarChart = d3.scaleLinear()
.domain([ 0, 10 ])
.range([ height, 0 ])
const yAxisBarChart = barChart.append('g')
.attr('class', 'myYaxis')

const subgroups = [ 'hf_score', 'pf_score', 'ef_score' ]

const xSubgroup = d3.scaleBand()
.domain(subgroups)
.padding([ 0.05 ])

const colorGroupBarChart = d3.scaleOrdinal()
.domain(subgroups)
.range([ '#e41a1c', '#377eb8', '#4daf4a' ])

const updateBarChart = (barData, selected = false) => {
    xBarChart.domain(barData.map(d => d.country))

    xAxisBarChart
    .call(d3.axisBottom(xBarChart))
    .selectAll('text')
    .attr('transform', 'translate(-10,0)rotate(-45)')
    .style('text-anchor', 'end')
    yAxisBarChart.transition().duration(1000).call(d3.axisLeft(yBarChart))

    if (selected) {
        xSubgroup.range([0, xBarChart.bandwidth()])

        barChart.selectAll('.bar-chart-group')
        .data(barData)
        .join('g')
        .attr('class', 'bar-chart-group')
        .attr('transform', d => `translate(${ xBarChart(d.country) }, 0)`)
        .selectAll('rect')
        .data(d => subgroups.map(key => ({ key: key, value: d[key] })))
        .join('rect')
        .transition()
        .duration(1000)
        .attr('class', 'bar-chart-group-bar')
        .attr('x', d => xSubgroup(d.key))
        .attr('y', d => yBarChart(d.value))
        .attr('width', xSubgroup.bandwidth())
        .attr('height', d => height - yBarChart(d.value))
        .attr('fill', d => colorGroupBarChart(d.key))
    } else {
        d3.selectAll('.bar-chart-group-bar').remove()
        barChart.append('g')
        .attr('class', 'bar-chart-group')
        .selectAll('rect')
        .data(barData)
        .join('rect')
        .transition()
        .duration(1000)
        .attr('x', d => xBarChart(d.country))
        .attr('y', d => yBarChart(d.hf_score))
        .attr('width', xBarChart.bandwidth())
        .attr('height', d => height - yBarChart(d.hf_score))
        .attr('fill', '#69b3a2')
    }
}

updateBarChart(regional_data)

const xLineChart = d3.scaleLinear()
.domain([ 2008, 2016 ])
.range([ 0, width ])

const yLineChart = d3.scaleLinear()
.domain([ 0, 10 ])
.range([ height, 0 ])

lineChart.append('g')
.attr('transform', `translate(0, ${ height })`)
.call(d3.axisBottom(xLineChart).ticks(5))

lineChart.append('g')
.call(d3.axisLeft(yLineChart))

const color = d3.scaleOrdinal()
.range(colors)

const updateLineChart = (lineData) => {
    lineChart.selectAll('.line')
    .data(lineData)
    .join('path')
    .attr('fill', 'none')
    .transition()
    .duration(1000)
    .attr('stroke', function (d) { return color(d[0]) })
    .attr('stroke-width', 1.5)
    .attr('d', function (d) {
        return d3.line()
        .x(function (d) { return xLineChart(d.year) })
        .y(function (d) { return yLineChart(d.d.hf_score) })
        (d[1])
    })
}

updateLineChart(getLineChartData(['AUT']))

function Scatterplot (data, {
    x = ([ x ]) => x, // given d in data, returns the (quantitative) x-value
    y = ([ , y ]) => y, // given d in data, returns the (quantitative) y-value
    z = ([ z ]) => z,
    r = 3, // (fixed) radius of dots, in pixels
    title, // given d in data, returns the title
    inset = r * 2, // inset the default range, in pixels
    insetTop = inset, // inset the default y-range
    insetRight = inset, // inset the default x-range
    insetBottom = inset, // inset the default y-range
    insetLeft = inset, // inset the default x-range
    xType = d3.scaleLinear, // type of x-scale
    xDomain, // [xmin, xmax]
    xRange = [ margin.left + insetLeft, width - margin.right - insetRight ], // [left, right]
    yType = d3.scaleLinear, // type of y-scale
    yDomain, // [ymin, ymax]
    yRange = [ height - margin.bottom - insetBottom, margin.top + insetTop ], // [bottom, top]
    xLabel, // a label for the x-axis
    yLabel, // a label for the y-axis
    xFormat, // a format specifier string for the x-axis
    yFormat, // a format specifier string for the y-axis
    halo = '#fff', // color of label halo
    haloWidth = 3 // padding around the labels
} = {}) {
    // Compute values.
    const X = d3.map(data, x)
    const Y = d3.map(data, y)
    const Z = d3.map(data, z)
    const T = title == null ? null : d3.map(data, title)
    const I = d3.range(X.length).filter(i => !isNaN(X[i]) && !isNaN(Y[i]))

    // Compute default domains.
    if (xDomain === undefined) xDomain = d3.extent(X)
    if (yDomain === undefined) yDomain = d3.extent(Y)

    // Construct scales and axes.
    const xScale = xType(xDomain, xRange)
    const yScale = yType(yDomain, yRange)
    const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat)
    const yAxis = d3.axisLeft(yScale).ticks(height / 50, yFormat)

    const svg = createChart('scatterPlot')

    svg.append('g')
    .attr('transform', `translate(0,${ height - margin.bottom })`)
    .call(xAxis)
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').clone()
    .attr('y2', margin.top + margin.bottom - height)
    .attr('stroke-opacity', 0.1))
    .call(g => g.append('text')
    .attr('x', width)
    .attr('y', margin.bottom - 4)
    .attr('fill', 'currentColor')
    .attr('text-anchor', 'end')
    .text(xLabel))

    svg.append('g')
    .attr('transform', `translate(${ margin.left },0)`)
    .call(yAxis)
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').clone()
    .attr('x2', width - margin.left - margin.right)
    .attr('stroke-opacity', 0.1))
    .call(g => g.append('text')
    .attr('x', -margin.left)
    .attr('y', 10)
    .attr('fill', 'currentColor')
    .attr('text-anchor', 'start')
    .text(yLabel))

    if (T) svg.append('g')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .selectAll('text')
    .data(I)
    .join('text')
    .attr('dx', 7)
    .attr('dy', '0.35em')
    .attr('x', i => xScale(X[i]))
    .attr('y', i => yScale(Y[i]))
    .text(i => T[i])
    .call(text => text.clone(true))
    .attr('fill', 'none')
    .attr('stroke', halo)
    .attr('stroke-width', haloWidth)

    const colorsForFill = d3.scaleOrdinal()
    .domain(getAllRegions())
    .range(colors)

    svg.append('g')
    .selectAll('circle')
    .data(I)
    .join('circle')
    .attr('fill', i => colorsForFill(Z[i]))
    .attr('cx', i => xScale(X[i]))
    .attr('cy', i => yScale(Y[i]))
    .attr('r', r)
}

const allCountriesData = getAllCountriesData()

Scatterplot(allCountriesData, {
    x: d => d.hf_score,
    y: d => d.pf_score,
    z: d => d.region,
    title: d => d.iso,
    xLabel: 'hf_score',
    yLabel: 'pf_Score',
})

const worldMap = createChart('worldMap')

const geoData = await d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')

const projection = d3.geoMercator()
.scale(90)
.center([ 0, 20 ])
.translate([ width / 2, height / 2 ])

const colorScale = d3.scaleThreshold()
.domain([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ])
.range(d3.schemeRdBu[11])

worldMap.append('g')
.selectAll('path')
.data(geoData.features)
.enter()
.append('path')
.attr('d', d3.geoPath()
    .projection(projection)
)
.attr('fill', function (d) {
    const country = allCountriesData.find(el => el.iso === d.id)
    return country ? colorScale(country.hf_score) : '#a1a0a0'
})
.on('click', (evt) => {
    const id = evt.target.__data__.id
    let selected = sessionStorage.getItem('countries') || ''

    if (selected.indexOf(id) === -1) {
        if (selected.split(',').length === 4) return
        selected += `${ id },`
    } else {
        selected = selected.replace(`${ id },`, '')
    }

    triggerSelectedCountries(selected)
})

