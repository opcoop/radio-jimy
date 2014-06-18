define(function(require, exports, module) {

	function toRadians(num) {
		return num * Math.PI / 180;
	}

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
	}

	module.exports = {
		Geo: Geo
	}

})