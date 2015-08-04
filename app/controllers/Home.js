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

$(document).ready(function() {
    //document.ontouchmove = function(e){
    //    e.preventDefault();
    //};
    //$('.page-wrap').height($('body').height());
});

app.controller('AppController', function($scope) {

});

app.controller('MessageSendController', function($scope, $rootScope) {

    $scope.sending = false;
    $scope.message = {
        text: ''
    };

    $scope.notify = function() {
      var sound_src = $rootScope.path + 'sounds/sounds-900-you-know.mp3';
      //navigator.notification.beep(2);
      var beep = new Media(sound_src,
          // success callback
          function () { console.log("playAudio():Audio Success"); },
          // error callback
          function (err) { console.log("playAudio():Audio Error: " + err); }
      );
      // Play audio
      beep.play();
    }

    $scope.submit = function() {

        if (!$rootScope.uid || !$rootScope.coords) {
            return;
        }
        $scope.notify();
        $scope.sending = true;

        var lat = $rootScope.coords.lat;
        var lon = $rootScope.coords.lon;

        $.post(API_URL + '/message/' + $rootScope.uid + '/' + lat + '/' + lon , {
            message: $scope.message.text,
            uid: $rootScope.uid,
            lat: lat,
            lon: lon
        }).success(function(resp) {
            //$scope.getMessages();
            $scope.$apply(function(){
                $scope.message.text = '';
                $scope.sending = false;
            });
        });
    };

});


app.controller('MessageListController', function($scope, $rootScope, $http, $timeout) {

    $rootScope.uid = false;
    $rootScope.total = 0;
    $rootScope.coords = {
        lat: 0,
        lon: 0
    };

    $scope.messages = [];

    var getPath = function () {
        if ($rootScope.platform) {
          var path = 'http://localhost/';
          if ($rootScope.platform.name != 'iOS') {
            return '/android_asset/www/';
          }
          $rootScope.path = path;
        } else {
          supersonic.device.platform().then( function(platform) {
              $rootScope.platform = platform;
              getPath();
          });
        }
    }

    $scope.notify = function () {
        //navigator.notification.beep(2);
        var sound_src = $rootScope.path + 'sounds/sounds-874-gets-in-the-way.wav';
        var beep = new Media(sound_src,
            // success callback
            function () { console.log("playAudio():Audio Success"); },
            // error callback
            function (err) { console.log("playAudio():Audio Error: " + err); }
        );
        // Play audio
        beep.play();
    };

    $scope.refresh = function() {
        $timeout(function() {
            //var h = $('body').height();
            //$('.container').height(h);
            //$('.container .messages-wrap').height(h-160);
        }, 300);
    };

    $scope.getUid = function(fn) {
        if (!$rootScope.uid) {
            $scope.getPosition(function(coords){
                var lat = coords['lat'];
                var lon = coords['lon'];
                $rootScope.coords = coords;

                var options = {
                  title: "Введите ваше имя",
                  defaultText: "",
                  buttonLabels: ["OK"]
                };

                supersonic.ui.dialog.prompt("Введите ваше имя", options).then(function(result) {
                    $.get(API_URL + '/uid/' + lat + '/' + lon + '/' + result.input).success(function(resp) {
                        resp = JSON.parse(resp);

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
            var lat = $rootScope.coords.lat;
            var lon = $rootScope.coords.lon;

            $http.get(API_URL + '/message/' + $rootScope.uid + '/' + lat + '/' + lon).success(function(response) {
                if (response.length) {
                    for(var i in response) {
                        $scope.messages.push(response[i]);
                    }
                    $timeout($scope.notify, 0); // play sound
                    $timeout(function(){
                        $('body').animate({ scrollTop: $(document).height() + 100 }, "slow");
                    }, 100);
                }

            });

        });
    };


    $scope.postPosition = function() {
        $scope.getUid(function(){
            $scope.getPosition(function(coords){
                $rootScope.coords = coords;
                var lat = coords['lat'];
                var lon = coords['lon'];
                $.post(API_URL + '/position', {uid: $rootScope.uid, lat: lat, lon: lon}).success(function(resp){
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

    $scope.refresh();
    getPath();
    $scope.getUid(function() {
        //$scope.getMessages();
        $timeout(function syncMessagesTask(){
            $scope.getMessages();
            $scope.refresh();
            $timeout(syncMessagesTask, INTERVALS.SYNC_MESSAGES);
        }, INTERVALS.SYNC_MESSAGES);

        $timeout(function syncPositionTask() {
            $scope.postPosition();
            $timeout(syncPositionTask, INTERVALS.SYNC_POSITION);
        }, INTERVALS.SYNC_POSITION);
    });

});
