define (['jquery', 'underscore', 'backbone', 'utils',
         'models/radio',
         'views/map', 'views/radiolist', 'views/player'],
        function($, _, Backbone, Util, Radio, MapView, ListView, PlayerView) {
            var App = new Backbone.Marionette.Application();

            App.addRegions({
                mapRegion: '#map',
                listRegion: '#radio-list',
                playerRegion: '#player'
            });

            App.addInitializer(function(options){
                var col = new Radio.Collection();
                col.fetch();

                var mapView    = new MapView ({collection: col});
                var listView   = new ListView({collection: col});
                var playerView = new PlayerView({
                    collection: col,
                    model: new Backbone.Model({
                            name: 'selecciona una radio',
                            cover: '',
                            src:   'null',
                            desc:  'none',
                            onair: false
                    })
                });

                App.listRegion.show(listView);
                App.playerRegion.show(playerView);
            });

            return App;
        });
