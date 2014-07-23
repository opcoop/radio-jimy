require(['loading', 'app', 'vent',
         'jquery', 'underscore', 'backbone', 'utils',
         'models/radio',
         'views/map', 'views/radiolist', 'views/player'],
        function(LoadView, App, Vent,
                 $, _, Backbone, Util,
                 Radio,
                 MapView, ListView, PlayerView) {
            App.start();

            Vent.on('radio:selected', function (model) {

                return true;
            });

            App.vent.on('radio:selected', function (args) {
                console.log('hello poto', args);
            });


            function selectRadio (d) {
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
	}
})
