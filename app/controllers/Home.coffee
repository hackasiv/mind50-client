'use strict'

angular.module('mind50App')
  .controller 'HomeCtrl', ($scope, $timeout) ->
    # Bind controller data
    do ->
      $scope.text_field_with_stacked_label1 = {}

      $scope.text_field_with_stacked_label1.value = '' # default value


    # Attach listeners


    # Initialize controller
    do ->
      steroids.view.navigationBar.show ' '
