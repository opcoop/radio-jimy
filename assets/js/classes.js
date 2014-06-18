define(function(require, exports, module) {

	var Util = require('utils');

	function Server(geoFeature) {
		this.type = geoFeature.type;
		this.geometry = geoFeature.geometry;
		this.properties = geometry.properties;
	}

	Server.prototype.distanceTo = function(otherServer) {
		return Util.Geo.getDistance(this.geometry.coordinates, otherServer.geometry.coordinates);
	}

})