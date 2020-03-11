import * as d3 from 'd3'

const margin = { top: 20, left: 25, right: 0, bottom: 70 }

const height = 600 - margin.top - margin.bottom
const width = 800 - margin.left - margin.right

const svg = d3
  .select('#lines')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const parseTime = d3.timeParse('%Y')

const chartDimensions = { height: 300, width: 100 }

const yPositionScaleMicro = d3
  .scaleLinear()
  .domain([0, 100])
  .range([chartDimensions.height, 0])

const xPositionScaleMicro = d3
  .scaleLinear()
  .domain([parseTime(2009), parseTime(2019)])
  .range([0, chartDimensions.width])

const yPositionScaleMacro = d3
  .scaleLinear()
  .range([chartDimensions.width / 2, width - chartDimensions.width / 2])

const xPositionScaleMacro = d3.scaleLinear().range([height, 0])

const colorScale = d3
  .scaleThreshold()
  .domain([-15, -5, 10, 25])
  .range(['#c94a38', '#e67950', '#b2d16d', '#7cb564', '#479050'])

const line = d3
  .line()
  .x(d => xPositionScaleMicro(parseTime(d.name)))
  .y(d => yPositionScaleMicro(+d.divRate))

const youngStore = d3.map()
const povertyStore = d3.map()
const foreignStore = d3.map()
const changeStore = d3.map()

Promise.all([
  d3.csv(require('/data/data.csv')),
  d3.csv(require('/data/diversions.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([demo, div]) {
  demo.forEach(d => {
    const young = +d.under18_rate
    youngStore.set(+d.borough_code, young)
  })

  demo.forEach(d => {
    const poverty = +d.poverty_rate
    povertyStore.set(+d.borough_code, poverty)
  })

  demo.forEach(d => {
    const foreign = +d.pct_foreign_born
    foreignStore.set(+d.borough_code, foreign)
  })

  demo.forEach(d => {
    const change = +d.pct_point_change
    changeStore.set(+d.borough_code, change)
  })

  const grouped = d3
    .nest()
    .key(d => d.borough_code)
    .entries(div)

  console.log(grouped)

  const data = grouped.map(function(d) {
    const { values } = d
    const chart = {
      borough_code: d.key,
      '2009': +values[0].diversion,
      '2010': +values[1].diversion,
      '2011': +values[2].diversion,
      '2012': +values[3].diversion,
      '2013': +values[4].diversion,
      '2014': +values[5].diversion,
      '2015': +values[6].diversion,
      '2016': +values[7].diversion,
      '2017': +values[8].diversion,
      '2018': +values[9].diversion,
      '2019': +values[10].diversion
    }
    return chart
  })

  data.forEach(function(d) {
    d.young = +youngStore.get(d.borough_code)
    d.poverty = +povertyStore.get(d.borough_code)
    d.foreign = +foreignStore.get(d.borough_code)
    d.change = +changeStore.get(d.borough_code)
  })

  console.log(data)

  xPositionScaleMacro.domain(d3.extent(data, d => +d.young))
  yPositionScaleMacro.domain(d3.extent(data, d => +d.poverty).reverse())

  // colorScale.domain(d3.extent(demo.map(d => d.pct_point_change)))

  svg
    .selectAll('.chart')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'chart')
    .attr('transform', d => {
      const xTrans = xPositionScaleMacro(+d.young)
      let yTrans = yPositionScaleMacro(+d.poverty)
      yTrans = yPositionScaleMacro(0)
      return `translate(${xTrans},${height / 2})`
    })
    .each(function(d) {
      const group = d3.select(this)

      const dataColumns = Object.keys(d).filter(d => d[0] === '2')
      const datapoints = dataColumns.map(colName => {
        return {
          name: colName,
          date: parseTime(colName),
          divRate: +d[colName]
        }
      })
      // Find out the percent change from the last one
      const first = datapoints[0]
      datapoints.forEach(d => {
        d.pct_change = ((first.divRate - d.divRate) / first.divRate) * 100
      })

      const median = d3.median(datapoints, d => d.pct_change)

      const centerGroup = group.append('g').attr('transform', () => {
        const x = chartDimensions.width / 2
        const y = yPositionScaleMicro(median)
        return `translate(-${x},${y * -1})`
      })

      group
        .append('text')
        .text(datapoints[0].borough_code)
        // .attr('x', width / 2)
        // .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('baseline-alignment', 'middle')
        .attr('class', 'highlight-text')
        .attr('font-size', 12)
        .attr('visibility', 'hidden')
        .style(
          'text-shadow',
          '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
        )

      // console.log(datapoints)

      centerGroup
        .append('path')
        .datum(datapoints)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', +datapoints.change > 0 ? 'dodgerblue' : 'indianred')
        .attr('stroke-width', 2)
    })
  // .on('mouseout', function(d) {
  //   d3.select(this)
  //     .select('path')
  //     .attr('stroke', 'black')
  // })
  // .on('mouseover', function(d) {
  //   d3.select(this)
  //     .raise()
  //     .select('path')
  //     .attr('stroke', 'black')
  // })

  svg
    .append('line')
    .attr('class', 'middle-line')
    .attr('x1', 0)
    .attr('y1', yPositionScaleMacro(25.12464))
    .attr('x2', width)
    .attr('y2', yPositionScaleMacro(25.12464))
    .attr('stroke', 'lightgray')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5 3')
    .lower()
}
