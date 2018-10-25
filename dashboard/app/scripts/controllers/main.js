'use strict';

/**
 * @ngdoc function
 * @name dashboardApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the dashboardApp
 */
angular.module('dashboardApp')
  .controller('MainCtrl', function ($scope) {
    $scope.jsonOutputs = [
      "json_output/2018.10.25.1540495990.json"
    ];
  });
