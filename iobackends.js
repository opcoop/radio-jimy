var _              = require('underscore'),
    uuid           = require('node-uuid'),
    backboneio     = require('backbone.io'),
sio;

var logger = console;

var iobackends =  function () {};

iobackends.prototype.middleware = {
    debug: function (req, res, next) {
        logger.debug('Backend:', req.backend);
        logger.debug('Method: ', req.method);
        logger.debug('Channel:', req.channel);
        logger.debug('Options:', JSON.stringify(req.options));
        logger.debug('Model:  ', JSON.stringify(req.model));
        next();
    },

    uuid: function (req, res, next) {
        if( req.method == 'create' && req.model._id === undefined) {
            req.model._id = uuid.v1();
        }
        next();
    },

    /*
     * On the browser sometimes we need to set the '_id' of new objects
     * so Backbone-relational does not break (when we try to save new
     * objects their relations end up pointing to 'undefined').
     *
     * On that case we need to turn the 'update' request into a 'create'
     * for other browsers to add the newly created objects.
     *
     * To signal this particular condition we add an '_tmpid' attribute
     * to the model and catch that here.
     */
    tmpId: function (req, res, next) {
        if( req.method == 'update' && req.model._tmpid) {
            delete req.model._tmpid;
            req.method = 'create';
        }
        next();
    },

    mongooseStore: function (Model) {
        return backboneio.middleware.mongooseStore(Model);
    },

    mongoStore: function (opts) {
        var mongo = _.extend ({db: opts.db,  opts: {}}, opts);
        var fn = _.identity;

        if (_.has(opts, 'search'))
            fn = mongo.opts.search;

        return fn(backboneio.middleware.mongoStore(mongo.db,
                                                   mongo.collection,
                                                   mongo.opts));
    }
};

iobackends.prototype.initialize = function (backends) {
    if(_.isUndefined(backends) || _.isEmpty(backends)) {
        logger.info("Backends are missing");
    }

    this.backends = backends;

    /* process the backends object to streamline code */
    var binded = [];
    _(this.backends).each (function (backend, name) {
        backend.io = backboneio.createBackend();
        if (backend.use) {
            _(backend.use).each (function (usefn) {
                backend.io.use(usefn);
            });
        }

        /*
         * On the backend definition we either pass a 'mongo' hash with the
         * connection details or a middleware that stores data.
         *
         * This is so because most of the storage middlewares end up doing
         * a res.end() stopping the processing there and sometimes we want
         * things like the debugbackend to work.
         */

        if (backend.store) {
            backend.io.use(backend.store);
        }
    });

    if (binded.length) {
        logger.info ('binding to mongo collections:', binded.join(', ') + '.');
    }

    return this;
};

iobackends.prototype.emit = function (name, args) {
    var backend = this.backends[name];
    if (backend) {
        var _io = backend.io;
        _io.emit.apply(_io, args);
    } else {
        logger.error('iobackends.emit() no such backend:', name);
    }
};

iobackends.prototype.get_ios = function () {
    var ret = {};
    var self = this;
    _(_.keys(this.backends)).each (function (backend) {
        ret[backend + 'backend'] = self.backends[backend].io;
    });
    return ret;
};

iobackends.prototype.get = function (name) {
    return this.backends[name];
};

module.exports = module = iobackends;
