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
	var jsonFile = attrs.jsonFile;
	var padding = 20;
	var d3 = $window.d3;
	var width = $window.innerWidth , height = $window.innerHeight;
	var rawSvg = element.find("svg")[0];
	var svg = d3.select(rawSvg);
	svg.attr("width", width);
	svg.attr("height", height);
	var g = svg.append("svg:g");
	g.attr("transform", "translate(50, 50)");
	var tree = d3.tree().size([height-100, width-100]);
	d3.json(jsonFile, function(error, data){
	  var root = d3.hierarchy(data);
	  var nodes = tree(root);
	  var link = g.selectAll(".link")
	      .data(root.descendants().slice(1))
	      .enter().append("path")
	      .attr("class", "link")
	      .attr("d", function(d) {
		// return "M" + d.y + "," + d.x
		//   + "C" + (d.parent.y + 100) + "," + d.x
		//   + " " + (d.parent.y + 100) + "," + d.parent.x
		//   + " " + d.parent.y + "," + d.parent.x;
	      });	  
	  var node = g.selectAll(".node")
	      .data(root.descendants())
	      .enter().append("g")
	      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
	      .attr("transform", function(d) {
		console.log(d);
		return "translate(" + d.y + "," + d.x + ")";
	      });

	  node.append("circle")
	    .attr("r", 2.5);

	  node.append("text")
	    .attr("dy", 3)
	    .attr("x", function(d) { return d.children ? -8 : 8; })
	    .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
	    .text(function(d) { 
              return d.data.name.substring(0,5);
	    });
	});
      }
    };
  });
