var Icecast = require('icecast-helper')
,   mongoose= require('mongoose')
,   fs      = require('fs')
,   _	    = require('underscore')
;

var db = mongoose.createConnection('mongodb://localhost/backboneio');
var Schema = require('./models/radio');
var Model = db.model ('Radio', Schema);


var opt  = require('node-getopt').create([
        ['k' , 'key'		, 'API key'],
        ['h' , 'help'		, 'display this help'],
        ['v' , 'version'	, 'show version']
])              // create Getopt instance
.bindHelp()     // bind option 'help' to default action
.parseSystem(); // parse command line

Model.find({}, function (err, data) {
        if(err) {
		return console.error(err);
	}

        var text = "";
	var collection = data;
        _.each(collection, function (item) { /* populate the memorystore */
                if (! item.stream)
                        return;

                console.log ('processing', item);
		text += "<mount>\n";
		text += "<mount-name>" + item._id + "</mount-name>\n";
		text += "<username>source</username>\n";
		text += "<password>" + item.password + "<password>\n";
		text += "<stream-name>" + item.name + "</stream-name>\n";
		text += "<stream-description>FM" + item.freq + ", " + item.city + ", " + item.prov + "</stream-description>\n";
    		text += "<stream-url>http://some.place.com</stream-url>\n";
		text += "</mount>\n";

		return;
        });

        fs.writeFileSync ('icecast.txt',text);
        process.exit();
});


