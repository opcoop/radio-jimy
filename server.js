/* require all the libs we use */
var _              = require('underscore'),
    express        = require('express'),
    exphbs         = require('express3-handlebars'),
    morgan         = require('morgan'),
    errorh         = require('errorhandler'),
    url            = require('url'),
    backboneio     = require('backbone.io'),
    /* routes */
    api            = require('./api')
;

var conf = {
        maxage: 10,
        Dirs: {
                templates:  '/templates',
                styles: '/assets/styles',
                pub:    '/assets'
        }
};

var app = express();
app.engine('handlebars', exphbs({defaultLayout: "main",
                                 extname: '.html'}));
app.set('port', process.env.PORT || 3100);
//app.set('views', __dirname + conf.Dirs.templates);
app.set('view engine', 'handlebars');
app.use(morgan({ format: 'dev' }));
app.use(require('less-middleware')(
        {
                src:  conf.Dirs.styles,
                dest: conf.Dirs.pub,
                compress: true}
));
app.use('/assets', express.static(__dirname + conf.Dirs.pub));
app.use('/models', express.static(__dirname + conf.Dirs.models));
app.use('/lib',    express.static(__dirname + conf.Dirs.vendor));

var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
        app.use(errorh({ dumpExceptions: true, showStack: true }));
        app.set('io.loglevel', 100);
        app.set('minify', false);
};

if ('production' == env) {
        app.use(errorh());
        app.set('io.loglevel', 1);
        app.set('minify', true);
};

app.route('/')
        .get(function (req, res) {
                res.render('index');
        });

app.use('/api/', api.router);

var server = app.listen(app.get('port'), function(){
    console.info("Express server");
    console.info("listening on port: " + app.get('port'));
    console.info("--------- in mode: " + app.settings.env);
});
server.on ('error', function (err) {
    console.error ('Fatal Error starting Express Server:', err.message);
    process.exit(1);
});

var io = backboneio.listen(server, api.ios);
console.info("  active backends: " + _.keys(api.ios));
io.configure('production', function(){
    // send minified client
    io.enable('browser client minification');
    // apply etag caching logic based on version number
    io.enable('browser client etag');
    // gzip the file
    io.enable('browser client gzip');
});
