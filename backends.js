var backboneio = require('backbone.io'),
    iobackends = require ('./iobackends');
;

module.exports = function () {
    var iob = new iobackends();

    var backends = {
        app: {
            use: [backboneio.middleware.memoryStore()]
        },
        radio: {
            use: [iob.middleware.mongooseStore(
                'mongodb://localhost/backboneio',
                {
                    name: String
                }
            )]
        },
        live: {
            use: [backboneio.middleware.memoryStore()]
        }
    };

    return iob.initialize(backends);
};
