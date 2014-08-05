var Icecast = require('icecast-helper')
,   request = require('request')
,   url     = require('url')
,   _	    = require('underscore')
;
var text ="";

var opt  = require('node-getopt').create([
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

              		
		text += "<mount>\n"
		text += "<mount-name>" + item._id + "</mount-name>\n"
		text += "<username>source</username>\n"
		text += "<password>" + item.password + "<password>\n" 
		text += "<stream-name>" + item.name + "</stream-name>\n"
		text += "<stream-description>FM" + item.freq + ", " + item.city + ", " + item.prov + "</stream-description>\n"
    		text += "<stream-url>http://some.place.com</stream-url>\n"
		text += "</mount>\n"
		          
		
		return;
        });
var fs   = require('fs');		
fs.writeFileSync ('icecast.txt',text);		

});


