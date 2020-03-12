import * as d3 from 'd3'
// import _ from 'lodash'

const margin = { top: 35, left: 30, right: 30, bottom: 0 }
const height = 700 - margin.top - margin.bottom
const width = 700 - margin.left - margin.right

const svg = d3
  .select('#changes')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const x = d3
  .scaleLinear()
  .domain([0, 35])
  .rangeRound([0, width])

const y = d3
  .scalePoint()
  .rangeRound([margin.top, height - margin.bottom])
  .padding(0)

const color = d3
  .scaleOrdinal()
  .domain(['pct_recyc_2009', 'pct_recyc_2019'])
  .range(['goldenrod', 'indianred'])
  .unknown('#ccc')

const colorScale = d3
  .scaleOrdinal(d3.schemePastel1)
  .domain(['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island'])

const keys = ['pct_recyc_2009', 'pct_recyc_2019']

const xAxis = g =>
  g
    .attr('class', 'axis-x')
    .attr('transform', `translate(0,${margin.top})`)
    .call(
      d3
        .axisTop(x)
        .tickFormat(d => (d === 0 ? d + '% rec.' : d + '%'))
        .tickPadding(2)
        .tickSizeInner(0)
    )
    .attr('class', 'axis-x-text')
    .call(g =>
      g
        .selectAll('.tick line')
        .clone()
        .attr('y2', height - margin.bottom)
    )
    .call(g => g.selectAll('.domain').remove())
    .style('color', '#555')
    .style('font-family', 'Montserrat')
    .style('font-size', '16px')

d3.csv(
  'https://raw.githubusercontent.com/SawyerClick/NYC-Recycling/master/src/data/data.csv'
)
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready(data) {
  // this sorts the data
  y.domain(data.map(d => +d.pct_recyc_2019).sort(d3.ascending))

  data.forEach(d => {
    d['2019 rates'] = +d.pct_recyc_2019
    d['2009 rates'] = +d.pct_recyc_2009
    d['total waste'] = +d.total_waste
    d['percentage point change'] = +d.pct_point_change
    d['poverty rate'] = +d.poverty_rate
  })

  d3.select('#changes-legend')
    .selectAll('.changes-legend-borough')
    .data(colorScale.domain())
    .enter()
    .append('li')
    .attr('class', 'changes-legend-borough')
    .style('background-color', d => colorScale(d))
    .text(d => d)

  svg
    .append('g')
    .attr('class', 'x-axis')
    .call(xAxis)
    .selectAll('text')
    .attr('text-anchor', d => (d === 0 ? 'middle' : 'middle'))

  svg
    .append('circle')
    .attr('class', 'key-circle')
    .attr('r', 5)
    .attr('fill', '#d3d3d3')
  svg
    .append('line')
    .attr('class', 'key-line')
    .attr('stroke', '#d3d3d3')
  svg
    .append('text')
    .attr('class', 'key-text')
    .text('Change from 2009 to 2019')
    .style('font-size', '16px')

  const g = svg
    .append('g')
    .attr('text-anchor', 'end')
    .style('font', '10px sans-serif')
    .selectAll('g')
    .data(data)
    .join('g')
    .attr('class', 'changes-group')
    .attr('transform', (d, i) => `translate(0,${y(d.pct_recyc_2019)})`)

  g.append('line')
    .attr('class', 'changes-line changes-group')
    .attr('stroke', d => colorScale(d.BOROUGH))
    .attr('stroke-width', '6px')
    .attr('x1', d => x(d3.min(keys, k => +d[k])))
    .attr('x2', d => x(d3.max(keys, k => +d[k])))

  g.append('circle')
    .attr('class', 'changes-group changes-circle')
    .attr('cx', d => x(d.pct_recyc_2019))
    .attr('r', 5)
    .attr('fill', d => colorScale(d.BOROUGH))

  g.append('text')
    .attr('class', 'changes-text changes-group')
    .attr('opacity', 0)
    .attr('dy', '0.35em')
    .attr('x', d => {
      const then = +d.pct_recyc_2009
      const now = +d.pct_recyc_2019

      if (now > then) {
        return x(now + 2)
      } else {
        return x(then + 2)
      }
    })
    .style('text-anchor', 'end')
    .style('font-family', 'Montserrat')
    .style('font-size', '16px')
    .text((d, i) => d.borough_code)

  // this changes the order and animates
  d3.select('#changes-selector').on('input', function() {
    y.domain(data.map(d => +d[this.value]).sort(d3.descending))

    g.transition()
      .delay((d, i) => i * 1)
      .duration(500)
      .attr('transform', d => `translate(0,${y(d[this.value]) + margin.top})`)
  })

  function renderChanges() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    const svgHeight = height + margin.top + margin.bottom

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    x.range([0, newWidth])
    y.range([newHeight, 0])

    svg
      .select('.key-circle')
      .attr('cx', x(3))
      .attr('cy', -15)
    svg
      .select('.key-line')
      .attr('x1', x(3))
      .attr('x2', x(-4))
      .attr('stroke-width', '6px')
      .attr('y1', -15)
      .attr('y2', -15)
    svg
      .select('.key-text')
      .attr('x', x(4))
      .attr('y', -10)
    // .style('alignment-baseline', 'middle')

    svg.select('.x-axis').call(xAxis)

    svg
      .selectAll('.changes-line')
      .attr('x1', d => x(d3.min(keys, k => +d[k])))
      .attr('x2', d => x(d3.max(keys, k => +d[k])))

    svg.selectAll('.changes-circle').attr('cx', d => x(d.pct_recyc_2019))

    svg.selectAll('.changes-text').attr('x', d => {
      const then = +d.pct_recyc_2009
      const now = +d.pct_recyc_2019

      if (now > then) {
        return x(now + 2)
      } else {
        return x(then + 2)
      }
    })
  }
  window.addEventListener('resize', renderChanges)
  renderChanges()
}
