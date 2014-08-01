var _		= require('underscore')
,   fs		= require('fs')
,   csvParse    = require('csv-parse')
,   mongoose    = require('mongoose')
,   Schema	= require('./models/radio')
;



var opt = require('node-getopt').create([
        ['o' , 'out=ARG'	, 'write csv back to file.'],
        [''  , 'db[=ARG]'	, 'write data to db.'],
        ['h' , 'help'		, 'display this help'],
        ['v' , 'version'	, 'show version']
])              // create Getopt instance
.bindHelp()     // bind option 'help' to default action
.parseSystem(); // parse command line

if (! opt.argv[0])
        return console.error ('need an argument');

var f = 0;
var n = 0;

var csvOut = [];

function csvWrite (data, file) {

        fs.writeFileSync(file, _.map(data, function (d) {
                return (d.join(','));
        }).join('\n'));
}

function dataOut (data, geodata) {
        if (geodata) {
                csvOut.push(_.union (data, [geodata.coordinates[0], geodata.coordinates[1]]));
                return formatData (data, geodata);
        }

        csvOut.push(data);
        return null;
};

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

console.log (opt);
var raw = require('./assets/data/cities-ar.json').features;
var cities = _.pluck(raw, 'properties');
var coords = _.pluck(raw, 'geometry');

for (var i in cities) {
        cities[i] = _.extend(cities[i], coords[i]);
}

var notfound = [];

var csv = csvParse(fs.readFileSync(opt.argv[0]), {}, function (err, output) {
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
                                        return dataOut(data, pos);
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
                                        return dataOut(data, pos);
                                }
                        }
                }


                n++;
                notfound.push (data);
                return dataOut(data);
        });

        if (opt.options.hasOwnProperty('db')) {
                var dbUrl = 'mongodb://' + (opt.options.db || 'localhost/backboneio');

                console.log ('writting', f, 'to', dbUrl);

                var db	= mongoose.createConnection(dbUrl);
                var Model = db.model('Radio', Schema);

                _.each(godo, function (g) {
                        if (g === null || !g) {
                                return;
                        }
                _.extend(g, {creator: 'importado@me.gob.ar'});
                        Model.create(g, function(err, model) {
	                        if(err) {
		                        console.error(err);
		                }
	                });

                });
        }

        if (opt.options.hasOwnProperty('out')) {
                console.log ('writting', csvOut.length, 'to', opt.options.out);
                csvWrite(csvOut, opt.options.out);
        }

        console.log ('found', f, 'not found', n);
});


