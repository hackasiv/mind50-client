angular.module('mind50AppServices', ['ngWebSocket'])
	.factory('User', ['$websocket', 'WS_API_URL', function($websocket, WS_API_URL) {
		var dataStream = $websocket(WS_API_URL);
		var listened = false;
		var methods = {
			signin: function(lat, lon, nick) {
				console.log([lat, lon, nick]);
				if (!listened) console.error("You must to call User.listen before");
				dataStream.send(JSON.stringify({"action": "signin", "lat": lat, "lon": lon, nick: nick}));
			},
			listen: function(cb) {
				listened = true;
				dataStream.onMessage(function(message) {
					try {
						var msg = JSON.parse(message.data);	
						cb(msg);
					} catch (ex) {
						console.log(ex);
						cb(ex);
					}	        		
        		});
			},
			post: function(message) {
				if (!listened) throw "You must to call User.listen before";
				dataStream.send(JSON.stringify({"action": "post", "message": message}));
			},
			update_geo: function(lat, lon) {
				if (!listened) throw "You must to call User.listen before";
				dataStream.send(JSON.stringify({"action": "update_geo", "data": {
					"geo": {
						"lat": lat,
						"lon": lon
					}
				}}));
			}
		};

		return methods;
	}])
;	