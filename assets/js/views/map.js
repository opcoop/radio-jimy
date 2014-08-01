define (['underscore', 'marionette', 'leaflet', 'leafletmarkers', 'vent', 'loading', 'topojson'],
        function (_, Marionette, L, LM, Vent, loadQueue, topojson) {
        var map; /* hack */

        var redMarker = L.AwesomeMarkers.icon({
                markerColor: 'red',
                prefix: 'fa',
                icon: 'cog',
                spin: true
        });

        var blueMarker = L.AwesomeMarkers.icon({
                markerColor: 'blue'
        });

        var itemView = Marionette.ItemView.extend ({
                initialize: function () {
                        var self = this;
                        var onair = this.model.get('onair');
                        if (onair) {
                                this.marker = L.marker(this.model.get('position'),
                                                       {icon: blueMarker,
                                                        riseOnHover: true});
                        } else {
                                this.marker = L.marker(this.model.get('position'),
                                                       {icon: redMarker,
                                                        riseOnHover: true});
                        }

                        this.marker.on('click', function () {
                                Vent.trigger('radio:selected', self.model);
                                Vent.trigger('select:' + self.model.id, self.model);
                        });

                        this.marker.on('mouseover', function () {
                                Vent.trigger('hover:' + self.model.id, self.model);
                        });

                        this.marker.on('mouseout', function () {
                                Vent.trigger('hover:out:' + self.model.id, self.model);
                        });

                        Vent.on('hover:' + self.model.id, function () {
                                // do something with marker
                        });

                        Vent.on('hover:out:' + self.model.id, function () {
                                // do something with marker
                        });

                        this.marker.addTo(map);
                },
                template: function (data) {
                        // hack: we don't need any templating, it's all
                        // handled by leaflets
                },
                onDestroy: function () {
                        this.marker.remove();
                }
        });

        var mapView = Marionette.CollectionView.extend ({
                itemView: itemView,
                config: {zoom: 5, center: [-40.17887331434695, -63.896484375]},
                initialize: function () {
                        var self = this;
                        map = L.map('map')
                                    .setView(this.config.center, this.config.zoom)
                                    .locate({
                                            setView: false
                                    });
//                                .addLayer(new L.TileLayer("http://{s}.tile.cloudmade.com/1a1b06b230af4efdbb989ea99e9841af/998/256/{z}/{x}/{y}.png"));
                        // add MapQuest tile layer, must give proper OpenStreetMap attribution according to MapQuest terms

                        L.tileLayer('http://otile4.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
                                attribution: '&copy; <a href="www.openstreetmap.org/copyright">OpenStreetMap</a>',
                                opacity: 0.8
                        }).addTo(map);

                        var provincias = loadQueue.getResult('provincias');
                        var prov_layer = L.geoJson(
                                topojson.feature(provincias, provincias.objects.provincias), {
                                style: {
                                        color: '#066',
                                        weight: 1,
                                        opacity: 1,
                                        fillOpacity: 0.3
                                },
                                onEachFeature: onEachFeature
                        }).addTo(map);

                        function clickFeature(e) {
                                var layer = e.target;
                                if (self.selected === layer._path) {
                                        $('li.prov-li').show();
                                        layer._path.setAttribute('class', 'leaflet-clickable');
                                        self.selected = undefined;
                                        map.setView(self.config.center, self.config.zoom);
                                } else {
                                        if (self.selected) {
                                                self.selected.setAttribute('class', 'leaflet-clickable');
                                        }
                                        var bounds =layer.getBounds();
                                        map.fitBounds(bounds);

                                        $('li.prov-li').hide();
                                        $('li.prov-li#' + layer.feature.id.replace(/ /g, '-') + '-li').show();
                                        layer._path.setAttribute('class', 'selected');
                                        self.selected = layer._path;
                                        //console.log(layer.feature.id); //country info from geojson
                                }
                        }

                        function onEachFeature(feature, layer) {
                                layer.on({
                                        click: clickFeature
                                });
                        }
                }
        });

        return mapView;
});
