define(function(require, exports, module) {
	function toRadians(num) {
		return num * Math.PI / 180;
	}

        function pick_one (a) {
                return a[Math.floor(Math.random() * a.length)];
        }

        var mapuche = ['lorem', 'ipsum', 'dolet', 'sarassa'];
        var Radio = {
                life: function (all, cb) {
                        var up = [];
                        var live = [];
                        var avail = [];

                        function random_extract (a, p) {
                                return a.filter(function (a) {if (Math.random() < p)return true;})
                        };

                        function update_avail () {
                                avail = all.filter (function (d) {return up.indexOf(d) < 0});
                        }

                        function update_up () {
                                if (up.length < all.length/2)
                                        return up = random_extract (all, 0.5);


                                //        console.log (up.map (function (d) {return d.properties.name;}));

                                var add = (Math.random() < 0.2);
                                var rm  = (Math.random() < 0.2);

                                if (rm) {
                                        var v = pick_one(up);

                                        up = up.filter (function (d) { return d !== v});

                                        console.log ('will remove', v.properties.name);
                                }

                                if (add) {
                                        update_avail();
                                        var v = pick_one(avail);
                                        up.push (v);

                                        console.log ('will add', v.properties.name);
                                }
                                return up;
                        };

                        function update_live () {
                                live = random_extract (up, 0.5);

                        };

                        function life () {
                                update_up();
                                if (Math.random() < 0.2)
                                        update_live();
                                cb (up.map (function (d) {
                                        if (live.indexOf(d) > 0) {
                                                d.live =true;
                                        } else {
                                                d.live =false;
                                        }
                                        return d;
                                }));
                        };

                        window.setInterval (life, 1000);
                },

                mapu_talk:function (m, M) {
                        var name = [];
                        var len = m + Math.floor(Math.random()*M);
                        while (len--) {
                                name.push(pick_one(mapuche));
                        }

                        return name.join(' ');
                }
        };


	var Geo = {
		getDistance: function(source, target) {
			var R = 6371; // km
			var dLat = toRadians(target[0])-toRadians(source[0]);
			var dLon = toRadians(target[1])-toRadians(source[1]);
			var lat1 = toRadians(source[0]);
			var lat2 = toRadians(target[0]);

			var a = (Math.sin(dLat/2) * Math.sin(dLat/2)) +
			        (Math.sin(dLon/2) * Math.sin(dLon/2)) * Math.cos(lat1) * Math.cos(lat2); 
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
			var d = R * c;

			return d;
		},
		inBounds: function(bounds, point) {
			/* [​ 
				[	left, bottom	], 
				[	right, top		]​
			   ]
						top
						 |
						 |
        				left ----|---- right
						 |
						 |
	         			       bottom
			*/
			return  point[0] /*x*/ >= bounds[0][0] /*left	*/ && 
					point[1] /*y*/ >= bounds[0][1] /*top	*/ && 
					point[0] /*x*/ <= bounds[1][0] /*right	*/ && 
					point[1] /*y*/ <= bounds[1][1] /*bottom	*/;
		}
	};

	module.exports = {
		Geo: Geo,
                Radio: Radio,
                pick_one: pick_one
	};

});
