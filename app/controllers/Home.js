/**
 * Created by Abdusamad on 01.08.2015.
 */

var INTERVALS  = {
  SYNC_MESSAGES: 1000,
  SYNC_POSITION: 5000,
};

var app = angular.module('mind50App', []);


var API_URL = 'http://api.crimeadev.com';

$(document).ready(function() {
    moment.locale('ru');
});

app.filter('relative', function() {
   return function(input) {
     var now = moment().utcOffset(-4).format();
     now = now.replace(/(\+|\-)\d{2}\:\d{2}$/, ''); // удаляем часовой пояс
     return moment(input).startOf('minute').from(now);
   }
});

app.controller('AppController', function($scope, $rootScope) {});

app.controller('MessageSendController', function($scope, $rootScope) {

    $scope.sending = false;
    $scope.message = {
        text: ''
    };

    $scope.notify = function() {
      var sound_src = 'https://github.com/hackasiv/mind50-client/blob/master/www/sounds/sounds-900-you-know.mp3?raw=true';
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

        if (!$rootScope.uid || !$rootScope.coords || !$scope.message.text) {
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

    $scope.notify = function () {
        //navigator.notification.beep(2);
        var sound_src = 'https://github.com/hackasiv/mind50-client/blob/master/www/sounds/sounds-874-gets-in-the-way.mp3?raw=true';
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
                            //supersonic.ui.navigationBar.update({'title': "В чате: " + resp.total});
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
                if (response.length) {console.log(response);
                    for(var i in response) {
                        $scope.messages.push(response[i]);
                    }
                    if (!(response.length == 1 && response[0].uid == $rootScope.uid)) {
                        $timeout($scope.notify, 0); // уведомление только для чужих сообщений
                    }
                    $timeout(function(){
                        $('body').animate({ scrollTop: $(document).height() + 100 }, "slow");
                    }, 100);
                }

            });

        });
    };


    $scope.postPosition = function() {
        $scope.getUid(function(){
          checkLocation(function(enabled) {
            console.log(enabled, 'en');
            if (!enabled && !$scope.alert) {
              var options = {
                message: "Включите определение местоположения",
                buttonLabel: "Проверить"
              };
              $scope.alert = supersonic.ui.dialog.alert("Ошибка конфигурации", options).then(function() {
                $scope.alert = null;
                //$timeout(checkLocationLoop, 1000);
              });
            } else {
              $scope.getPosition(function(coords){
                  $rootScope.coords = coords;
                  var lat = coords['lat'];
                  var lon = coords['lon'];
                  $.post(API_URL + '/position', {uid: $rootScope.uid, lat: lat, lon: lon}).success(function(resp){
                      resp = JSON.parse(resp);
                      $rootScope.$apply(function() {
                          $rootScope.total = resp.total;
                          //supersonic.ui.navigationBar.update({'title': "В чате: " + resp.total});
                      });
                  });
              });
            }
          })

        });
    };

    $scope.getPosition = function(callback) {
        var coords = {};
        supersonic.device.geolocation.getPosition().then(function(position, err) {
          console.log(position, err);
            coords['lat'] = position.coords.latitude;
            coords['lon'] = position.coords.longitude;
            callback(coords);
        });
    };

    var checkLocation = function(cb) {
      console.log(cordova.plugins);
      if (cordova && cordova.plugins && cordova.plugins.diagnostic) {
        cordova.plugins.diagnostic.isLocationEnabled(function(enabled){
            cb(enabled);
        }, function(error){
            console.error("The following error occurred: "+error);
            cb(false);
        });
      } else {
        cb(true);
      }
    }

    var checkLocationLoop = function() {
      checkLocation(function(enabled) {
        if (!enabled) {
          var options = {
            message: "Включите определение местоположения",
            buttonLabel: "Проверить"
          };

          supersonic.ui.dialog.alert("Ошибка конфигурации", options).then(function() {
            $timeout(checkLocationLoop, 1000);
          });
        } else {
          $scope.refresh();
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
        }
      });
    }

    supersonic.device.ready.then(function() {
      console.log(cordova.plugins, 'cordova.plugins');
      checkLocationLoop();
    });


});
