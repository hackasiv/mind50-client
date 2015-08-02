/**
 * Created by Abdusamad on 01.08.2015.
 */

var INTERVALS  = {
  SYNC_MESSAGES: 1000,
  SYNC_POSITION: 5000,
};

var app = angular.module('mind50App', [
    //'ngResource'
]);


var API_URL = 'http://api.crimeadev.com';


app.controller('AppController', function($scope, $rootScope, $http, $timeout) {

    $scope.sending = false;

    $rootScope.uid = false;
    $rootScope.total = 0;

    $scope.coords = {
        lat: 0,
        lon: 0
    };

    $scope.message = {
        text: '',
        lat: 0,
        lon: 0
    };

    $scope.messages = [];

    $scope.notify = function () {
        //navigator.notification.beep(2);
        var beep = new Media('sounds/beep.mp3',
            // success callback
            function () { console.log("playAudio():Audio Success"); },
            // error callback
            function (err) { console.log("playAudio():Audio Error: " + err); }
        );
        // Play audio
        beep.play();
    };


    $scope.submit = function() {

        if (!$rootScope.uid) {
            $scope.getUid(function(uid){
                run();
            });
        } else {
            run();
        }

        function run() {
            $scope.sending = true;

            var lat = $scope.coords.lat;
            var lon = $scope.coords.lon;

            $.post(API_URL + '/message/' + $rootScope.uid + '/' + lat + '/' + lon , {
                message: $scope.message.text,
                uid: $rootScope.uid,
                lat: lat,
                lon: lon
            }).success(function(resp) {
                console.log(resp, 'resp');
                //$scope.getMessages();
                $scope.$apply(function(){
                    $scope.message.text = '';
                    $scope.sending = false;
                });
            });
        }
    };

    
    $scope.getUid = function(fn) {
        if (!$rootScope.uid) {
            $scope.getPosition(function(coords){
                var lat = coords['lat'];
                var lon = coords['lon'];
                $scope.coords = coords;

                var options = {
                  title: "Введите ваше имя",
                  defaultText: "",
                  buttonLabels: ["OK"]
                };

                supersonic.ui.dialog.prompt("Введите ваше имя", options).then(function(result) {
                    $.get(API_URL + '/uid/' + lat + '/' + lon + '/' + result.input).success(function(resp) {
                        resp = JSON.parse(resp);
                        console.log(resp, 'uid');


                        $rootScope.$apply(function() {
                            $rootScope.uid = resp.uid;
                            $rootScope.total = resp.total;
                            $rootScope.name = result.input;
                            supersonic.ui.navigationBar.update({'title': "В чате: " + resp.total});
                            fn(resp.uid);
                        });


                    }).error(function(err) {
                        console.log(err, 'err uid');
                    });
                });

            });

        } else {
            fn($rootScope.uid);
        }
    };

    $scope.getMessages = function() {
        $scope.getUid(function(uid){
            console.log(uid, 'uid');
            var lat = $scope.coords.lat;
            var lon = $scope.coords.lon;

            $http.get(API_URL + '/message/' + $rootScope.uid + '/' + lat + '/' + lon).success(function(response) {
                console.log(response, 'messages');
                if (response.length) {
                    for(var i in response) {
                        $scope.messages.push(response[i]);
                    }
                    $timeout($scope.notify, 0); // play sound
                    $timeout(function(){
                        $('body').animate({ scrollTop: $(document).height() }, "slow");
                    }, 100);
                }

            });
            
        });
    };


    $scope.postPosition = function() {
        $scope.getUid(function(){
            $scope.getPosition(function(coords){
                $scope.coords = coords;
                var lat = coords['lat'];
                var lon = coords['lon'];
                console.log(coords, 'postPosition');
                $.post(API_URL + '/position', {uid: $rootScope.uid, lat: lat, lon: lon}).success(function(resp){
                    console.log(resp);
                    $scope.$apply(function() {
                        $rootScope.total = resp.total;    
                    });
                });
            })
        });
    };

    $scope.getPosition = function(callback) {
        var coords = {};
        navigator.geolocation.getCurrentPosition(function(position) {
            coords['lat'] = position.coords.latitude;
            coords['lon'] = position.coords.longitude;
            callback(coords);
        });
    };

    $scope.getUid(function() {

        console.log($rootScope.uid);

        //$scope.getMessages();

        $timeout(function syncMessagesTask(){
            $scope.getMessages();
            $timeout(syncMessagesTask, INTERVALS.SYNC_MESSAGES);
        }, INTERVALS.SYNC_MESSAGES);

        $timeout(function syncPositionTask() {
            $scope.postPosition();
            $timeout(syncPositionTask, INTERVALS.SYNC_POSITION);
        }, INTERVALS.SYNC_POSITION);
    });

});
