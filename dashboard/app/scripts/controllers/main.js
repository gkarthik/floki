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
      "json_output/PN1-C1-NS-A2-L1_S1_L001_R1_001.trim.dedup.json",
      "json_output/PN2-C1-NS-A4-L1_S2_L001_R1_001.trim.dedup.json",
      "json_output/PN4-C1-NS-A1-L1_S3_L001_R1_001.trim.dedup.json"
    ];
    $scope.jsonOutputs = [
      "json_output/PS5_C1_BNm_A1_L_S3_L001_R1_001.trim.dedup.json",
      "json_output/PS5_C1_BNt_A1_L_S4_L001_R1_001.trim.dedup.json",
      "json_output/PS5_C1_SR_A1_L_S1_L001_R1_001.trim.dedup.json",
      "json_output/PS5_C1_SR_A4_L_S2_L001_R1_001.trim.dedup.json",
    ];
  });
