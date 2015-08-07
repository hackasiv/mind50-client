/**
 * Created by Abdusamad on 01.08.2015.
 */

var INTERVALS  = {
  SYNC_MESSAGES: 1000,
  SYNC_POSITION: 5000,
};

var app = angular.module('mind50App');


var API_URL = 'http://api.crimeadev.com';

$(document).ready(function() {
    moment.locale('ru');
});

// supersonic.device.ready.then(function() {
//   navigator.geolocation.watchPosition(
//     function(position){
//       console.log(position, 'pos');
//     }, 
//     function(err){
//       console.log(err, 'err');
//     }, 
//     { 
//       enableHighAccuracy: true 
//     }
//   );
// }); // Refat A. proposal about GPS state checking

app.filter('relative', function() {
   return function(input) {
     return moment(input).startOf('minute').fromNow();
   }
});

app.controller('AppController', function($scope, $rootScope, User) {

  $rootScope.user = null;
  $rootScope.nick = null;


  var options = {
    title: "Введите ваше имя",
    defaultText: "",
    buttonLabels: ["OK"]
  };

  supersonic.ui.dialog.prompt("Введите ваше имя", options).then(function(result) {
      $rootScope.$apply(function(){
        $rootScope.nick = result.input;
      });
  });

  $rootScope.notifySend = function() {
      var sound_src = 'https://github.com/hackasiv/mind50-client/blob/master/www/sounds/sounds-900-you-know.mp3?raw=true';
      var beep = new Media(sound_src);
      beep.play();
  };

  $rootScope.notifyReceive = function () {
      var sound_src = 'https://github.com/hackasiv/mind50-client/blob/master/www/sounds/sounds-874-gets-in-the-way.mp3?raw=true';
      var beep = new Media(sound_src);
      beep.play();
  };

  $rootScope.getPosition = function(callback) {
      var coords = {};
      supersonic.device.geolocation.getPosition().then(function(position, err) {
          coords['lat'] = position.coords.latitude;
          coords['lon'] = position.coords.longitude;
          callback(coords);
      });
  };
});

app.controller('MessageSendController', function($scope, $rootScope, User) {

    $scope.sending = false;
    $scope.message = {
        text: ''
    };

    $scope.submit = function() {
        if (!$scope.message.text) {
            return;
        }
        $rootScope.notifySend();
        $scope.sending = true;
        User.post($scope.message.text);
        $scope.sending = false;
        $scope.message.text = '';
    };

});

app.controller('MessageListController', function($scope, $rootScope, $http, $timeout, $interval, User) {

    $rootScope.total = 0; // кол-во участников чата

    $scope.messages = []; // сообщеньки чата

    supersonic.device.ready.then(function() {
      $rootScope.getPosition(function(coords) {       
        User.listen(function(message) {
            if (message.action == 'post') {
              // subscribe on new messages
              $scope.messages.push(message.data);
              $rootScope.total = message.nearest_users;
              $timeout(function(){
                  $rootScope.notifyReceive();
                  $('body').animate({ scrollTop: $(document).height() + 100 }, "slow");
              }, 100);
            } else if (message.action == 'signin') {
              $rootScope.user = message.data;
              $rootScope.total = message.nearest_users;
              window.user = $rootScope.user;
            } else if (message.action == 'update_geo') {
              $rootScope.total = message.nearest_users;
            }
        });

        $rootScope.$watch('nick', function(newValue, oldValue, scope) {
          if (newValue === null) return;
          User.signin(coords.lat, coords.lon, newValue); 
          $interval(function() {
            $rootScope.getPosition(function(coords) {  
              User.update_geo(coords);
            });
          }, 1000 * 60); // Update user position every minute
 
        }, true);        
      });
    });


});
