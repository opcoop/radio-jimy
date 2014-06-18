requirejs.config({
    baseUrl: 'assets/js',
    paths: {
        jquery: 'http://cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min',
        crel: 'http://cdnjs.cloudflare.com/ajax/libs/crel/1.1.1/crel.min',
        linq: 'http://cdnjs.cloudflare.com/ajax/libs/linq.js/2.2.0.2/linq.min',
        underscore: 'http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min',
        preloadjs: 'http://cdnjs.cloudflare.com/ajax/libs/PreloadJS/0.4.1/preloadjs.min',
        d3: 'http://cdnjs.cloudflare.com/ajax/libs/d3/3.4.2/d3.min',
        topojson: 'http://cdnjs.cloudflare.com/ajax/libs/topojson/1.1.0/topojson.min',
        /*gapi: 'https://apis.google.com/js/auth',
        superagent: 'http://cdnjs.cloudflare.com/ajax/libs/superagent/0.15.7/superagent.min'*/
    },
    shim: {
        linq: { exports: 'Enumerable' },
        preloadjs: { exports: 'createjs' },
        topojson: { exports: 'topojson' },
        /*gapi: { exports: 'gapi' }*/
    }
});

// Start the main app logic.
requirejs(['main']);