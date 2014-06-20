require(['preloadjs', 'jquery', 'd3', 'topojson', 'underscore', 'utils', 'player'], function(preload, $, d3, topojson, _, Util, Player) {

	var loadQueue = new preload.LoadQueue(true);
	loadQueue.on('fileprogress', loadProgressUpdate);
	loadQueue.on('complete', loadComplete);
	loadQueue.loadFile({name: 'Mapa Mundi', id: 'topo', src: 'assets/data/topo.json'});
        loadQueue.loadFile({name: 'Mapa Mundi (baja resolución)', id: 'countrieslowres', src: 'assets/data/world-countries.json'});
        loadQueue.loadFile({name: 'Provincias', id: 'provincias', src: 'assets/data/argentina-provincias.json'});

	loadQueue.loadFile({name: 'Códigos ISO3166', id: 'iso3166', src: 'assets/data/iso3166.csv'});
	loadQueue.loadFile({name: 'Continentes', id: 'continents', src: 'assets/data/country_continent.csv'});
	loadQueue.loadFile({name: 'Países', id: 'countries', src: 'assets/data/country_latlon.csv'});

	loadQueue.loadFile({name: 'Regiones', id: 'regions', src: 'assets/data/region_codes.csv'});
	loadQueue.loadFile({name: 'States', id: 'states', src: 'assets/data/state_latlon.csv'});
	loadQueue.loadFile({name: 'Radios', id: 'servers', src: 'assets/data/servers.json'});
	loadQueue.loadFile({name: 'Streams', id: 'stations', src: 'assets/data/radios.json'});

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

        function highlightRadio (d) {
                $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?",
                          {
                                  tags: d.properties.name + ',argentina',
                                  tagmode: "all",
                                  format: "json"
                          }, function (data) {

                                  var p = Util.pick_one(data.items);
                                  d3.select('.radio-cover')
                                          .attr('src', p.media.m);
                });
// 			<source src="http://storage-new.newjamendo.com/download/track/705190/mp32/Abi_-_Abitude.mp3" type="audio/mpeg" codecs="mp3"></source>
                d3.select('#audio')
                        .attr({src: "http://listen.42fm.ru:8000/stealkill-3.0.ogg" //function (d) {return d.listen_url},
                              });

                d3.select('#desc' + d.id)
                        .classed({orange: true});

                d3.select('#marker' + d.id)
                        .transition().duration(400)
                        .style('fill', 'red')
                        .attr('r', 20);

                d3.select('#player-radio')
                        .transition().duration(400)
                        .text(function () {return d.properties.name;});

                d3.select('#player-desc')
                        .transition().duration(400)
                        .text(function () {return d.properties.desc;});
        }

        function unlightRadio (d) {
                d3.select('#desc' + d.id)
                        .classed({orange: false});

                d3.select('#marker' + d.id)
                        .transition().duration(400)
                        .style('fill', 'white')
                        .attr('r', 4.5);
        }

        function drawPlaylist(serversLayer, added) {
                var rup = d3.select('.playlist');
                var p = rup.selectAll('li')
                            .data(added, function(d) { return d.id;});

                var l = p.enter()
                            .append("li")
                            .attr({class: 'pentry', id: function (d) { return 'desc' + d.id;}})
                            .on('mouseenter', function (d) {
                                    highlightRadio(d);
                            })
                            .on('mouseleave', function (d) {
                                    unlightRadio(d);
                            });

                l.append('a').attr('href', '#');
                l.append('i');
                l.text(function (d) {return d.properties.name});
        }

        function drawDesc(serversLayer, added) {
                var rup = d3.select('#up');
                var p = rup.selectAll('li')
                            .data(added, function(d) { return d.id;});

                p.select('.desc-label').classed('live', function (d) { return (d.live);});

                var l = p.enter()
                            .append("li")
                            .attr({class: 'radio', id: function (d) { return 'desc' + d.id;}})
                            .on('mouseenter', function (d) {
                                    highlightRadio(d);
                            })
                            .on('mouseleave', function (d) {
                                    unlightRadio(d);
                            });

                l.append("label")
                        .attr('class', 'desc-label')
                        .classed('live', function (d) { return (d.live);})
                        .append("h2")
                        .attr('for', function (d) { return 'label-' + d.properties.id; })
                        .text(function (d) { return d.properties.name;})
                        .append("span")
                        .text(function (d) {return d.properties.desc;});
                /*
                 l.append("p")
                 .text(function (d) {return mapu_talk (15, 30);});
                 */
                p.exit().remove();
        }

        function  drawCircles(serversLayer, up) {
                var join = serversLayer.selectAll('.marker')
			    .data(up, function (d) { return d.id;;});

                join.style({"stroke": "white"})
                        .transition().delay(function (d) {return Math.random()*1000;}).duration(550)
                        .style("stroke-width", function (d) {
                                if (d.live)
                                        return 7;
                                return 1;
                        });


		var circles = join.enter().append('circle');

		circles.attr({class: 'marker', id: function (d) {return 'marker' + d.id;}})
			.attr('cx', function(d) { return dProjection(d.geometry.coordinates)[0]; })
			.attr('cy', function(d) { return dProjection(d.geometry.coordinates)[1]; })
                        .attr('r', 0)
                        .style({stroke: "rgba(255, 255, 255, 0.7)",
                                fill: "rgba(255, 255, 255, 0.7)"})
                        .transition().duration(400)
                        .attr('r', 4.5)
                        .style({stroke: "rgba(255, 0, 0, 0.7)"});
                //                                        fill: "transparent"});

                circles.append('svg:title')
                        .text(function(d) {return d.properties.name});

		//.on('click', updateServers);

                circles.on('mouseover', function (d) {
                        highlightRadio(d);
                });

                circles.on('mouseout', function (d) {
                        unlightRadio(d);
                });


                circles.on('click', function () {
                        //                                console.log (this, 'clicked');
                        d3.select(this).transition().duration(400)
                                        .attr('r', 20);
                });

                join.exit()
                        .transition().duration(400)
                        .attr('r', 100)
                                .transition().duration(200)
                        .attr('r', 0)
                        .remove();
        }

	function drawServers() {
                var data = loadQueue.getResult('servers');
//                var streams = loadQueue.getResult('stations');
		var servers = topojson.feature(data, data.objects.places).features;
                servers = servers.map (function (d,k) {
                        d.id = k;
                        d.properties.desc = Util.Radio.mapu_talk(2, 4);
//                      d.stream = Util.pick_one(streams);
                        return d;
                });

		var serversLayer = dMap.append('g')
			    .attr('id', 'layer3');

                Util.Radio.life (servers, function (up) {
                        drawPlaylist(serversLayer, up);
                        drawCircles (serversLayer, up);
                        drawDesc    (serversLayer, up);
		        mapLayers.push(serversLayer);
                });
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
