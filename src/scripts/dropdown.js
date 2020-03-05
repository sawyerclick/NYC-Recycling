import * as d3 from 'd3'

const margin = { top: 10, left: 45, right: 30, bottom: 30 }
const height = 150 - margin.top - margin.bottom
const width = 300 - margin.left - margin.right

const svg = d3.select('#dropdown-chart')

const xScale = d3
  .scaleBand()
  .range([0, width])
  .padding(0.1)

const yScale = d3.scaleLinear().range([height, 0])

const colorScale = d3
  .scaleOrdinal()
  .domain(['1', '2', '3', '4', '5'])
  .range(['#DECBE4', '#B3CDE3', '#FBB4AE', '#CCEBC5', '#FED9A6'])

d3.csv(require('/data/joined_and_tonnage.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

function ready(datapoints) {
  const nested = d3
    .nest()
    .key(function(d) {
      // return `${d.BOROUGH} ${d.boro_cd.slice(1)}`
      return `${d.neighborhoods}`
    })
    .rollup(function(d) {
      return {
        poverty_rate: d3.mean(d, f => f.poverty_rate),
        pct_change: d3.mean(d, f => f.pct_change),
        BOROUGH: d[0].BOROUGH,
        neighborhoods: d[0].neighborhoods,
        boro_cd: d[0].boro_cd,
        foreign_born: d[0].pct_foreign_born,
        pct_2009: d3.mean(d, f => f.pct_recyc_2009 * 100),
        pct_2018: d3.mean(d, f => f.pct_recyc_2018 * 100)
      }
    })
    .entries(datapoints)

  d3.select('datalist')
    .selectAll('option')
    .data(nested)
    .enter()
    .append('option')
    .attr('value', d => d.key)

  // console.log(nested)

  function makeChart(column) {
    const chart = svg
      .append('svg')
      .attr('class', 'parent')
      .style('display', 'flexbox')
      .attr('height', height + margin.top + margin.bottom)
      .attr('width', width + margin.left + margin.right)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    const sorted = nested.sort(function(a, b) {
      return d3.descending(+a.value[column], +b.value[column])
    })
    xScale.domain(sorted.map(d => d.key))
    yScale.domain([0, d3.max(sorted.map(d => d.value[column]))])

    chart
      .selectAll('rect')
      .data(sorted)
      .enter()
      .append('rect')
      .attr('class', 'chart chart-' + column)

    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat(d => d + '%')
      .tickSizeOuter(10)
      .tickPadding(5)

    chart
      .append('g')
      .attr('class', 'axis y-axis')
      .call(yAxis)

    chart.selectAll('.domain').remove()

    // chart
    //   .append('text')
    //   .attr('class', 'title')
    //   .text(column)
  }
  makeChart('poverty_rate')
  // makeChart('foreign_born')
  // makeChart('pct_2009')
  // makeChart('pct_2018')

  d3.select('#distSelector').on('input', function() {
    const selected = this.value

    svg
      .selectAll('.chart')
      .transition()
      .attr('opacity', function(d) {
        return d.key.toLowerCase().includes(selected.toLowerCase()) ? 1 : 0.2
      })
  })

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    const svgHeight = height + margin.top + margin.bottom

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    // Update our scale
    xScale.range([0, newWidth])
    yScale.range([newHeight, 0])

    //  function to make each graphic responsive using its own columns
    function updateChart(column) {
      const sorted = nested.sort(function(a, b) {
        return d3.descending(+a.value[column], +b.value[column])
      })
      xScale.domain(sorted.map(d => d.key))

      svg
        .selectAll('.title')
        .attr('x', newWidth / 2)
        .attr('y', newHeight / 2)

      svg
        .selectAll('.parent')
        .attr('height', newHeight + margin.top + margin.bottom)
        .attr('width', newWidth + margin.left + margin.right)

      svg
        .selectAll('.chart-' + column)
        .data(sorted)
        .attr('width', xScale.bandwidth())
        .attr('height', d => newHeight - yScale(d.value[column]))
        .attr('x', d => xScale(d.key))
        .attr('y', d => yScale(d.value[column]))
        .attr('fill', d => colorScale(d.value.boro_cd[0]))

      const yAxis = d3
        .axisLeft(yScale)
        .ticks(3)
        .tickFormat(d => d + '%')
        .tickSizeOuter(10)
        .tickPadding(5)

      svg.selectAll('.y-axis').call(yAxis.tickSizeInner(-newWidth))
    }

    updateChart('poverty_rate')
    updateChart('foreign_born')
    updateChart('pct_2009')
    updateChart('pct_2018')

    svg
      .selectAll('text')
      .style('font-size', '14px')
      .attr('fill', '#444')

    // update the things we draw
  }

  // When the window resizes, run the function
  // that redraws everything
  window.addEventListener('resize', render)

  // And now that the page has loaded, let's just try
  // to do it once before the page has resized
  render()
}
