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
  var margin = {top: 10, right: 300, bottom: 300, left: 30};
	var width = $window.innerWidth - margin.left - margin.right, height = $window.innerHeight + 500;
	var rawSvg = element.find("svg")[0];
	var svg = d3.select(rawSvg);
	d3.select(element.find("h3")[0]).html(jsonFile.split("/")[1].replace(".json", ""));
	var base = 100;
	svg.attr("width", width + margin.left+ margin.right);
	svg.attr("height", height + margin.top + margin.bottom);
	var g = svg.append("svg:g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
      function heatmap(d) {
          var dataset = [];
          var colors = ["red","orange","green","cyan","blue","purple","pink"];
          for (var q=0; q<d.data.percentage.length; q++){
            dataset[q]={}
          dataset[q]["name"] = d.data.name[q];
          dataset[q]["percentage"] = d.data.percentage[q];
          dataset[q]["reads"] = d.data.reads[q];
          dataset[q]["color"] = colors[q];
        }
        var map = g.append("svg:g")
          .attr("class","heatmap")
    	    .attr("transform", "translate("+parseInt(d.y)+","+parseInt(d.x + 20)+")");
         map.append("rect")
         .attr("width", 350)
         .attr("height", 50)
         .attr("stroke", "#000")
         .attr("fill", "#FFF");
        var bar = map.selectAll("bar")
          .data(dataset)
          .enter().append("svg:g")
          .attr("transform", function(d, i){
            return  "translate(" + i * barWidth + ",0)";
        });
        }
	  nodeEnter.append("text")
	    .attr("dy", 3)
	    .attr("x", function(d) { return d.children ? -8 : 8; })
	    .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
	    .text(function(d) {
          if(d.data.rank[0]=="superkingdom"){
      return d.data.name[0];
          }
          return d.children ? "" : d.data.name[0];
	    });
	  nodeEnter.on("mouseover", function(d, i){
      var dataset = [];
      var colors = ["red","orange","green","cyan","blue","purple","pink"];
      for (var q=0; q<d.data.percentage.length; q++){
        dataset[q]={}
      dataset[q]["name"] = d.data.file[q];
      dataset[q]["percentage"] = d.data.percentage[q];
      dataset[q]["reads"] = d.data.reads[q];
      dataset[q]["color"] = colors[q];
    }
      var barWidth = 50;
      var x = d3.scaleBand()
          .range([0, 250])
          .padding(0.1);
      var y = d3.scaleLinear()
     				.domain([0, d3.max(d3.values(dataset), function(d){return d.percentage;})])
     				.range([0, 140]);
      var t = g.append("svg:g")
        .attr("class","tool-tip")
  	    .attr("transform", "translate("+parseInt(d.y)+","+parseInt(d.x + 20)+")");
       t.append("rect")
       .attr("width", 350)
       .attr("height", 250)
       .attr("stroke", "#000")
       .attr("fill", "#FFF");
      var bar = t.selectAll("bar")
        .data(dataset)
        .enter().append("svg:g")
        .attr("transform", function(d, i){
          return  "translate(" + i * barWidth + ",0)";
      });
      var textbar = t.selectAll("textbar")
        .data(dataset)
        .enter().append("svg:g")
        .attr("transform", function(d, i){
          return  "translate(" + (i * barWidth) + "," + (142 - y(d.percentage)) +")";});
      var format = d3.format(".2e");
      textbar.append("text")
        .attr("class", "textbar")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(100," + 35 + ")")
        .text(function(d) {
          if (d.reads > 10000){
            return format(d.reads);
          }else {
            return d.reads;
        }})
        .attr("font-family","sans-serif").style("font-size", "12px");

      x.domain(dataset.map(function(d) { return d.name; }));

      bar.append("rect")
      .attr("y", function (a) {
        return 151 - y(a.percentage);
      })
      .attr("transform", "translate(77," + 30 + ")")
      .attr("width", barWidth - 10)
      .attr("height", function(a){
        return y(a.percentage);
      })
      .attr("fill", function(a){
        return a.color;});

    y.domain([d3.max(d3.values(dataset), function(d, i) {return (d.percentage * 100);}), 0])

    t.append("g")
    .attr("transform", "translate(70,185)")
    .call(d3.axisBottom(x));

    t.append("g")
    .attr("transform", "translate(70,40)")
    .call(d3.axisLeft(y));

    t.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate(20,125)rotate(-90)")
    .text("Percent of Reads")
    .attr("font-family","sans-serif");

    t.append("text")
    .attr("transform",
          "translate(" + 350/2 + " ,13 )")
    .style("text-anchor", "middle")
    .text("Percent and Number of Reads")
    .attr("font-family","sans-serif");

    t.append("text")
    .attr("transform",
          "translate(" + 350/2 + " ,230)")
    .style("text-anchor", "middle")
    .text("Samples").attr("font-family","sans-serif");
	  });
	  nodeEnter.on("mouseout", function(d, i){
	    g.select(".tool-tip").remove();
	  });

	  var nodeUpdate = node.merge(nodeEnter).transition()
	      .duration(duration)
	      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
	      .style("opacity", 1);
	  nodeUpdate.select("circle").attr("r", function(d){
      return 5
	      // return Math.log((d.data.reads[0]+d.data.reads[1]+d.data.reads[2]+d.data.reads[3]+d.data.reads[4])/5);
	    })
	    .style("fill", colorFill);
	  nodeUpdate.select("text").style("text-anchor", function(d) { return d.children ? "end" : "start"; }).attr("dy", 3)
	    .attr("x", function(d) { return d.children ? -8 : 8; })
	    .text(function(d) {
        if(d.data.rank[0]=="superkingdom"){
   return d.data.name[0];
       }
       return d.children ? "" : d.data.name[0];
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
	      // return colorScale(d.data.percentage[0]);
        return colorScale((d.data.percentage[0]+d.data.percentage[1]+d.data.percentage[2]+d.data.percentage[3]+d.data.percentage[4]));
	}
	function runThreholdFilters(node){
	  if(scope.fdrFilter){
	    if(!node.pass_fdr_test[0] || !node.pass_fdr_test[1] || !node.pass_fdr_test[2] || !node.pass_fdr_test[3] || !node.pass_fdr_test[4] || node.reads[0] <= scope.readsThreshold || node.percentage[0] <= node.ctrl_percentage[0] * scope.ratioThreshold){
	      return 0;
	    }
	  } else {
	    if(node.uncorrected_pvalue[0] > scope.pvalueThreshold || node.reads[0] <= scope.readsThreshold || node.percentage[0] <= node.ctrl_percentage[0] * scope.ratioThreshold){
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
      if (d.children && d.data.rank[0] == scope.taxFilter) {
          d._children = d.children;
          d._children.forEach(collapseLevel);
          d.children = null;
      } else if (d.children) {
          d.children.forEach(collapseLevel);
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
