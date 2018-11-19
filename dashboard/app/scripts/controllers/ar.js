'use strict';

/**
 * @ngdoc function
 * @name dashboardApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the dashboardApp
 */
angular.module('dashboardApp')
  .controller('ArCtrl', ['$scope', '$http', function ($scope, $http) {
    var request = {
      method: 'get',
      url: 'json_output/ar.json',
      dataType: 'json',
      contentType: "application/json"
    };
    $http(request)
      .then(function successCallback(jsonData) {
        $scope.arData = jsonData;
      }, function errorCallback (res) {

      });
  }]);
