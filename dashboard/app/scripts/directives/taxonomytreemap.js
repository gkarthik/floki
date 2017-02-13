'use strict';

/**
 * @ngdoc directive
 * @name dashboardApp.directive:taxonomyTreeMap
 * @description
 * # taxonomyTreeMap
 */
angular.module('dashboardApp')
  .directive('taxonomyTreeMap', function ($window) {
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
	var base = 100;
	svg.attr("width", width);
	svg.attr("height", height);
	var treemap = d3.treemap()
	    .tile(d3.treemapResquarify)
	    .size([width-100, height-100])
	    .round(true)
	    .paddingInner(1);
	var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
	    color = d3.scaleOrdinal(d3.schemeCategory20.map(fader)),
	    format = d3.format(",d");
	
	d3.json(jsonFile, function(error, data){
	  getSignificantNodes(data);
	  var root = d3.hierarchy(data)
	      .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
	      .sort(function(a, b) { return b.depth - a.depth; });
	  treemap(root);
	  console.log(root);
	  var cell = svg.selectAll("g")
	      .data(root.leaves())
	      .enter().append("g")
	      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

	  cell.append("rect")
	    .attr("id", function(d) { return d.data.id; })
	    .attr("width", function(d) { return d.x1 - d.x0; })
	    .attr("height", function(d) { return d.y1 - d.y0; })
	    .attr("fill", function(d) { return color(d.parent.data.id); });
	  
	  // cell.append("clipPath")
	  //   .attr("id", function(d) { return "clip-" + d.data.id; })
	  //   .append("use")
	  //   .attr("xlink:href", function(d) { return "#" + d.data.id; });
	  
	  cell.append("text")
	    .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
	    .selectAll("tspan")
	    .data(function(d){
	      var a = d.data.name.split(/(?=[A-Z][^A-Z])/g);
	      a.push(d.data.pvalue);
	      a.push(d.data.reads);
	      return (d.value > 0) ? a: 0;
	    })
	    .enter().append("tspan")
	    .attr("x", 4)
	    .attr("y", function(d, i) { return 13 + i * 10; })
	    .text(function(d) { return d; });
	  
	  cell.append("title")
	    .text(function(d) { return d.data.name; });

	});	
	
	function getSignificantNodes(node){
	  var pvalue_threshold = 0.05,
	      reads_threshold = 10;	      
	  if(node.children.length == 0){
	    if(node.pvalue > pvalue_threshold || node.reads <= reads_threshold || node.percentage <= node.ctrl_percentage ){
	      return 0;
	    }
	    return 1;
	  }	  
	  var c = 0;
	  for(var t in node.children){
	    c += getSignificantNodes(node.children[t]);
	  }
	  node.significantChildren = c;
	  node.value = c+1;
	  if(c == 0){
	    node.children = [];
	  }
	  return c;
	}
      }
    };
  });
