define (['preloadjs', 'jquery'], function(preload, $) {
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
	loadQueue.loadFile({name: 'Radios', id: 'radios', src: 'assets/data/radios.json'});
	loadQueue.loadFile({name: 'Streams', id: 'stations', src: 'assets/data/radios.json'});

        //loadQueue.loadFile({name: 'Tiles', id: 'tiles', src: 'tiles/geoserver.mbtiles'});

// DOM Elems
	var $loading = $('.loading'),
	    $progress = $('#loading-text'),
	    $cover = $('.coverall');

	function loadComplete(e) {
                $loading.fadeOut();
		$cover.fadeOut();
	}


	function loadProgressUpdate(e) {
		$progress.text('Loading\n{filename}\n{progress}%'.assign({
			filename: e.item.name,
			progress: (e.progress * 100).toFixed(0)
		}));
	}

        return loadQueue;
});
