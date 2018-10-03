'use strict';

/**
 * @ngdoc function
 * @name dashboardApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the dashboardApp
 */
angular.module('dashboardApp')
  .controller('PathogenicCtrl', function ($scope, $window) {
    $scope.jsonOutputs = [
      "json_output/centrifuge_2018.09.21.json"
    ];

  });
