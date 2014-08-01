var express	= require('express'),
    bodyparser	= require('body-parser'),
    _		= require('underscore'),
    /* utilities */
    backboneio	= require('backbone.io'),
    mongoose	= require('mongoose'),
    uuid        = require('uuid-v4'),
    /* local helpers */
    iobackends	= require ('./iobackends')
;

var iob = new iobackends();

var db = mongoose.createConnection('mongodb://localhost/backboneio');
var Schema = require('./models/radio');
var Model = db.model ('Radio', Schema);

Model.filter = function  (model) { /* hack */
        delete model.creator;
        model.creator = undefined;
};

var backends = {
        app: {
                use: [backboneio.middleware.memoryStore()]
        },
        radio: {
                use: [iob.middleware.mongooseStore(Model)]
        },
        live: {
                use: [backboneio.middleware.memoryStore()]
        }
};

var app         = express.Router(),
    router	= express.Router(),
    ios		= iob.initialize(backends).get_ios()
;

function emit (req, res, type, model) {
        ios['radiobackend'].emit(type, model);
        var resp = {};
        resp[type] = model;
        return res.send(200, resp);
}

function errOut (res, err) {
        console.log(err);
	return res.send(400, err);
}

function updateById(req, res, next) {
        Model.findById (req.params.id, function (err, doc) {
                if (err) {
                        return errOut (res, err);
                }
                _.extend (doc, req.body);
                doc.save();
                return emit (req, res, 'updated', doc);
        });
};

function update(req, res, next) {
        Model.findOne({ name: req.body.name }, function (err, doc) {
                if (err) {
                        return errOut (res, err);
                }
                if (doc.creator !== req.body.creator) {
                        return errOut (res, {
                                name: "PolicyError",
                                err:  "Creators do not match"
                        });
                }
                _.extend (doc, req.body);
                doc.save();
                return emit (req, res, 'updated', doc);
        });
}

function createUpdate(req, res, next) {
        _.extend(req.body, {creator: req.key});
        Model.create(req.body, function(err, model) {
	        if(err) {
                        if (err.code == 11000) { // duplicate key error;
                                console.log ('running update');
                                return update (req, res, next);
                        }
		        return errOut (res, err);
		}
                return emit (req, res, 'created', model);
	});
}

function create(req, res, next) {
        _.extend(req.body, {creator: req.key});
        Model.create(req.body, function(err, model) {
	        if(err) {
		        return errOut (res, err);
		}
                return emit (req, res, 'created', model);
	});
}

function read(req, res, next) {
        Model.find({}, function (err, model) {
                if(err) {
		        return errOut (res, err);
		}
                return res.send(200, model);
        });
};

function readById(req, res, next) {
        Model.findById(req.params.id, function (err, model) {
                if(err) {
		        return errOut (res, err);
		}
                return res.send(200, model);
        });
};

router.use(bodyparser.json());
router.route('/radio')
        .post(createUpdate)
        .put(createUpdate)
        .get(read)
;

router.route('/radio/create')
        .post(create)
        .put(create)
;

router.route('/radio/:id')
        .put(updateById)
        .post(updateById)
        .get(readById)
;

router.get('/', function (req, res, next) {
        res.send ('welcome to the API\n');
});

app.use('/:key', function (req, res, next) {
    req.key = req.params.key;
    next();
});

app.use('/:key', router);

app.use('/', function (req, res) {
        res.send(200, uuid());
});


module.exports = {router: app, ios: ios};
