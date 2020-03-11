import * as d3 from 'd3'

// this is from the notebook. didn't want to bog down by reading in data
// the sum of refuse for 2019
const yearRecycled = 3144939
const days = 365
const seconds = 86400
const hundredMilliseconds = 100
const oneSecond = yearRecycled / days / seconds / 1000
const recyclingPounds = oneSecond * 2000
let i = 0
d3.interval(() => {
  i = i + 1
  d3.select('#ticker')
    .transition(500)
    .text(i * recyclingPounds * hundredMilliseconds)
}, hundredMilliseconds)

d3.select('#ticker').text(0)
