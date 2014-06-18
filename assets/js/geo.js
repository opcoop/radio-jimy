 $.extend(true, window.libraries, { 
 	jquery: jQuery.noConflict(), 
 	crel: crel,
 	d3js: d3,
 	topojson: topojson,
 	preloadjs: createjs,
 	underscore: _.noConflict()
 });

;(function(window, require) {
	// Library Refs
	var $ = require('jquery')
	  , d3 = require('d3js')
	  , _ = require('underscore')
	  , topojson = require('topojson')
	  , crel = require('crel')
	  , LoadQueue = require('preloadjs').LoadQueue;

	// Local Vars
	var loadQueue = new LoadQueue(true);
	loadQueue.on('fileprogress', loadProgressUpdate);
	loadQueue.on('complete', loadComplete);

	// DOM Elems
	var $loading = $('.loading'),
		$progress = $('#loading-text');


	function loadProgressUpdate(e) {
		$progress.text('Loading\n{filename}\n{progress}%'.assign({
			filename: e.item.id,
			progress: (e.progress * 100).toFixed(0)
		}));
	}


})(window, function(lib) { return window.libraries[lib] || window[lib]; });


loadQueue.on('fileprogress', function(e) {
	
})
loadQueue.on('complete', function(e) {
	$loading.fadeOut();
	loadMap();
})
loadQueue.loadFile({id: 'Topology', src: 'assets/maps/topo.json'});

function loadMap() {
	var topo = loadQueue.getResult('Topology'),
		map = d3.select('#map'),
		countries = topojson.feature(topo, topo.objects.ne_50m_admin_0_countries),
		states = topojson.feature(topo, topo.objects.ne_50m_admin_1_states_provinces_lakes),
		path = d3.geo.path().projection(d3.geo.mercator().scale(150));

	map.selectAll('.country')
		.data(countries.features)
	  .enter().append('path')
	  	.attr('class', function(d) { return 'country ' + d.properties.iso_a2; })
		.attr('d', path)
		.on('click', function(d) { console.log(d.properties.name + ' clicked'); });

	map.selectAll('.state')
		.data(_.filter(states.features, function(d) { return d.properties.iso_a2 == 'US' }))
	  .enter().append('path')
	  	.attr('class', function(d) { return 'state ' + d.properties.code_hasc.replace('.', '_'); })
		.attr('d', path)
		.on('click', function(d) { console.log(d.properties.code_hasc + ' clicked'); });
}