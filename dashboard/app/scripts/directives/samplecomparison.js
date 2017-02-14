'use strict';

/**
 * @ngdoc directive
 * @name dashboardApp.directive:sampleComparison
 * @description
 * # sampleComparison
 */
angular.module('dashboardApp')
  .directive('sampleComparison', function () {
    return {
      templateUrl: 'templates/samplecomparison.html',
      restrict: 'E',
      scope: {
	jsonFiles: "="
      },
      link: function postLink(scope, element, attrs) {
	console.log(scope.jsonFiles);
	scope.sortType     = 'name'; // set the default sort type
	scope.sortReverse  = false;  // set the default sort order
	scope.searchFish   = '';     // set the default search/filter ter
	
      }
    };
  });
