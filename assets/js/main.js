require(['preloadjs', 'jquery', 'd3', 'topojson', 'underscore', 'utils'], function(preload, $, d3, topojson, _, Util) {

	var loadQueue = new preload.LoadQueue(true);
	loadQueue.on('fileprogress', loadProgressUpdate);
	loadQueue.on('complete', loadComplete);
	loadQueue.loadFile({name: 'Topology', id: 'topo', src: 'assets/data/topo.json'});
	loadQueue.loadFile({name: 'ISO3166 Codes', id: 'iso3166', src: 'assets/data/iso3166.csv'});
	loadQueue.loadFile({name: 'Continents', id: 'continents', src: 'assets/data/country_continent.csv'});
	loadQueue.loadFile({name: 'Countries', id: 'countries', src: 'assets/data/country_latlon.csv'});
	loadQueue.loadFile({name: 'Regions', id: 'regions', src: 'assets/data/region_codes.csv'});
	loadQueue.loadFile({name: 'States', id: 'states', src: 'assets/data/state_latlon.csv'});
	loadQueue.loadFile({name: 'Servers', id: 'servers', src: 'assets/data/servers.json'});
	//loadQueue.loadFile({name: 'Tiles', id: 'tiles', src: 'tiles/geoserver.mbtiles'});

	// D3 Elems
	var dMap = d3.select('#map'),
		dProjection = d3.geo.mercator().scale(300).rotate([-10, 0]),
		dPath = d3.geo.path().projection(dProjection);

	// Local Vars
	var mapLayers = [];

	// DOM Elems
	var $loading = $('.loading'),
		$progress = $('#loading-text'),
		$cover = $('.coverall');

	function loadProgressUpdate(e) {
		$progress.text('Loading\n{filename}\n{progress}%'.assign({
			filename: e.item.name,
			progress: (e.progress * 100).toFixed(0)
		}));
	}

	function loadComplete(e) {
		drawMap();
		drawServers();
		drawDistances();
		$loading.fadeOut();
		$cover.fadeOut();


		// Test Draw of Arcs
		/*var mia = _.find(servers.features, function(d) { return d.properties.name == 'USA Miami CDN' });
		dMap.selectAll('.country.FR').each(function(d) {
			dMap.append('path')
				.attr('class', 'arc')
				.attr('d', function() {
					var source = dProjection(mia.geometry.coordinates),
						target = dPath.centroid(d);

			    	var dx = target[0] - source[0],
			        	dy = target[1] - source[1],
			        	dr = Math.sqrt(dx * dx + dy * dy);
				    return "M" + source[0] + "," + source[1] + "A" + dr + "," + dr + " 0 0,1 " + target[0] + "," + target[1];
				});
		});*/
	}

	function drawMap() {
		var topo = loadQueue.getResult('topo'),
			countries = topojson.feature(topo, topo.objects.ne_50m_admin_0_countries),
			states = topojson.feature(topo, topo.objects.ne_50m_admin_1_states_provinces_lakes);

		var baseMapLayer = dMap.append('g')
								.attr('id', 'layer1');

		baseMapLayer.selectAll('.country')
			.data(countries.features)
		  .enter().append('path')
		  	.attr('class', function(d) { return 'country ' + d.properties.iso_a2; })
			.attr('d', dPath)

		baseMapLayer.selectAll('.state')
			.data(_.filter(states.features, function(d) { return d.properties.iso_a2 == 'US' }))
		  .enter().append('path')
		  	.attr('class', function(d) { return 'state ' + d.properties.code_hasc.replace('.', '_'); })
			.attr('d', dPath);

		mapLayers.push(baseMapLayer);
	}

	function drawServers() {
                var data = loadQueue.getResult('servers');
		var servers = topojson.feature(data, data.objects.places).features;

		var serversLayer = dMap.append('g')
							.attr('id', 'layer2');

		serversLayer.selectAll('.marker')
			.data(servers)
		  .enter().append('circle')
		  	.attr('class', 'marker')
		  	.attr('data-dccode', function(d) { return d.properties.description; })
			.attr('r', 4.5)
			.attr('cx', function(d) { return dProjection(d.geometry.coordinates)[0]; })
			.attr('cy', function(d) { return dProjection(d.geometry.coordinates)[1]; })
			//.on('click', updateServers);

		mapLayers.push(serversLayer);
	}

	function updateServers(de) {
		var servers = mapLayers[1];
		servers.selectAll('.marker')
			.data([de], function(d) { return d.properties.name })
		  .exit()
		  	.attr('r', 1.5);
	}

	function drawDistances() {
                var data = loadQueue.getResult('servers');
		var servers = topojson.feature(data, data.objects.places).features;

		var countries = d3.csv.parse(loadQueue.getResult('countries'));

		var distanceLayer = dMap.append('g')
							.attr('id', 'layer3');

		_.each(countries, function(country) {

			if(country['iso 3166 country'] == 'US')
			{
				var regions = _.filter(d3.csv.parse(loadQueue.getResult('regions')), function(reg) { return reg.country == 'US' }),
					states = _.filter(d3.csv.parse(loadQueue.getResult('states')), function(state) { return _.any(regions, function(reg) { return reg.region == state.state })});

				_.each(states, function(state) {
					var dState = dMap.select('.US_'+state.state).data()[0];

					if(!dState)
						return;

					var dc = _.sortBy(servers, function(server) {
						return Util.Geo.getDistance(server.geometry.coordinates, [state.longitude, state.latitude]);
					})[0];

					var source = dProjection(dc.geometry.coordinates),
						target = dPath.centroid(dState);

					if(Util.Geo.inBounds(dPath.bounds(dState), source))
					{
						/*distanceLayer.append('circle')
						  	.attr('class', 'arc')
							.attr('r', 10)
							.attr('cx', function(d) { return source[0]; })
							.attr('cy', function(d) { return source[1]; });*/
					} else {
						distanceLayer.append('path')
							.attr('class', 'arc')
							.attr('d', function() {
								var dx = target[0] - source[0],
						        	dy = target[1] - source[1],
						        	dr = Math.sqrt(dx * dx + dy * dy);
							    return "M" + source[0] + "," + source[1] + "A" + dr + "," + dr + " 0 0,1 " + target[0] + "," + target[1];	
							});
					}
				});

			} else {

				var dCountry = dMap.select('.'+country['iso 3166 country']).data()[0];

				if(!dCountry)
					return;

				if(dPath.area(dCountry) < 60)
					return;

				var dc = _.sortBy(servers, function(server) {
					return Util.Geo.getDistance(server.geometry.coordinates, [country.longitude, country.latitude]);
				})[0];

				var source = dProjection(dc.geometry.coordinates),
					target = dPath.centroid(dCountry);

				if(Util.Geo.inBounds(dPath.bounds(dCountry), source))
				{
					/*distanceLayer.append('circle')
					  	.attr('class', 'arc')
						.attr('r', 10)
						.attr('cx', function(d) { return source[0]; })
						.attr('cy', function(d) { return source[1]; });*/
				} else {
					distanceLayer.append('path')
						.attr('class', 'arc')
						.attr('d', function() {
							var dx = target[0] - source[0],
					        	dy = target[1] - source[1],
					        	dr = Math.sqrt(dx * dx + dy * dy);
						    return "M" + source[0] + "," + source[1] + "A" + dr + "," + dr + " 0 0,1 " + target[0] + "," + target[1];	
						});
				}
			}
		});

		mapLayers.push(distanceLayer);
	}
})
