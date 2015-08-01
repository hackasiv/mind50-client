/**
 * Created by Abdusamad on 01.08.2015.
 */
var app = angular.module('mind50App', [
    //'ngResource'
]);


var API_URL = 'http://192.168.2.199/web';


app.controller('AppController', function($scope, $rootScope, $http, $timeout) {

    $scope.message = {
        text: '',
        lat: 0,
        lon: 0
    };

    $scope.messages = [];

    $scope.submit = function() {

        var lat = 0;
        var lon = 0;

        if (!$rootScope.uid) {
            $scope.getUid(function(uid){
                run();
            });
        } else {
            run();
        }

        function run() {
            $scope.getPosition(function(cords){
                var lat = cords['lat'];
                var lon = cords['lon'];

                var name = $scope.message.user;
                $http.post(API_URL + '/message/' + $rootScope.uid + '/' + lat + '/' + lon + '/' + name , $scope.message).success(function(resp) {

                });

            });

        }
    };


    $timeout(function(){

        $scope.getMessages();
        $scope.postPosition();

    }, 5000);

    $scope.getUid = function(fn) {

        if (!$rootScope.uid) {

            $scope.getPosition(function(cords){
                var lat = cords['lat'];
                var lon = cords['lon'];

                $http.get(API_URL + '/uid/' + lat + '/' + lon).success(function(resp) {
                    $rootScope.uid = resp.uid;
                    $rootScope.total = resp.total;
                    fn(resp.uid);//$rootScope.uid = resp.uid;
                });

            });

        } else {
            fn($rootScope.uid);
        }

    };

    $scope.getMessages = function() {
        $scope.getUid(function(){
            $http.get(API_URL + '/message/' + $rootScope.uid).success(function(response) {
                $scope.messages = response.messages;
            });
        });
    };


    $scope.postPosition = function() {

        $scope.getPosition(function(cords){
            var lat = cords['lat'];
            var lon = cords['lon'];
            $scope.getUid(function(){
                $http.post(API_URL + '/position', {uid: $rootScope.uid, lat: lat, lon: lon}).success(function(resp){

                });
            });
        });

    };

    $scope.getPosition = function(callback) {

        supersonic.device.geolocation.getPosition().then( function(position) {
            cords['lat'] = position.coords.latitude;
            cords['lon'] = position.coords.longitude;
            callback(cords);
        });
    };

});
