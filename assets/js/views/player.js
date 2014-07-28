define (['vent', 'underscore', 'jquery', 'backbone', 'marionette'],
        function (Vent, _, $, Backbone, Marionette) {

        function pick_one (a) {
                return a[Math.floor(Math.random() * a.length)];
        }
        var FLICKR_URL = "http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?";

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
                        });
                },
                onRender: function () {
                        var cover = this.model.get('cover');
                        if (!cover || _.where(["", "null", "undefined"], cover)) {
                                $.getJSON(FLICKR_URL, {
                                        tags: this.model.get('city') + ',argentina',
                                        tagmode: "all",
                                        format: "json"
                                }, function (data) {
                                        var p = pick_one(data.items);
                                        $('.radio-cover').attr('src', p.media.m); 
                                });
                        }


                }
        });

        return PlayerView;
});
