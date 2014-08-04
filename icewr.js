var Icecast = require('icecast-helper')
,   request = require('request')
,   url     = require('url')
,   _	    = require('underscore')
;

var opt = require('node-getopt').create([
        ['k' , 'key'		, 'API key'],
        ['h' , 'help'		, 'display this help'],
        ['v' , 'version'	, 'show version']
])              // create Getopt instance
.bindHelp()     // bind option 'help' to default action
.parseSystem(); // parse command line

var key = opt.options.key || 'd1rtys3cr1t';
var URL = opt.argv[0] || 'http://localhost:3100/api/' + key + '/radio';

request(URL, function (error, response, body) {
        if (error || response.statusCode != 200) {
                return error;
        }
        var collection = JSON.parse (body);
        _.each(collection, function (item) { /* populate the memorystore */
                if (! item.stream)
                        return;

                var model = {
                        name  : item.name,
                        _id   : item._id,
                        password: key,
                };

                console.log("<mount><mount-name>",item.name,"</mount-name>", "<username>source</username><password>", key, "</password>");

             

                return;
        });
});

console.log ('ran out of radios to monitor');
