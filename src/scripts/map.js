import * as d3 from 'd3'
import * as topojson from 'topojson'
import d3Tip from 'd3-tip'
// import d3Annotation from 'd3-svg-annotation'
d3.tip = d3Tip

const margin = { top: 10, left: 0, right: 0, bottom: 10 }
const height = 700 - margin.top - margin.bottom
const width = 1000 - margin.left - margin.right

const tipHeight = 50 - margin.top - margin.bottom
const tipWidth = 75 - margin.left - margin.right

const svg = d3
  .select('#chart-change')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const parseTime = d3.timeParse('%Y')

const projection = d3.geoMercator().translate([width / 2, height / 2])
const path = d3.geoPath().projection(projection)

const colorScalePositive = d3
  .scaleLinear()
  .domain([0, 100])
  .range(['#f3f3f3', 'dodgerblue'])
const colorScaleNegative = d3
  .scaleLinear()
  .domain([-100, 0])
  .range(['#f3f3f3', 'indianred'])

// below is for the tooltip
const xTooltip = d3
  .scaleLinear()
  .domain([parseTime('2009'), parseTime('2019')])
  .range([0, tipWidth])

const yTooltip = d3
  .scaleLinear()
  .domain([0, 100])
  .range([tipHeight, 0])

const line = d3
  .line()
  .curve(d3.curveCardinal)
  .x(d => xTooltip(+d.datetime))
  .y(function(d) {
    return yTooltip(+d.percent_recycled)
  })

const tip = d3
  .tip()
  .attr('class', 'tooltip')
  .offset([15, -175])
  .html(function(d) {
    return `<strong>${d.properties.cd_full_title}</strong><div id='tipDiv'></div>`
  })
svg.call(tip)

