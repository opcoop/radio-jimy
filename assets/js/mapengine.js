define(function(require, exports, module) {
    var gapi = require('gapi'),
        request = require('superagent');

    function Maps(mapId) {
        this.id = mapId;
        this.accessToken = null;
    }

    Maps.prototype.authenticate = function(clientId, callback) {
        gapi.auth.authorize({
            client_id: clientId,
            scope: ['https://www.googleapis.com/auth/mapsengine.readonly'/*, 'https://www.googleapis.com/auth/userinfo.profile'*/],
            immediate: false
        }, function(authResult) {
            if(authResult && !authResult.error)
            {
                this.accessToken = authResult.access_token;
                callback(true);
            } else {
                callback(false);
            }
        });
    }

    module.exports = Maps;
})