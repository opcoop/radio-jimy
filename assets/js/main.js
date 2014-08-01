require(['loading', 'app', 'vent',
         'jquery', 'underscore', 'backbone', 'utils',
         'models/radio',
         'views/map', 'views/radiolist', 'views/player'],
        function(loadQueue, App, Vent,
                 $, _, Backbone, Util,
                 Radio,
                 MapView, ListView, PlayerView) {

            loadQueue.on('complete', function () {
                    var $loading = $('.loading'),
	                $cover = $('.coverall');
                    $loading.fadeOut();
		    $cover.fadeOut();
                    App.start();
            });

            Vent.on('radio:selected', function (model) {

                return true;
            });

            App.vent.on('radio:selected', function (args) {
                console.log('hello poto', args);
            });
})
