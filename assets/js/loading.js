define (['preloadjs', 'jquery'], function(preload, $) {
	var loadQueue = new preload.LoadQueue(true);
	loadQueue.on('fileprogress', loadProgressUpdate);
        loadQueue.on('complete', loadComplete);
        loadQueue.loadFile({name: 'Provincias', id: 'provincias', src: 'assets/data/prov.json'});

	loadQueue.loadFile({name: 'Códigos ISO3166', id: 'iso3166', src: 'assets/data/iso3166.csv'});

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
