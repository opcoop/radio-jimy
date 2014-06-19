require(['preloadjs', 'jquery', 'd3', 'topojson', 'underscore', 'utils'], function(preload, $, d3, topojson, _, Util) {

	var loadQueue = new preload.LoadQueue(true);
	loadQueue.on('fileprogress', loadProgressUpdate);
	loadQueue.on('complete', loadComplete);
	loadQueue.loadFile({name: 'Topology', id: 'topo', src: 'assets/data/topo.json'});
        loadQueue.loadFile({name: 'Countries (lowres)', id: 'countrieslowres', src: 'assets/data/world-countries.json'});
        loadQueue.loadFile({name: 'Provincias)', id: 'provincias', src: 'assets/data/argentina-provincias.json'});

	loadQueue.loadFile({name: 'ISO3166 Codes', id: 'iso3166', src: 'assets/data/iso3166.csv'});
	loadQueue.loadFile({name: 'Continents', id: 'continents', src: 'assets/data/country_continent.csv'});
	loadQueue.loadFile({name: 'Countries', id: 'countries', src: 'assets/data/country_latlon.csv'});

	loadQueue.loadFile({name: 'Regions', id: 'regions', src: 'assets/data/region_codes.csv'});
	loadQueue.loadFile({name: 'States', id: 'states', src: 'assets/data/state_latlon.csv'});
	loadQueue.loadFile({name: 'Servers', id: 'servers', src: 'assets/data/servers.json'});
	//loadQueue.loadFile({name: 'Tiles', id: 'tiles', src: 'tiles/geoserver.mbtiles'});

	// D3 Elems

        var config = {
                scale: 1200,
                rot: [55, 30]
        };

	var dMap = d3.select('#map'),
	    dProjection = d3.geo.orthographic()
                    .scale(config.scale)
                    .rotate(config.rot)
                    .clipAngle(90),
	    dPath = d3.geo.path().projection(dProjection),
            dDrag = d3.behavior.drag()
                    .on("drag", drag),
            dZoom = d3.behavior.zoom()
                    .translate([0, 0])
                    .scale(1)
                    .scaleExtent([1, 8])
                    .on("zoom", zoomed);

        dDrag.on('dragstart', dragstart);
        dDrag.on('dragend', dragend);

        function dragstart() {
                drawMapLowRes();
        }

        function dragend() {
                drawMap();
        }

        function drag() {
                var s = config.scale/dProjection.scale();
                var oO = dProjection.rotate();
                dProjection.rotate([oO[0] + d3.event.dx*s / 6,
                                    oO[1] - d3.event.dy*s / 6]);
                refresh();
        }

        function zoomed() {
                dProjection.scale(config.scale * d3.event.scale);
                refresh();
        }

        dMap
                .call(dDrag)
                .call(dZoom) // delete this line to disable free zooming
                .call(dZoom.event);

        function hPath(d) {
                return dPath(d) || "M0,0";
        }

        function refresh(duration) {
                var feature = dMap.selectAll("path");
                var markers = dMap.selectAll("circle");
                (duration ? feature.transition().duration(duration) : feature).attr("d", hPath);
                (duration ? markers.transition().duration(duration) : markers)
                	.attr('cx', function(d) {
                                return dProjection(d.geometry.coordinates)[0]; })
			.attr('cy', function(d) {
                                return dProjection(d.geometry.coordinates)[1]; });
        }

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
                addMapLayer();
		drawMap();
                drawProv();
		drawServers();
//		drawDistances();
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

        function addMapLayer() {
                var baseMapLayer = dMap.append('g')
			    .attr('id', 'layer1');

        }

	function drawMap() {
		var topo = loadQueue.getResult('topo'),
		    countries = topojson.feature(topo, topo.objects.ne_50m_admin_0_countries);

                var baseMapLayer = dMap.select('#layer1');

                var join = baseMapLayer.selectAll('path')
			    .data(countries.features, function(d) { return d.properties.iso_a3; });

                console.log ('map', countries.features[0]);
		join.enter().append('path')
		  	.attr('class', function(d) { return 'country ' + d.properties.iso_a3; })
			.attr('d', dPath)
                        .append('svg:title')
                        .text(function(d) {return d.properties.name});

                join.exit().remove();
	}

	function drawMapLowRes() {
                var countries = loadQueue.getResult('countrieslowres');

                var baseMapLayer = dMap.select('#layer1');
		var join = baseMapLayer.selectAll('path')
			    .data(countries.features, function(d) { return d.id; });

                console.log ('mapLR', countries.features[0]);
		join.enter().append('path')
		  	.attr('class', function(d) { return 'country ' + d.id; })
			.attr('d', dPath);

                join.exit().remove();
	}

        function drawProv() {
                var provs = loadQueue.getResult('provincias');
                var provLayer = dMap.append('g')
			    .attr('id', 'layer2');

		var join = provLayer
                            .append('svg:path')
                            .datum(topojson.mesh(provs, provs.objects.provincias, function(a, b) { return a !== b; }))
                            .attr("class", "mesh")
                            .attr("d", dPath);

        }

	function drawServers() {
                var data = loadQueue.getResult('servers');
		var servers = topojson.feature(data, data.objects.places).features;

		var serversLayer = dMap.append('g')
			    .attr('id', 'layer3');
		var circles = serversLayer.selectAll('.marker')
			.data(servers)
		            .enter().append('circle');

		circles.attr('class', 'marker')
		  	.attr('data-dccode', function(d) { return d.properties.description; })
			.attr('r', 0)
			.attr('cx', function(d) { return dProjection(d.geometry.coordinates)[0]; })
			.attr('cy', function(d) { return dProjection(d.geometry.coordinates)[1]; })
                        .transition().duration(2000)
                        .attr('r', 4.5);

                circles.append('svg:title')
                        .text(function(d) {return d.properties.name});

			//.on('click', updateServers);

                circles.on('mouseover', function () {
                        d3.select(this).transition().duration(400)
                                .attr('r', 10);
                });

                circles.on('mouseout', function () {
                        d3.select(this).transition().duration(200)
                                .attr('r', 4.5);
                });


                circles.on('clicked', function () {
                        d3.select(this).transition().duration(4000)
                                .attr('r', 20);
                });


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
		});

		mapLayers.push(distanceLayer);
	}
})
