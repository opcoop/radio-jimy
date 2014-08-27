requirejs.config({
    waitSeconds: 30,
    baseUrl: 'assets/js',
    paths: {
        jquery: '../vendor/jquery/jquery.min',
        crel: '../vendor/crel/crel.min',
        linq: '../vendor/linq/linq.min',
        underscore: '../vendor/underscore/underscore',
        preloadjs: '../vendor/PreloadJS/lib/preloadjs-NEXT.min',
        d3: '../vendor/d3/d3.min',
        topojson: '../vendor/topojson/topojson',
        leaflet: '../vendor/leaflet/dist/leaflet',
        leafletmarkers: '../vendor/Leaflet.awesome-markers/dist/leaflet.awesome-markers.min',
        backbone: '../vendor/backbone/backbone-min',
        marionette: '../vendor/backbone.marionette/lib/backbone.marionette.min',
        wreqr: '../vendor/backbone.wreqr/lib/backbone.wreqr.min',
        socketio: '../../socket.io/socket.io',
        backboneio: '../../socket.io/backbone.io'

        /*gapi: 'https://apis.google.com/js/auth',
        superagent: 'http://cdnjs.cloudflare.com/ajax/libs/superagent/0.15.7/superagent.min'*/
    },
    shim: {
        linq: { exports: 'Enumerable' },
        preloadjs: { exports: 'createjs' },
        topojson: { exports: 'topojson' },
        socketio: {
            exports: 'io'
        },
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        wreqr: {
            deps: ['backbone', 'marionette'],
            exports: 'Backbone.Wreqr'
        },
        backboneio: {
            deps: [
                'backbone'
            ],
            exports: 'Backbone'
        },
        marionette : {
            deps : ['jquery', 'underscore', 'backboneio'],
            exports : 'Marionette'
        },
        leafletmarkers: {
            deps : ['leaflet']
        }
        /*gapi: { exports: 'gapi' }*/
    }
});

define([
    'jquery',
    'socketio',
    'backboneio',
], function( $, io ) {

    window.loadCss = function (url) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = url;
        document.getElementsByTagName("head")[0].appendChild(link);
    };

    loadCss('/assets/vendor/leaflet/dist/leaflet.css');
    loadCss('/assets/vendor/Leaflet.awesome-markers/dist/leaflet.awesome-markers.css');
    loadCss('/assets/vendor/font-awesome/css/font-awesome.min.css');

    var socket = io.connect('http://' + window.location.hostname);
    Backbone.io.connect();

    socket.on('news', function (data) {
        console.log(data);
        socket.emit('my other event', { my: 'data' });
    });


    //Ready to write Backbone Models and Socket.io communication protocol in here :)


    // Start the main app logic.
    requirejs(['main']);
});


