define([
    'jquery',
    'backbone',
    'marionette',
], function( $, Backbone, Marionette ) {
    var model = Backbone.Model.extend({
        idAttribute: '_id',
        initialize: function () {
            this.bindBackend();
            console.log ('creating new', this.urlRoot, 'model');

            return Backbone.Model.prototype.initialize.call (this);
        }
    });

    var collection = Backbone.Collection.extend({
        initialize: function () {
            this.bindBackend();
            console.log ('creating new', this.urlRoot, 'collection');

            Backbone.Collection.prototype.initialize.call (this);
        }
    });

    return {
        Model: model,
        Collection: collection
    };
});
