define (['vent', 'underscore', 'backbone', 'marionette'],
        function (Vent, _, Backbone, Marionette) {

        var childView = Marionette.ItemView.extend({
                template: '#list-item-tpl'
        });

        var BackView  = Marionette.CollectionView.extend ({
                itemView: childView
        });

        var PlayerView = Marionette.ItemView.extend ({
                template: '#player-front-tpl',
                onShow: function () {
                        var self = this;
                        this.colview = new BackView({
                                collection: this.collection,
                                el: '#other-radios'
                        });
                        Vent.on('radio:selected', function (model) {
                                self.model = model;
                                self.render();
                        })
                }
        });

        return PlayerView;
});
