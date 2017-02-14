'use strict';

/**
 * @ngdoc function
 * @name dashboardApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the dashboardApp
 */
angular.module('dashboardApp')
  .controller('AboutCtrl', function ($scope, $window) {
    $scope.jsonOutputs = [
      "json_output/PS5_C1_BNm_A1_L_S3_L001_R1_001.trim.dedup.json",
      "json_output/PS5_C1_BNt_A1_L_S4_L001_R1_001.trim.dedup.json",
      "json_output/PS5_C1_SR_A1_L_S1_L001_R1_001.trim.dedup.json",
      "json_output/PS5_C1_SR_A4_L_S2_L001_R1_001.trim.dedup.json",
    ];
    $scope.jsonData = {};
    var d3 = $window.d3;
    d3.json("json_output/complete_json.json", function(err, res){
      console.log(res);
      $scope.jsonData = res;
    });
    
    
  });
