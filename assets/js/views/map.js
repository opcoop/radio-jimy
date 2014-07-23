define (['underscore', 'marionette', 'leaflet', 'topojson'], function (_, Marionette, L, topojson) {
        var map; /* hack */
        var itemView = Marionette.ItemView.extend ({
                initialize: function () {
                        this.marker = L.marker(this.model.get('position'));
                        this.marker.addTo(map);
                },
                template: function (data) {
                },
                modelEvents: {
                        "change": "modelChanged"
                },
                collectionEvents: {
                        "add": "modelAdded"
                },

                modelAdded: function (arg) {
                        console.log ('modelAdded', arg);
                },
                modelChanged: function (arg) {
                        //this.marker.setLatLng(this.model.get('position'));
                },
                onDestroy: function () {
                        this.marker.remove();
                }
        });

        var mapView = Marionette.CollectionView.extend ({
                itemView: itemView,
                config: {zoom: 5, center: [-40.17887331434695, -63.896484375]},
                initialize: function () {
                        map = L.map('map')
                                    .setView(this.config.center, this.config.zoom)
                                    .locate({
                                            setView: true
                                    });
                        // add MapQuest tile layer, must give proper OpenStreetMap attribution according to MapQuest terms
                        L.tileLayer('http://otile4.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
                                attribution: '&copy; <a href="www.openstreetmap.org/copyright">OpenStreetMap</a>',
                                opacity: 0.8
                        }).addTo(map);
                }
        });

        return mapView;
});
