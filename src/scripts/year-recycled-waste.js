import * as d3 from 'd3'

const margin = { top: 0, left: 20, right: 20, bottom: 20 }
const height = 75 - margin.top - margin.bottom
const width = 400 - margin.left - margin.right

const svg = d3
  .select('#year-recycled-waste')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const x = d3.scaleLinear([0, 1]).range([0, width])

const y = d3
  .scaleBand()
  .domain(['Waste', 'Recycled'])
  .range([height, 0])
  .padding(0.1)

const colorScale = d3
  .scaleOrdinal()
  .domain(['Recycled', 'Waste'])
  .range(['#5ab4ac', '#d8b365'])

const t = d3.transition().duration(300)

const delay = function(d, i) {
  return i * 20
}

function yAccessor(d) {
  return d.Type
}

d3.csv(require('/data/year_raw_waste_and_recycled.csv'))
  .then(ready)
  .catch(err => console.log('Failed with', err))

function ready(datapoints) {
  const xAxis = d3
    .axisBottom(x)
    .tickSizeInner(-height)
    .tickFormat(d3.format('.2s'))
    .tickPadding(5)
    .tickValues([0, 500000, 1000000, 1500000, 2000000, 2500000])

  const xMax = d3.max(datapoints.map(d => d.Waste))
  x.domain([0, xMax])

  ///  data manipulation
  const newData = []
  datapoints.forEach((d, i) => {
    const waste = { year: d.year, type: 'Waste', mt: +d.Waste }
    const recycle = { year: d.year, type: 'Recycled', mt: +d.Recycled }
    newData.push(waste, recycle)
  })

  const nested = d3
    .nest()
    .key(d => d.year)
    .entries(newData)

  /// animation
  let i = 0

  function drawBars(graphic, data) {
    let barsG = graphic.select('.bars')
    if (barsG.empty()) {
      barsG = graphic.append('g').attr('class', 'bars')
    }

    // console.log(data)

    const bars = barsG.selectAll('.bar').data(data, yAccessor, i)
    bars.exit().remove()
    bars
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .merge(bars)
      .attr('y', d => y(d.type))
      // .attr('y', height / 2)
      .attr('width', function(d) {
        if (i !== 0 && d.type === 'Waste') {
          return x(nested[i - 1].values[0].mt)
        } else if (i !== 0 && d.type === 'Recycled') {
          return x(nested[i - 1].values[1].mt)
        }
      })
      .attr('height', y.bandwidth())
      .attr('x', x(0))
      .attr('fill', d => colorScale(d.type))
      .transition(t)
      .attr('width', d => {
        return x(d.mt)
      })
      .delay(delay)
  }

  const interval = d3.interval(() => {
    i = i + 1
    if (i === nested.length - 1) {
      interval.stop()
    }

    const selectedData = nested[i].values

    d3.select('.year').text(i + 2009)

    drawBars(svg, selectedData, i)
  }, 750)

  d3.selectAll('#waste').on('stepin', function() {
    console.log('hi')
  })

  svg
    .append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(${0},${height})`)
    .call(xAxis.tickSizeInner(-height))
    .call(g => g.select('.domain').remove())
    .style('stroke-dasharray', '3 3')
    .style('stroke-width', '2px')
    .style('color', '#555')
    .style('font-family', 'Montserrat')
    .style('font-size', '12px')

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    const svgHeight = height + margin.top + margin.bottom

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    // Update our scale
    x.range([0, newWidth])
    y.range([newHeight, 0])

    // /// kick off the animation
    // /// if we do it in render then it starts out resized
    // /// many thanks to https://bl.ocks.org/deciob/ffd5c65629e43449246cb80a0af280c7

    drawBars(svg, nested[0].values)
    // drawXAxis(svg, nested[0].values)

    // Update things you draw
    svg
      .selectAll('.bar')
      .transition()
      .attr('x', x(0))
      .attr('y', d => y(d.type))
      .attr('height', y.bandwidth())
      .attr('width', d => x(d.mt))

    svg
      .selectAll('.axis--x')
      .call(xAxis.tickSizeInner(-newHeight))
      .call(g => g.select('.domain').remove())
      .raise()
  }

  window.addEventListener('resize', render)
  render()
}
