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
	scope.taxFilter = "nofilter";
	scope.fdrFilter = true;
	var ranks = ["superkingdom", "species", "genus"];
	var jsonFile = scope.jsonFile;
	var padding = 20;
	var d3 = $window.d3;
	var width = $window.innerWidth , height = $window.innerHeight+500;
	var rawSvg = element.find("svg")[0];
	var svg = d3.select(rawSvg);
	d3.select(element.find("h3")[0]).html(jsonFile.split("/")[1].replace(".json", ""));
	var base = 100;
	svg.attr("width", width);
	svg.attr("height", height);
	var g = svg.append("svg:g");
	g.attr("transform", "translate(50, 50)");
	var tree = d3.tree().size([height-150, width-500]);
	var colorScale = d3.scaleSequential(d3.interpolateRdYlBu);

	function getAllAttributeValues(){
	  
	}
	
	scope.updateFilters = function(){
	  d3.json(scope.jsonFile, function(error, data){
	    getSignificantNodes(data);
	    var root = d3.hierarchy(data);	  
	    update(root);
	  });
	};

	scope.updateFilters();

	var connector = function(d){
	  	    return "M" + d.y + "," + d.x
	      + "C" + (d.parent.y-10) + "," + d.x
	      + " " + (d.parent.y) + "," + d.parent.x 
	      + " " + d.parent.y + "," + d.parent.x;
	};

	function update(root){
	  var nodes = tree(root);
	  var duration = 200;
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
	  
	  var node = g.selectAll(".node").data(root.descendants());
	  var nodeEnter = node
	      .enter().append("g")
	      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
	      .attr("transform", function(d) {
		return "translate(" + d.y + "," + d.x + ")";
	      });
	  nodeEnter.append("circle")
	    .attr("r", function(d){
	      return 5;
	    })
	    .style("fill", colorFill);	  
	  nodeEnter.append("text")
	    .attr("dy", 5)
	    .attr("x", function(d) { return d.children ? -8 : 8; })
	    .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
	    .text(function(d) {
	      if(d.data.rank=="superkingdom"){
		return d.data.name;
	      }
	      return d.children ? "" : d.data.name;
	    });

	  nodeEnter.on("click", function(d,i){
	    var url = "https://en.wikipedia.org/w/index.php?search="+d.data.name.replace(/ /g,"+");
	    var win = window.open(url, '_blank');
	    win.focus();
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

	  // nodeEnter.transition()
	  //   .duration(duration)
	  //   .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
	  //   .style("opacity", 1);

	  var nodeUpdate = node.merge(nodeEnter).transition()
	      .duration(duration)
	      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
	      .style("opacity", 1);
	  
	  nodeUpdate.select("circle").attr("r", function(d){
	      return 5;
	    })
	    .style("fill", colorFill);	  
	  nodeUpdate.select("text").style("text-anchor", function(d) { return d.children ? "end" : "start"; }).attr("dy", 5)
	    .attr("x", function(d) { return d.children ? -8 : 8; })
	    .text(function(d) {
	      if(d.data.rank=="superkingdom"){
		return d.data.name;
	      }
	      return d.children ? "" : d.data.name;
	    });
	  
	  // Transition exiting nodes to the parent's new position.
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
	  if(node.rank == scope.taxFilter){
	    node.significantChildren = 0;
	    node.value = c + 1;
	    node.children = [];
	    return runThreholdFilters(node);
	  }
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
      }
    };
  });
