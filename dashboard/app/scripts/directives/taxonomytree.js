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
      templateUrl: 'templates/taxonomytree.html',
      restrict: 'E',
      scope: {
	jsonFile: "@"
      },
      link: function postLink(scope, element, attrs) {
	scope.pvalueThreshold = 0.05,
	scope.readsThreshold = 10;
	scope.ratioThreshold = 1;
	scope.taxFilter = "genus";
	scope.fdrFilter = true;
	var ranks = ["superkingdom", "species", "genus"];
  var root;
	var jsonFile = scope.jsonFile;
	var padding = 20;
	var d3 = $window.d3;
	var width = $window.innerWidth, height = $window.innerHeight+500;
	var rawSvg = element.find("svg")[0];
	var svg = d3.select(rawSvg);
	d3.select(element.find("h3")[0]).html(jsonFile.split("/")[1].replace(".json", ""));
	var base = 100;
	svg.attr("width", width);
	svg.attr("height", height);
	var g = svg.append("svg:g");
	var tree = d3.tree()
  .size([height-150, width-200]);
	var colorScale = d3.scaleSequential(d3.interpolateRdYlBu);

  scope.runTree = function(){
d3.json(scope.jsonFile, function(error, data){

	scope.updateFilters = function(){
      root.children.forEach(collapseLevel);
      update(root);
	}

	var connector = function(d){
	  	    return "M" + d.y + "," + d.x
	      + "C" + (d.parent.y-10) + "," + d.x
	      + " " + (d.parent.y) + "," + d.parent.x
	      + " " + d.parent.y + "," + d.parent.x;
	};

	function update(source){
	  var nodes = tree(root);
	  var duration = 150;
	  var link = g.selectAll(".link")
	      .data(root.descendants().slice(1));
	  var linkEnter = link.enter().append("path")
	      .attr("class", "link")
	      .attr("d", connector);
	  link.merge(linkEnter).transition()
            .duration(duration)
            .attr('d', connector);
	  link.exit().transition()
	    .duration(duration)
	    .attr("transform", function(d) { return "translate(" + d.parent.y + "," + d.parent.x + ")"; })
	    .remove();
	  var node = g.selectAll(".node").data(nodes.descendants());
	  var nodeEnter = node.enter().append("g")
	      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
	      .attr("transform", function(d) {
		return "translate(" + d.y + "," + d.x + ")";
	      });
	  nodeEnter.append("circle")
      .on("click", click)
    .attr("r", 5)
	    .style("fill", colorFill);
	  nodeEnter.append("text")
	    .attr("dy", 3)
	    .attr("x", function(d) { return d.children ? -8 : 8; })
	    .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
	    .text(function(d) {
          if(d.data.rank=="superkingdom"){
      return d.data.name;
          }
          return d.children ? "" : d.data.name;
	    });

	  nodeEnter.on("mouseover", function(d, i){
	    var t = g.append("svg:g")
		.attr("class","tool-tip")
	    	.attr("transform", "translate("+parseInt(d.y)+","+parseInt(d.x+10)+")");
	    t.append("rect")
	      .attr("height", 170)
	      .attr("width", 350)
	      .attr("stroke", "#000")
	      .attr("fill", "#FFF");
	    t.append("text")
	      .attr("transform", "translate(2,12)")
	      .selectAll("tspan")
	      .data(function(){
		var a = [d.data.name];
		a.push("Tax ID: "+d.data.taxid);
		a.push("Pass FDR Test: "+d.data.pass_fdr_test);
		a.push("Corrected P-value: "+d.data.pvalue.toExponential());
		a.push("Uncorrected P-value: "+d.data.uncorrected_pvalue.toExponential());
		a.push("Reads: "+d.data.reads);
		a.push("Control Reads: "+d.data.ctrl_reads);
		a.push("Sample %: "+Math.round(d.data.percentage*1000000)/10000);
		a.push("Ctrl %: "+Math.round(d.data.ctrl_percentage*1000000)/10000);
		a.push(d.data.rank);
		return a;
	      })
	      .enter().append("tspan")
	      .attr("x", 4)
	      .attr("y", function(d, i) { return 13 + i * 15; })
	      .text(function(d) { return d; });
	  });
	  nodeEnter.on("mouseout", function(d, i){
	    g.select(".tool-tip").remove();
	  });

	  var nodeUpdate = node.merge(nodeEnter).transition()
	      .duration(duration)
	      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
	      .style("opacity", 1);

	  nodeUpdate.select("circle").attr("r", function(d){
	      return Math.log(d.data.reads);
	    })
	    .style("fill", colorFill);
	  nodeUpdate.select("text").style("text-anchor", function(d) { return d.children ? "end" : "start"; }).attr("dy", 3)
	    .attr("x", function(d) { return d.children ? -8 : 8; })
	    .text(function(d) {
        if(d.data.rank=="superkingdom"){
   return d.data.name;
       }
       return d.children ? "" : d.data.name;
     });

	  node.exit().transition()
	    .duration(duration)
	    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
	    .style("opacity", 1e-6)
	    .remove();

	  nodes.eachBefore(function (d) {
	    d.x0 = d.x;
	    d.y0 = d.y;
	  });
	}
	function colorFill(d){
	      return colorScale(d.data.percentage);
	}
	function runThreholdFilters(node){
	  if(scope.fdrFilter){
	    if(!node.pass_fdr_test || node.reads <= scope.readsThreshold || node.percentage <= node.ctrl_percentage * scope.ratioThreshold){
	      return 0;
	    }
	  } else {
	    if(node.uncorrected_pvalue > scope.pvalueThreshold || node.reads <= scope.readsThreshold || node.percentage <= node.ctrl_percentage * scope.ratioThreshold){
	      return 0;
	    }
	  }
	  return 1;
	}

	function getSignificantNodes(node){
	  if(node.children.length == 0){
	    return runThreholdFilters(node);
	  }
	  var c = 0;
	  var _c = 0;
    for(var t=0;t<node.children.length;t++){
	    _c = getSignificantNodes(node.children[t]);
	    c += _c;
	    if(_c == 0){
	      node.children.splice(t, 1);
	      t--;
	    }
	  }
	  node.significantChildren = c;
	  node.value = c+1;
	  return c;
	}

  function click(d){
    console.log(scope.ratioThreshold);
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
    }
  function collapseLevel(d) {
      if (d._children){
        d.children = d._children;
        d._children = null;
      }
      if (d.children && d.data.rank == scope.taxFilter) {
          d._children = d.children;
          d._children.forEach(collapseLevel);
          d.children = null;
      } else if (d.children) {
          d.children.forEach(collapseLevel);
      }
  }
  function collapseAll(d) {
      if (d.children) {
          d.children.each(click);
      } else if (d._children) {
          d.children.forEach(collapseAll);
      }
  }
  getSignificantNodes(data);
  root = d3.hierarchy(data);
  root.children.forEach(collapseLevel);
  update(root);
});
}
scope.runTree();
      }
    };
  });
