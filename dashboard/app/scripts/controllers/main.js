'use strict';

/**
 * @ngdoc function
 * @name dashboardApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the dashboardApp
 */
angular.module('dashboardApp')
  // .controller('MainCtrl2', function ($scope, $interval) {
  //   $scope.callAtInterval = function() {
  //      console.log("$scope.callAtInterval - Interval occurred");
  //  }
  //
  //  $interval( function(){ $scope.callAtInterval(); }, 3000);
  // })
  .controller('MainCtrl', function ($scope) {
    $scope.jsonOutputs = [
      // "json_output/PN1-C1-NS-A2-L1_S1_L001_R1_001.trim.dedup.json",
      // "json_output/PN2-C1-NS-A4-L1_S2_L001_R1_001.trim.dedup.json",
      // "json_output/PN4-C1-NS-A1-L1_S3_L001_R1_001.trim.dedup.json",
      // "json_output/BSG01_S1_L001_R1_001.trimmed.1.trimmed.json",
      // "json_output/BSG03_S2_L001_R1_001.trimmed.1.trimmed.json",
      // "json_output/BSG09_S3_L001_R1_001.trimmed.1.trimmed.json",
      // "json_output/BSG13_S4_L001_R1_001.trimmed.1.trimmed.json",
      // "json_output/BSG16_S5_L001_R1_001.trimmed.1.trimmed.json"
      "json_output/data.json"
    ];
  });
