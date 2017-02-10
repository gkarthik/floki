'use strict';

/**
 * @ngdoc directive
 * @name dashboardApp.directive:taxonomyTree
 * @description
 * # taxonomyTree
 */
angular.module('dashboardApp')
  .directive('taxonomyTree', function ($window) {
    return {
      template: '<svg></svg>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
	var data = scope[attrs.chartData];
	var padding = 20;
	var d3 = $window.d3;
	var rawSvg = element.find("svg")[0];
	var svg = d3.select(rawSvg);

	
	
      }
    };
  });
