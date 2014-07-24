var _		= require('underscore')
,   fs		= require('fs')
,   csvParse    = require('csv-parse')
,   mongoose    = require('mongoose')
,   db		= mongoose.createConnection('mongodb://localhost/backboneio')
,   Schema	= require('./models/radio')
;

var Model = db.model('Radio', Schema);

var f = 0;
var n = 0;

function formatData (data, geodata) {
        var onair = (data[4] === 'AL AIRE')?true:false;

        return {
                name: data[2],
                prov: data[0],
                city: data[1],
                freq: data[3],
                desc: 'Radio CAJ FM' + data[3],
                position: {
                        lng: geodata.coordinates[0],
                        lat: geodata.coordinates[1]
                },
                onair: onair,
                stream: false
        };
}

console.log (process.argv[2]);
var raw = require('./assets/data/cities-ar.json').features;
var cities = _.pluck(raw, 'properties');
var coords = _.pluck(raw, 'geometry');

for (var i in cities) {
        cities[i] = _.extend(cities[i], coords[i]);
}

var notfound = [];

var csv = csvParse(fs.readFileSync(process.argv[2]), {}, function (err, output) {
        console.log (cities);
        var godo = _.map (output, function (data) {
                var mod = ['', 'VILLA ', 'GENERAL ', 'MINISTRO ', 'EL ', 'LOS ', 'ESTACION '];
                var loc = data[1].split(' - ');
                var pos;
                for (var j in mod) {
                        for (var i in loc) {
                                pos = _.findWhere(cities, {
                                        PROVINCIA: data[0],
                                        LOCALIDAD: mod[j] + loc[i]
                                });
                                if (pos) {
                                        f++;
                                        return formatData(data, pos);
                                }
                        }
                }

                for (var j in mod) {
                        for (var i in loc) {
                                pos = _.findWhere(cities, {
                                        PROVINCIA: data[0],
                                        DARTAMENTO: mod[j] + loc[i],
                                        TIPO: 'CABECERA DE DEPARTAMENTO'
                                });
                                if (pos) {
                                        f++;
                                        return formatData(data, pos);
                                }
                        }
                }


                n++;
                notfound.push (data);
                return null;
        });

        _.each(godo, function (g) {
                if (g === null) {
                        return;
                }
                _.extend(g, {creator: 'importado@me.gob.ar'});
                Model.create(g, function(err, model) {
	                if(err) {
		                console.error(err);
		        }
	        });

        });

        console.log ('found', f, 'not found', n);
});


