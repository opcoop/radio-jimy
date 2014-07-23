/*
 * Bring support for bindBackend() behaviour on the server
 * so models are synchronized between the server and browser.
 *
 * It can also use redis as transport to have consistency
 * among many servers and their browsers.
 */

var iocompat = module.exports = exports = {};

var _              = require('underscore'),
    uuid           = require('node-uuid'),
    Backbone       = require('backbone')
;

var nullFunc = function () {};
var logger = console;

var publisher = iocompat.publisher = {publishJSON: nullFunc};
var listener  = iocompat.listener  = {on: nullFunc, subscribe: nullFunc};

/* XXX: copypasta from backbone.io/lib/browser.js */
function inherits(Parent, Child, mixins) {
    var Func = function() {};
    Func.prototype = Parent.prototype;

    mixins || (mixins = [])
    _.each(mixins, function(mixin) {
        _.extend(Func.prototype, mixin);
    });

    Child.prototype = new Func();
    Child.prototype.constructor = Child;

    return _.extend(Child, Parent);
};

/*
 * When we publish something it comes back also to our
 * listener, so we add a unike token to distinguish them.
 */
var _client_id = uuid.v4();

/*
 * redisMiddleware.
 * This middleware broadcasts and processes changes over Redis,
 * sending them thru io to the browser and also emmiting the
 * 'redis' and 'redis:[create|update|delete]' events to update
 * our models here in the server.
 */
iocompat.redisMiddleware = function (backend, name, chain) {
    var _chan = '_RedisSync.' + name;
    var io = backend.io;

   /*
    * Called when something arrives via redis.
    * If the origin is not from us (different _client_id)
    * we turn that into a fake request to io.
    */
    function _onMessage(chan, msg) {
        if (chan != _chan) {
            return;
        }

        if (msg._redis_source == _client_id) {
            return;
        }

        var res = {end:function(){}, error:function(){}};
        var req = msg;

        io.handle (req, res, function(err, result) {
            if (err) {
                logger.error('RedisSync _onMessage: ', err, result);
            }
        });

        var event = {create: 'created', read: 'updated', update: 'updated', delete: 'deleted'};
        io.emit(event[req.method], req.model);
        io.emit('redis', req.method, req.model);
        io.emit('redis:'+req.method, req.model);
    };

    listener.subscribe(_chan);
    listener.on('JSONmessage', _onMessage);

   /*
    * The real middleware.
    * For methods other than 'read' we send them to redis.
    *
    * If this request came from redis normally we stop processing here, as
    * the data is already persisted (at the end of the chain we have something
    * that writes to a permanent storage, so if we do a 'read' it will give the
    * correct result, and we avoid saving the same multiple times and some races.
    * Unless we have something like a different mongo instance that is not in sync
    * with ours.)
    *
    * However, for storage backends like memoryStore we also need to save because
    * if we try to read from that it will return whatever it has and not the most
    * recent data.
    */
    function _middleware(req, res, next) {
        if (req._redis_source) {
            if (chain) {
                next();
            } else {
                res.end(req.model);
            }
            return;
        }
        if (req.method.match(/create|update|delete/)) {
            publisher.publishJSON(_chan, { model: req.model, method:req.method, _redis_source:_client_id});
        }
        next();
    };

    return _middleware;
};

/*
 * eventMiddleware
 * This middleware forwards events from the browser so we can
 * keep our models here in sync, using bindBackend() as usual.
 *
 * For requests that came over redis we do nothing as the model
 * already listens for the 'redis' events, we just pass it along
 * the chain.
 *
 * Else, if the request came from the browser we emit a new pair
 * of events and keep churning.
 */
iocompat.eventMiddleware = function (backend) {
    var io = backend.io;
    function _middleware(req, res, next) {
        if (req._redis_source) {
            next();
            return;
        }
        if (req.method.match(/create|update|delete/)) {
            io.emit('browser', req.method, req.model);
            io.emit('browser:'+req.method, req.model);
        }
        next();
    };

    return _middleware;
};



/*
 * Here be dragons.
 * This patches Backbone.sync, Backbone.Collection and Backbone.Model
 * so sync() and bindBackend() work on the server.
 */
