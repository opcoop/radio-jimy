define (['vent', 'underscore', 'marionette'], function (Vent, _, Marionette) {
        var itemView = Marionette.ItemView.extend ({
                template: '#list-item-tpl',
                tagName: 'li class="radio"',
                ettl: function (){
                        return 'ul';
                },
                ui: {
                        hover: 'li'
                },
                events: {
                        'click li'    : 'selected',
                        'mouseover li': 'mouseover',
                        'mouseout  li': 'mouseout'
                },
                onShow: function () {
                        var self = this;
                        var hoverSel = this.ui.hover || self.$el;

                        var hoverOn =  function (model) {
                                hoverSel.addClass('hover');
                        };
                        var hoverOff=  function (model) {
                                hoverSel.removeClass('hover');
                        };
                        var selectOn =  function (model) {
                        };
                        var selectOff=  function (model) {
                        };

                        Vent.on ('hover:'     + this.model.id, hoverOn);
                        Vent.on ('hover:out:' + this.model.id, hoverOff);
                        Vent.on ('select:'    + this.model.id, selectOn);
                        Vent.on ('select:out:'+ this.model.id, selectOff);
                },
                selected: function () {
                        Vent.trigger('radio:selected', this.model);
                        Vent.trigger('select:' + this.model.id, this.model);
                },
                mouseover: function () {
                        Vent.trigger('hover:' + this.model.id, this.model);
                },
                mouseout: function () {
                        Vent.trigger('hover:out:' + this.model.id, this.model);
                }
        });

        var listView = Marionette.CollectionView.extend ({
                tagName: 'ul class="list"',
                itemView: itemView,
                onShow: function () {

                },
                appendHtml: function (collectionView, itemView, index) {
                        var prov = itemView.model.get('prov').replace(/ /g, '-') || 'unknown';
                        var el = '#' + prov;
                        var $el = collectionView.$(el);
                        if (! $el.length) {
                                collectionView.$el.append('<li id="' + prov + '-li"class="prov-li"><ul id="' + prov + '" class="list">');
                                $el = collectionView.$(el);
                                $el.append('<h1>' + prov + '</h1>');
                        }
                        $el.append(itemView.el);
                }
        });

        return listView;
});
