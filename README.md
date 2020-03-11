SOMA, if you're reading this, it'll be done in the next few days. I'm tweaking some viz and adding reporting.

# ✨ Zero Waste, Zero Chance ✨
Analyzing the effectiveness of New York's plan to go zero waste by 2030. Some neighborhoods haven't been playing along, putting the city at risk of drasticlly missing it's plan. At tis rate, it wont

Check out the whole gizmo here: https://nyc-recycling.netlify.com/
### What have we found so far?
Over the last decade, the city has made nearly no progress in decreasing the amount of waste it produces. New York is still, by far, the trash capital of the world. Even worse, some neighborhoods have decreasing diversion rates, meaning they're even recycling less than they were a decade ago.


### Current Status
We're in the final stages of creating our graphics and reporting.

### Where did the data come from?
Recycling data comes from NYC Open Data. We might now use all of them, but they're there in case we want to!
* <a href='https://data.cityofnewyork.us/City-Government/DSNY-Monthly-Tonnage-Data/ebb7-mvp5' target="_blank">Monthly Tonnage Data</a>
* <a href='https://data.cityofnewyork.us/Environment/Public-Recycling-Bins/sxx4-xhzg' target="_blank">Public Recycling Baskets</a>
* <a href='https://data.cityofnewyork.us/Environment/Recycling-Diversion-and-Capture-Rates/gaq9-z3hz' target="_blank">Recycling Diversion and Capture Rates</a>

We have census data by community district through the city's Community Profiles
* <a href='https://communityprofiles.planning.nyc.gov/' target='_blank'>District Demographics</a>

### What do we want the final project to look like?
##### We Have:
* A scrollytelling map up top to get the point across that increases are coming from poverty-stricken districts
* A line chart to show by region who is performing best and worst
* A dot plot that shows the total recycling changes

##### To Add
* A Svelte app that lets users look up their own district and compare it with similar ones
* Make the line chart responsive in ai2html or use datawrapper for it
* Make the dot plot burst into a scatter plot to show the poverty rate/increase divide