iocompat.patchBackbone = function (iobackend) {
    if (Backbone._iocompatPatched == true) {
        return;
    }
    Backbone._iocompatPatched = true;

   /*
    * In the models we have backend: blahbackend
    * but here (iobackends) we strip the trailing 'backend' from
    * the name.
    */
    function buildBackend(collection) {
        var options = collection.backend;
        var name;
        var channel = '';
        if (typeof options === 'string') {
            name = options;
            name = name.replace(/backend$/,'');
        } else {
            name = options.name;
            name = name.replace(/backend$/,'');
            channel = options.channel || '';
        }
        // may fail.
        var _io = iobackend.get(name).io;
        if (!_io) {
            logger.error('patchBackbone() no io backend found for: ', name);
        }
        _io.name = name;
        _io.channel = channel;
        return _io
    };

    // Custom sync() implementation that proxies to the io stack.
    function _sync (method, model, options) {
        var collection = model.collection || model;
        var backend = collection.backend;

        var error   = options.error || function (err)  {logger.error ('error:' + err )};
        var res = {end: success, error: error};
        var req = {method: method, model: model.toJSON(), options: options};

        if (!backend) {
            logger.error('iobackends custom sync, missing backend');
            error(' missing backend');
            return
        }

       /*
        * The callback passed to backend.handle() is called
        * only if we reach the end of the chain and have errors
        * according to the code of backbone.io/lib/backend.js
        *
        * So we use the 'end' callback of the request.
        */
        function success (_mdl) {
           /*
            * Oh sweet joy.
            * For collections here we get something like
            * [ {total_entries: N}, [array of models]]
            * or sometimes just
            * [array of models]
            */
            if (_.isArray(_mdl)
                    && _mdl.length >= 1
                    && _.has(_mdl[0], 'total_entries')
                    && _.isArray(_mdl[1]) )
            {
                _mdl = _mdl[1];
            }

            if (method != 'read') {
                var event = {create: 'created', read: 'updated', update: 'updated', delete: 'deleted'};

                backend.emit (event[method], _mdl);
            }

            if (options.success) {
                options.success(_mdl);
            }
        };

        backend.handle (req, res, function(err, result) {
            logger.error ('while sync: ' + err);
        });
    };

    Backbone.sync = _sync;

   /*
    * The following block is mostly the same as backbone.io.
    *
    * For changes that came from redis or the browser the model/collection
    * emits a 'backend' and 'backend:[create|update|delete]' event
    * and it behaves just like backbone.io.
    *
    */
    var CollectionMixins = {
        // Listen for backend notifications and update the
        // collection models accordingly.
        bindBackend: function() {
            var self = this;
            var idAttribute = this.model.prototype.idAttribute;

           /*
            * XXX: we are not using this but will be nice to have
            * to be fully compatible with io.
            * var event = self.backend.options.event;
            */
            function _onMessage(event, method, model) {
                if (method == 'create') {
                    self.add(model);
                } else if (method == 'update') {
                    var item = self.get(model[idAttribute]);
                    if (item) {
                        item.set(model);
                    }
                } else if (method == 'delete') {
                    self.remove(model[idAttribute]);
                }

                self.trigger(event + ':' + method, model);
                self.trigger(event, method, model);
            };

            self.backend.on('redis', _.partial(_onMessage, 'backend'));
            self.backend.on('browser', _.partial(_onMessage, 'backend'));
        },
    };

    var ModelMixins = {
        bindBackend: function() {
            var self = this;
            var idAttribute = this.idAttribute;

           /*
            * XXX: we are not using this but will be nice to have
            * to be fully compatible with io.
            * var event = self.backend.options.event;
            */
            function _onMessage(event, method, model) {
                if (method == 'create') {
                    self.save(model);
                } else if (method == 'update') {
                    self.set(model);
                } else if (method == 'delete') {
                    self.destroy();
                }

                self.trigger(event + ':' + method, model);
                self.trigger(event, method, model);
            };

            self.backend.on('redis', _.partial(_onMessage, 'backend'));
            self.backend.on('browser', _.partial(_onMessage, 'backend'));
        }
    };

    Backbone.Model = (function(Parent) {
        // Override the parent constructor
        var Child = function() {
            if (this.backend) {
                this.backend = buildBackend(this);
            }

            Parent.apply(this, arguments);
        };
        // Inherit everything else from the parent
        return inherits(Parent, Child, [ModelMixins]);
    })(Backbone.Model);

    Backbone.Collection = (function(Parent) {
        // Override the parent constructor
        var Child = function() {
            if (this.backend) {
                this.backend = buildBackend(this);
            }

            Parent.apply(this, arguments);
        };
        // Inherit everything else from the parent
        return inherits(Parent, Child, [CollectionMixins]);
    })(Backbone.Collection);
};
