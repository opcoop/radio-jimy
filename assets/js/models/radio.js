define([
    'jquery',
    'backbone',
    'models/mbc',
], function( $, Backbone, MBC ) {
    var model = MBC.Model.extend({
        backend: 'radiobackend',
        urlRoot: 'radio',
        defaults: {
            cover: 'null'
        }
    });

    var collection = MBC.Collection.extend({
        model: model,
        backend: 'radiobackend',
        urlRoot: 'radio'
    });

    return {
        Model: model,
        Collection: collection
    };
});
