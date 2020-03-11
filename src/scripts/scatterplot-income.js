import * as d3 from 'd3'

const margin = { top: 20, left: 20, right: 20, bottom: 20 }
const height = 300 - margin.top - margin.bottom
const width = 550 - margin.left - margin.right

const svg = d3
  .select('#scatter')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const yPositionScale = d3.scaleLinear().range([0, width])
const xPositionScale = d3.scaleLinear().range([height, 0])
const colorScale = d3.scaleOrdinal(d3.schemePastel1)

d3.csv(require('/data/data.csv'))
  .then(ready)
  .catch(err => console.log('Failed with', err))

function ready(data) {
  console.log(data)

  yPositionScale.domain(d3.extent(data, d => +d.income))
  xPositionScale.domain([0, 35])
  colorScale.domain([
    'Bronx',
    'Brooklyn',
    'Manhattan',
    'Queens',
    'Staten Island'
  ])

  svg
    .selectAll('.districts-income')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'districts-income')
    .attr('cx', d => xPositionScale(+d.pct_recyc_2019))
    .attr('cy', d => yPositionScale(+d.income))
    .attr('r', 5)
    .attr('opacity', '.6')
    .attr('fill', d => colorScale(d.BOROUGH))
}

render()
function render() {
  const svgContainer = svg.node().closest('div')
  const svgWidth = svgContainer.offsetWidth
  const svgHeight = height + margin.top + margin.bottom

  const actualSvg = d3.select(svg.node().closest('svg'))
  actualSvg.attr('width', svgWidth).attr('height', svgHeight)

  const newWidth = svgWidth - margin.left - margin.right
  const newHeight = svgHeight - margin.top - margin.bottom

  // Update our scale
  xPositionScale.range([0, newWidth])
  yPositionScale.range([newHeight, 0])

  // Update things you draw
  svg
    .selectAll('.districts-income')
    .attr('cx', d => xPositionScale(+d.pct_recyc_2019))
    .attr('cy', d => yPositionScale(+d.income))
}
