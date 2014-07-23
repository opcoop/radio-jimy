var express	= require('express'),
    bodyparser	= require('body-parser'),
    _		= require('underscore'),
    /* utilities */
    backboneio	= require('backbone.io'),
    iobackends	= require ('./iobackends'),
    mongoose	= require('mongoose'),
    uuid        = require('uuid-v4')
;

var iob = new iobackends();

var db = mongoose.createConnection('mongodb://localhost/backboneio');
var Schema = new mongoose.Schema({
        name: { type: String, required: true, unique: true},
        desc: { type: String, required: true},
        creator: {type: String, required: true},
        position: {
                lng: {type: Number, required: true, min: -100, max: 100},
                lat: {type: Number, required: true, min: -100, max: 100}
        },
        stream: String,
        img: String
});
var Model = db.model('Radio', Schema);
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
        var backend = req.url.split('/')[1] + 'backend';
        ios[backend].emit(type, model);
        var resp = {};
        resp[type] = model;
        return res.send(200, resp);
}

function errOut (res, err) {
        console.log(err);
	return res.send(400, err);

}

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
        /*
        Model.update({creator: req.key}, req.body, function(err) {
                if (err) {

 		}
                return emit (req, res, 'updated');
        });
         */
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



router.use(bodyparser.json());
router.route('/radio')
        .post(createUpdate)
        .put(createUpdate)
;

router.route('/radio/create')
        .post(create)
        .put(create)
;

router.get('/radio/:id', function (req, res, next) {
        next(new Error('not implemented'));
});

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
