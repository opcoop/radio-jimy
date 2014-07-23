define (['vent', 'underscore', 'marionette'], function (Vent, _, Marionette) {
        var itemView = Marionette.ItemView.extend ({
                template: '#list-item-tpl',
                events: {
                        'click li': 'selected'
                },
                selected: function () {
                        Vent.trigger('radio:selected', this.model);
                }
        });

        var listView = Marionette.CollectionView.extend ({
                itemView: itemView
        });

        return listView;
});
