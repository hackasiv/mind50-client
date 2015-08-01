/**
 * Created by Abdusamad on 01.08.2015.
 */
var app = angular.module('mind50App', [
    //'ngResource'
]);


var API_URL = 'http://api.crimeadev.com';


app.controller('AppController', function($scope, $rootScope, $http, $timeout) {

    $scope.message = {
        text: '',
        lat: 0,
        lon: 0
    };

    $scope.messages = [];

    $scope.submit = function() {



        if (!$rootScope.uid) {

            $scope.getUid(function(uid){
                run();
            });
        } else {
            run();
        }

        function run() {
            $scope.getPosition(function(cords){

                console.log($rootScope.uid);

                var lat = cords['lat'];
                var lon = cords['lon'];
                var name = $scope.message.user;
                $.post(API_URL + '/message/' + $rootScope.uid + '/' + lat + '/' + lon + '/' + name , {
                    message: $scope.message.text,
                    uid: $rootScope.uid,
                    lat: lat,
                    lon: lon
                }).success(function(resp) {
                    console.log(resp);
                });

            });

        }
    };


    $timeout(function task(){
        $scope.getMessages();
        $scope.postPosition();
        $timeout(task, 5000);
    }, 5000);

    $scope.getUid = function(fn) {

        if (!$rootScope.uid) {
            $scope.getPosition(function(cords){
                var lat = cords['lat'];
                var lon = cords['lon'];
                console.log(API_URL + '/uid/' + lat + '/' + lon);
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
            $scope.getPosition(function(cords){
                var lat = cords['lat'];
                var lon = cords['lon'];

                $http.get(API_URL + '/message/' + $rootScope.uid + '/' + lat + '/' + lon).success(function(response) {
                    for(var i in response) {
                        console.log(response[i]);
                        $scope.messages.push(response[i]);    
                    }
                });    
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
        var cords = {};
        navigator.geolocation.getCurrentPosition(function(position) {
            cords['lat'] = position.coords.latitude;
            cords['lon'] = position.coords.longitude;
            callback(cords);
        });

    };

});