Promise.all([
  d3.json(require('/data/data.json')),
  d3.csv(require('/data/recycled_by_year.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([datapoints, tipdata]) {
  const districts = topojson.feature(datapoints, datapoints.objects.data)

  projection.fitSize([width, height], districts)

  // filtering for only manhattan so i can "zoom"
  const manhattanFiltered = districts.features.filter(
    d => String(d.properties.BOROUGH) === 'Manhattan'
  )
  manhattanFiltered.sort(function(a, b) {
    return a.properties.pct_change - b.properties.pct_change
  })
  manhattanFiltered.forEach(function(d, i) {
    d.properties.idx = i
  })
  const manhattanJSON = {
    features: manhattanFiltered,
    type: 'FeatureCollection'
  }

  const pctPtChange = districts.features.map(d => +d.properties.pct_change)
  colorScalePositive.domain([0, d3.max(pctPtChange)])
  colorScaleNegative.domain([0, d3.min(pctPtChange)])

  // the first graph
  // working on making a mouseover chart to show the boros change over each year

  svg.append('path').attr('id', 'yearly-change')

  const xAxis = d3
    .axisBottom(xTooltip)
    .tickFormat(d3.timeFormat('%y'))
    .ticks(5)

  const yAxis = d3.axisLeft(yTooltip)

  svg
    .selectAll('.districts')
    .data(districts.features)
    .enter()
    .append('path')
    .attr('class', function(d) {
      if (String(d.properties.boro_cd) === '101') {
        return 'districts district-101'
      } else {
        return 'districts notDistrict-101'
      }
    })
    .attr('id', function(d) {
      if (String(d.properties.boro_cd)[0] === '1') {
        return 'manhattan'
      } else {
        return 'notmanhattan'
      }
    })
    .attr('d', path)
    .attr('stroke', 'none')
    .attr('fill', function(d) {
      if (+d.properties.pct_change > 0) {
        return colorScalePositive(+d.properties.pct_change)
      } else if (+d.properties.pct_change < 0) {
        return colorScaleNegative(+d.properties.pct_change)
      } else {
        return '#f6f6f6'
      }
    })
    .attr('opacity', 1)
    .on('mouseover', function(d) {
      if (d.properties.borocd != null) {
        // lil highlight
        d3.select(this)
          .transition()
          .duration(100)
          .attr('stroke', 'white')
          .attr('stroke-width', '3px')
          .raise()

        //  Grabbing this boro and filtering for just it in the long csv
        const thisBoro = d.properties.boro_cd

        tip.show(d, this)

        const tipSVG = d3
          .select('#tipDiv')
          .append('svg')
          .attr('width', tipWidth - 5)
          .attr('height', tipHeight - 5)
          .append('g')

        tipSVG
          .append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', 'translate(0,' + 0 + ')')
          .call(xAxis)

        tipSVG
          .append('g')
          .attr('class', 'axis y-axis')
          .call(yAxis)

        const tipDataFiltered = tipdata.filter(e => thisBoro === e.borough_code)
        tipDataFiltered.forEach(function(h) {
          h.datetime = parseTime(h.year)
        })
        // const dateExtent = d3.extent(tipDataFiltered, h => h.datetime)
        // console.log(tipDataFiltered)
        // svg
        //   .select('#yearly-change')
        //   .datum(tipDataFiltered)
        //   .transition()
        //   .ease(d3.easeQuad)
        //   .attr('d', line)
        //   .attr('class', 'tip-line')
        //   .attr('fill', 'none')
        //   .attr('stroke', 'red')
        //   .attr('stroke-weight', '2px')
        tipSVG
          .append('path')
          .datum(tipDataFiltered)
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', 'red')
      }
    })
    .on('mouseout', function(d) {
      d3.select(this)
        .transition()
        .duration(100)
        .attr('stroke', 'none')
        .attr('stroke-width', '0')
        .lower()

      tip.hide(d, this)
    })

  svg
    .append('text')
    .style('font-weight', 600)
    .style('font-size', '42px')
    .attr('class', 'poverty-level-percent')
    .text('>15%')
    .attr('id', 'text')
    .attr('text-anchor', 'end')
  svg
    .append('text')
    .style('font-weight', 400)
    .style('font-size', '32px')
    .attr('class', 'poverty-level-poverty')
    .text('poverty')
    .attr('id', 'text')
    .attr('text-anchor', 'end')

  svg
    .append('text')
    .text('Graphic by Sawyer Click')
    .style('font-size', '10px')
    .attr('text-anchor', 'end')
    .attr('alignment-baseline', 'middle')
    .attr('class', 'credit')

  svg
    .append('circle')
    .attr('class', 'pos-circle')
    .attr('r', 7)
    .attr('fill', '#7DB7D9')
  svg
    .append('circle')
    .attr('class', 'even-circle')
    .attr('r', 7)
    .attr('fill', '#f6f6f6')
    .attr('stroke', '#333')
  svg
    .append('circle')
    .attr('class', 'neg-circle')
    .attr('r', 7)
    .attr('fill', '#FB8060')

  svg
    .append('text')
    .text('+ percent')
    .style('font-size', '14px')
    .attr('text-anchor', 'start')
    .attr('alignment-baseline', 'middle')
    .attr('class', 'pos-text')
  svg
    .append('text')
    .text('no change')
    .style('font-size', '14px')
    .attr('text-anchor', 'start')
    .attr('alignment-baseline', 'middle')
    .attr('class', 'even-text')
  svg
    .append('text')
    .text('- percent')
    .style('font-size', '14px')
    .attr('text-anchor', 'start')
    .attr('alignment-baseline', 'middle')
    .attr('class', 'neg-text')

  d3.selectAll('#text').attr('opacity', 0)

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    const svgHeight = height + margin.top + margin.bottom

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom
    // const newTipHeight = newHeight / 4 - margin.left - margin.right
    // const newTipWidth = newWidth / 2.7 - margin.top - margin.bottom

    // Update our scale
    projection.fitSize([newWidth, newHeight], districts)
    // xTooltip.range([25, newTipWidth])
    // yTooltip.range([newTipHeight, 0])

    // Update things you draw
    svg.selectAll('path').attr('d', path)
    // svg.select('path.tip-line').attr('d', line)

    svg
      .selectAll('.pos-circle')
      .attr('cx', newWidth - 110)
      .attr('cy', newHeight - 80)
    svg
      .selectAll('.even-circle')
      .attr('cx', newWidth - 110)
      .attr('cy', newHeight - 55)
    svg
      .selectAll('.neg-circle')
      .attr('cx', newWidth - 110)
      .attr('cy', newHeight - 30)

    svg
      .selectAll('.pos-text')
      .attr('x', newWidth - 90)
      .attr('y', newHeight - 78.5)
    svg
      .selectAll('.even-text')
      .attr('x', newWidth - 90)
      .attr('y', newHeight - 53.5)
    svg
      .selectAll('.neg-text')
      .attr('x', newWidth - 90)
      .attr('y', newHeight - 28.5)

    svg
      .select('.credit')
      .attr('x', newWidth)
      .attr('y', newHeight)

    svg
      .select('.poverty-level-percent')
      .attr('x', newWidth / 2.4)
      .attr('y', newHeight * 0.4)
    svg
      .select('.poverty-level-poverty')
      .attr('x', newWidth / 2.4)
      .attr('y', newHeight * 0.46)

    // responsiveness
    d3.selectAll('#step1').on('stepin', function() {
      // console.log('step1')
      projection.fitSize([newWidth, newHeight], districts)

      const pctChange = districts.features.map(d => +d.properties.pct_change)
      colorScalePositive.domain([0, d3.max(pctChange)])
      colorScaleNegative.domain([0, d3.min(pctChange)])

      svg
        .selectAll('#text')
        .transition()
        .duration(300)
        .ease(d3.easeQuad)
        .attr('opacity', 0)

      svg
        .selectAll('.districts')
        .transition()
        .duration(300)
        .ease(d3.easeQuad)
        .attr('d', path)
        .attr('fill', function(d) {
          if (+d.properties.pct_change > 0) {
            return colorScalePositive(+d.properties.pct_change)
          } else if (+d.properties.pct_change < 0) {
            return colorScaleNegative(+d.properties.pct_change)
          } else {
            return '#f6f6f6'
          }
        })
    })

    d3.selectAll('#step2').on('stepin', function() {
      // console.log('step2')
      projection.fitSize([newWidth, newHeight], districts)
      svg
        .select('.poverty-level-percent')
        .text('High')
        .attr('fill', 'black')
      svg.select('.poverty-level-poverty').text('poverty')

      svg
        .selectAll('#text')
        .transition()
        .duration(300)
        .ease(d3.easeQuad)
        .attr('opacity', 1)

      svg
        .selectAll('.districts')
        .transition()
        .delay(200)
        .duration(300)
        .ease(d3.easeQuad)
        .attr('opacity', 1)
        .attr('d', path)
        .attr('fill', function(d) {
          console.log(d)
          if (!d.properties.borocd) {
            return '#f6f6f6'
          } else {
            if (d.properties.poverty_rate < 15) {
              return '#d3d3d3'
            } else {
              if (+d.properties.pct_change > 0) {
                return colorScalePositive(+d.properties.pct_change)
              } else if (+d.properties.pct_change < 0) {
                return colorScaleNegative(+d.properties.pct_change)
              }
            }
          }
        })
        .attr('stroke', 'none')
    })

    d3.selectAll('#step3').on('stepin', function() {
      // console.log('step3')
      projection.fitSize([newWidth, newHeight], districts)
      svg
        .select('.poverty-level-percent')
        .text('Less')
        .attr('fill', '#67000d')
      svg.select('.poverty-level-poverty').text('recycling')
      svg
        .selectAll('#text')
        .transition()
        .duration(300)
        .ease(d3.easeQuad)
        .attr('opacity', 1)

      svg
        .selectAll('.districts')
        .transition()
        .delay(200)
        .duration(300)
        .ease(d3.easeQuad)
        .attr('opacity', 1)
        .attr('d', path)
        .attr('fill', function(d) {
          if (!d.properties.borocd) {
            return '#f6f6f6'
          } else {
            if (+d.properties.pct_change < 0) {
              return colorScaleNegative(+d.properties.pct_change)
            } else if (+d.properties.pct_change > 0) {
              return '#d3d3d3'
            }
          }
        })
        .attr('stroke', 'none')
    })
    d3.selectAll('#step-').on('stepin', function() {
      projection.fitSize([newWidth, newHeight], districts)
      svg
        .select('.poverty-level-percent')
        .text('High')
        .attr('fill', 'peachpuff')
      svg.select('.poverty-level-poverty').text('income')

      svg
        .selectAll('#text')
        .transition()
        .duration(300)
        .ease(d3.easeQuad)
        .attr('opacity', 1)

      svg
        .selectAll('.districts')
        .transition()
        .duration(300)
        .ease(d3.easeQuad)
        .attr('opacity', 1)
        .attr('d', path)
        .attr('fill', function(d) {
          if (+d.properties.pct_change < 0) {
            return colorScaleNegative(+d.properties.pct_change)
          } else {
            return '#d3d3d3'
          }
        })
        .attr('stroke', function(d) {
          return d.properties.income > 57000 ? 'peachpuff' : 'none'
        })
        .attr('stroke-width', 3)
        .raise()
    })
    d3.selectAll('#step4').on('stepin', function() {
      projection.fitSize([newWidth, newHeight], manhattanJSON)

      svg
        .selectAll('#text')
        .transition()
        .duration(250)
        .attr('opacity', 0)

      svg
        .selectAll('#notmanhattan')
        .transition()
        .duration(250)
        .attr('opacity', 0)

      svg
        .selectAll('#manhattan')
        .attr('visibility', 'visible')
        .transition()
        .duration(600)
        .attr('d', path)
        .attr('opacity', 1)
        .attr('stroke', function(d) {
          return d.properties.income > 90000 ? 'peachpuff' : 'none'
        })
        .attr('stroke-width', 3)
    })

    d3.selectAll('#step5').on('stepin', function() {
      projection.fitSize([newWidth, newHeight], manhattanJSON)
      svg
        .selectAll('.notDistrict-101')
        .transition()
        .duration(300)
        .attr('opacity', 0.2)
      svg
        .selectAll('#notmanhattan')
        .transition()
        .duration(300)
        .attr('opacity', 0)

      svg
        .select('.district-101')
        .transition()
        .duration(300)
        .ease(d3.easeQuad)
        .attr('opacity', 1)
    })
  }

  window.addEventListener('resize', render)
  render()
}
