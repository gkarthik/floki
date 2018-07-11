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
  scope.allFilter = true;
  scope.redFilter = false;
  scope.mapFilter = true;
  scope.colorTax = "percentage";
  scope.searchText;
  scope.seperation = 21;
	var ranks = ["superkingdom", "species", "genus"];
  var root;
  var typingTimer;
  var doneTypingInterval = 400;
  var doneSlidingInterval = 400;
  var databox;
  var databox2;
  var striscale;
  var searchingTimer;
  var t;
  var nodesharecount = 0;
  var nodecounter = 0;
  var rootready;
	var jsonFile = scope.jsonFile;
	var padding = 20;
	var d3 = $window.d3;
  var margin = {top: 10, right: 0, bottom: 200, left: 30};
	var width = $window.innerWidth;
  var height;
  var sharednodecount = 0;
  var sharescale;
  var rawSvg = element.find("#svg1")[0];
  var svg = d3.select(rawSvg);
  var svglabel = element.find("#svg2")[0];
  var label1 = d3.select(svglabel);
	d3.select(element.find("h3")[0]).html(jsonFile.split("/")[1].replace(".json", ""));
	var base = 100;
  svg.attr("width", width + margin.left + margin.right);
  svg.attr("height", 3000 + margin.top + margin.bottom);
  label1.attr("width", width + margin.left + margin.right);
  label1.attr("height", 155);
  var g = svg.append("svg:g");
	var colorScale = d3.scaleSequential(d3.interpolateRdYlBu);
  var bigscale = d3.scaleSequential(d3.interpolateReds).domain([0, 8]);
  var tree;
  var keys = {};
  var mins = {};
  var maxs = {};
  var logscale;
  var nodedata;
  var smolscale;
  var b;
  scope.runTree = function(){
    if (scope.mapFilter){
    tree = d3.cluster()
      tree.nodeSize([scope.seperation/7,(width/80)])
      tree.separation(function separation(a, b) {
        return a.parent == b.parent ? 5: 5;
    });
    }else {
    tree = d3.tree()
    tree.size([height-150, width-200]);
    }
d3.json(scope.jsonFile, function(error, data){
	scope.updateFilters = function(){
      resizeSVG(root);
      clearAll(root);
      makescales(root);
      updatelabel(root);
      root.children.forEach(collapseLevel);
      update(root);
	}
	var connector = function(d){
	  	    return "M" + d.parent.y + "," + d.parent.x
	      + "V" + d.x + "H" + d.y
        ;
	};
  function makescales(d) {
    if (scope.colorTax == "shared") {
      sharescale = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, root.data.reads.length])
    }
    if (typeof d.data[scope.colorTax] !== 'undefined') {
      if (typeof d.data[scope.colorTax][0]== 'string') {
        striscale = d3.scaleOrdinal(d3.schemePaired)
        .domain(keys[scope.colorTax]);
      } else {
        if (maxs[scope.colorTax]>=10000){
        logscale = d3.scaleLinear()
        .domain([mins[scope.colorTax], Math.log(maxs[scope.colorTax])/5, Math.log(maxs[scope.colorTax])])
        .range(["#e62e00", "#ffffb3", "#004080"]);
      }else {
        smolscale = d3.scaleLinear()
        .domain([mins[scope.colorTax], Math.log(maxs[scope.colorTax]*100000)/5, Math.log(maxs[scope.colorTax]*100000)])
        .range(["#e62e00", "#ffffb3", "#004080"]);
      }
    }
    }
}
  function createKeys(d){
    for (var key in d.data){
      if (key != 'children'){
        if (typeof d.data[key][0] == 'string'){
        keys[key]=[]
        }
      }
      }
      }
  function createminmax(d) {
    for (var key in d.data) {
        if (key != "children"){
          if (typeof d.data[key][0] != 'string'){
            mins[key]=d3.min(d.data[key]);
            maxs[key]=d3.max(d.data[key]);
    }
    }
    }
    d.children.forEach(createDomains);
  }

  function createDomains(d){
    for (var key in d.data){
        if (key != "children"){
      if (typeof d.data[key][0] != 'string'){
        if (mins[key]>d3.min(d.data[key])) {
            mins[key] = d3.min(d.data[key]);
        }
        if (maxs[key]<d3.min(d.data[key])) {
            maxs[key] = d3.max(d.data[key]);
        }
    }
  }
  }
  if (d.children){
    d.children.forEach(createDomains);
  }
  }

  function getkeyScales(d){
        if (d.children){
          d.children.forEach(getkeyScales);
        }
        for (var key in keys){
          for (var q=0; q<d.data[key].length; q++){
          if (keys[key].includes(d.data[key][q])==false){
            keys[key].push(d.data[key][q])
          }
          }
        }
      }

  function searchTree(d) {
    if(scope.searchText.length>0){
      if (d.children)
          d.children.forEach(searchTree);
      else if (d._children)
          d._children.forEach(searchTree);
      var searchFieldValue = d.data.name[0];
      if (searchFieldValue && (searchFieldValue.toUpperCase()).match(scope.searchText.toUpperCase())) {
              var ancestors = [];
              var parent = d;
              while (parent) {
                  ancestors.push(parent);
                  parent.class1 = "found";
                  parent = parent.parent;
              }
      }
    }
}

function countNodes(d){
  if(d.children){
    d.children.forEach(countNodes);
  } else {
    nodecounter = nodecounter + 1
    return nodecounter;
  }
}

function resizeSVG(d) {
  countNodes(d);
  if (scope.mapFilter){
      height = nodecounter * 16/3 * scope.seperation/7;
      g.attr("transform", "translate(" + (30) + "," + height/1.12 + ")");
  }else {
    height = nodecounter * 16.5;
    g.attr("transform", "translate(" + (30) + "," + 0 + ")");
  }
  width = $window.innerWidth;
  svg.attr("width", width + margin.left + margin.right);
  svg.attr("height", height + margin.top + margin.bottom);
  nodecounter = 0;
}

function clearAll(d) {
    d.class1 = "";
    if (d.children)
        d.children.forEach(clearAll);
    else if (d._children){
        d._children.forEach(clearAll);
}}

scope.delayedRun = function () {
    clearTimeout(searchingTimer);
    searchingTimer = setTimeout(function (d) {
      scope.runTree(root);
    }, doneSlidingInterval)
}
scope.runSearch = function(){
  clearTimeout(typingTimer);
  typingTimer = setTimeout(function() {
    doneTyping()
  }, doneTypingInterval);
}

  function doneTyping() {
    clearAll(root);
    searchTree(root);
    update(root);
  }

  function updatelabel(d) {
    if(typeof(b) !== 'undefined'){
      b.remove();
    }
    b = label1.append("svg:g")
    .attr("class", "legend");
    var labelrange;
    if (scope.colorTax=="shared") {
      sharescale = d3.scaleSequential(d3.interpolateViridis).domain([0, d.data.reads.length])
      var band = d3.scaleBand()
          .domain(d3.range(d.data.reads.length+1))
          .range([0, 600]);
      b.append("g")
        .attr("transform", "translate(20,65)")
        .call(d3.axisBottom(band)
        );
      b.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "translate(300,25)")
      .text("Node " + scope.colorTax)
      .attr("font-family","sans-serif");
      var boxen = b.selectAll('.boxen')
        .data(d3.range(d.data.reads.length+1))
        .enter().append("rect")
          .attr("transform", "translate(20,35)")
          .attr("class", "boxen")
          .attr("x", function(i) { return i * (600/(d.data.reads.length+1));})
          .attr("y", 0)
          .attr("height", 25)
          .attr("width", 600/(d.data.reads.length+1))
          .style("fill", function(d, i) {
            return sharescale(i); });
        }
        else if (typeof d.data[scope.colorTax][0]== 'string') {
          var band = d3.scaleBand()
              .domain(keys[scope.colorTax])
              .range([0, 600]);
          var boxen = b.selectAll('.boxen')
            .data(d3.range(keys[scope.colorTax].length))
            .enter().append("rect")
              .attr("transform", "translate(20,35)")
              .attr("class", "boxen")
              .attr("x", function(d, i) { return i * (600/keys[scope.colorTax].length); })
              .attr("y", 0)
              .attr("height", 25)
              .attr("width", 600/keys[scope.colorTax].length - 8)
              .style("fill", function(d, i ) {
                return striscale(keys[scope.colorTax][d]); });
            b.append("g")
              .attr("transform", "translate(20,65)")
              .call(d3.axisBottom(band)
              ).selectAll("text")
              .attr("y", 0)
              .attr("x", 9)
              .attr("dy", ".35em")
              .attr("transform", "rotate(90)")
              .style("text-anchor", "start");
            b.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(300,25)")
            .text("Node " + scope.colorTax)
            .attr("font-family","sans-serif");
            } else {
            if (maxs[scope.colorTax]>=10000){
              var legend = b.append("defs")
                .append("svg:linearGradient")
                .attr("id", "gradient")
                .attr("x1", "0%")
                .attr("y1", "100%")
                .attr("x2", "100%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad");
              var band = d3.scaleLog()
                  .domain([1, maxs[scope.colorTax]])
                  .range([0, 600])
                  ;
              b.append("g")
              .attr("transform", "translate(20,65)")
              .call(d3.axisBottom(band)
              .ticks(8)
              );
              legend.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", logscale(0))
                .attr("stop-opacity", 1);
              legend.append("stop")
                .attr("offset", "20%")
                .attr("stop-color", smolscale(Math.log(maxs[scope.colorTax])/5))
                .attr("stop-opacity", 1);
              legend.append("stop")
                .attr("offset", "66%")
                .attr("stop-color", logscale((Math.log(maxs[scope.colorTax])*0.666)))
                .attr("stop-opacity", 1);
              legend.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", logscale(Math.log(maxs[scope.colorTax])))
                .attr("stop-opacity", 1);
              b.append('rect')
              .attr("transform", "translate(20,35)")
              .attr("x1", 30)
              .attr("y1", 30)
              .attr("height", 25)
              .attr("width", 600)
              .attr("fill", 'url(#gradient)');
              b.append("text")
              .attr("text-anchor", "middle")
              .attr("transform", "translate(300,25)")
              .text("Average node " + scope.colorTax)
              .attr("font-family","sans-serif");
            }else {
              var legend = b.append("defs")
                .append("svg:linearGradient")
                .attr("id", "gradient")
                .attr("x1", "0%")
                .attr("y1", "100%")
                .attr("x2", "100%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad");
              var band = d3.scaleLog()
                  .domain([.0001, 100])
                  .range([0, 600])
                  ;
              b.append("g")
              .attr("transform", "translate(20,65)")
              .call(d3.axisBottom(band)
              .ticks(4)
            );
              legend.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", smolscale(0))
                .attr("stop-opacity", 1);
              legend.append("stop")
                .attr("offset", "20%")
                .attr("stop-color", smolscale(Math.log(100000*maxs[scope.colorTax])/5))
                .attr("stop-opacity", 1);
              legend.append("stop")
                .attr("offset", "80%")
                .attr("stop-color", smolscale(Math.log(100000*maxs[scope.colorTax]*0.8)))
                .attr("stop-opacity", 1);
              legend.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", smolscale(Math.log(100000*maxs[scope.colorTax])))
                .attr("stop-opacity", 1);
              b.append('rect')
              .attr("transform", "translate(20,35)")
              .attr("x1", 30)
              .attr("y1", 30)
              .attr("height", 25)
              .attr("width", 600)
              .attr("fill", 'url(#gradient)');
              b.append("text")
              .attr("text-anchor", "middle")
              .attr("transform", "translate(300,25)")
              .text("Average node " + scope.colorTax)
              .attr("font-family","sans-serif");
            }
          }
        }

	function update(source){
	  var nodes = tree(root);
	  var duration = 350;
	  var link = g.selectAll(".link")
	      .data(root.descendants().slice(1));
	  var linkEnter = link.enter().append("path")
	      .attr("class", "link")
	      .attr("d", connector)
        .attr("stroke", function (d) {
          if (d.class1 === "found") {
              return '#3884ff';
          }else{
            return "#000" ;
          }
        })
        .attr("stroke-width", function (d) {
          if (d.class1 === "found" || d.class2 === "collapsed") {
            return 3;
          }
        });

	  link.merge(linkEnter).transition()
            .duration(duration)
            .attr('d', connector)
            .attr("stroke", function (d) {
              if (d.class1 === "found") {
                  return "#3884ff";
              }else{
                return "#000" ;
              }
            })
            .attr("stroke-width", function (d) {
              if (d.class1 === "found") {
                return 3;
              }
            });
	  link.exit().transition()
	    .duration(duration)
	    .attr("transform", function(d) { return "translate(" + d.parent.y + "," + d.parent.x + ")"; })
	    .remove();
	  var node = g.selectAll(".node").data(nodes.descendants());
	  var nodeEnter = node.enter().append("g")
	      .attr("class", function(d) { return "node" + (d.children ? " node-internal" : " node-leaf"); })
	      .attr("transform", function(d) {
		return "translate(" + d.y + "," + d.x + ")";
	      });
	  nodeEnter.append("circle")
      .on("click", click)
    .attr("r", function (d) {
      if (d.class2 === "collapsed") {
        return 7;
      }else {
        return 5;
      }
    })
    .style("stroke", function (d) {
      if (d.class1 === "found") {
          return "#3884ff";
      }else {
        return "#000000"
      }
    })
    .style("stroke-width", function (d) {
      if (d.class1 === "found") {
          return 3;
      }else if (d.class2 === "collapsed"){
        return 1.5
      }else {
        return 0.5
      }
    })
    .style("fill", function(d) {
      if (scope.colorTax=="shared") {
              nodesharecount = 0
              for (var q=0; q<d.data.percentage.length; q++){
            if (d.data.reads[q] >= scope.readsThreshold) {
              nodesharecount = nodesharecount + 1
            }
          }
            return sharescale(nodesharecount);
          }
            else if (typeof d.data[scope.colorTax][0]== 'string') {
              return striscale(String(d.data[scope.colorTax][0]));
            } else {
              if (maxs[scope.colorTax]>=10000){
                nodedata=0
                for (var q=0; q<d.data[scope.colorTax].length; q++){
                    nodedata = nodedata + d.data[scope.colorTax][q];
                }
                return logscale(Math.log(0.01+nodedata/(d.data[scope.colorTax].length)));
              }else {
                nodedata=0
                for (var q=0; q<d.data[scope.colorTax].length; q++){
                    nodedata = nodedata + d.data[scope.colorTax][q];
                }
                return smolscale(Math.log(100000*nodedata/5));
              }
            }
          });

      var gridSize = 10
	  nodeEnter.on("mouseover", function(d, i){
      var dataset = [];
      var colors = d3.schemeSet1;
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
       .attr("width", d.data.file.length*70)
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
          "translate(" + (d.data.file.length*70)/2 + " , 25)")
    .style("text-anchor", "middle")
    .text(function () {
      return d.data.name[0];
    })
    .attr("font-family","sans-serif");

    t.append("text")
    .attr("transform",
          "translate(10 ,12 )")
    .style("text-anchor", "left")
    .text(function () {
      return "rank: "+ d.data.rank[0];
    })
    .attr("font-family","sans-serif");

    t.append("text")
    .attr("transform",
          "translate(" + (d.data.file.length*70)/2 + " ,230)")
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

	  nodeUpdate.select("circle")
    .attr("r", function (d) {
          if (d.class2 === "collapsed") {
            return 7;
          }else {
            return 5;
          }
        })
      .style("stroke", function (d) {
        if (d.class1 === "found") {
            return "#3884ff";
        }else {
          return "#000000"
        }
      })
      .style("stroke-width", function (d) {
        if (d.class1 === "found") {
            return 3;
        }else if (d.class2 === "collapsed"){
          return 1.5
        }else {
          return 0.5
        }
      })
      .style("fill", function(d) {
        if (scope.colorTax=="shared") {
                nodesharecount = 0
                for (var q=0; q<d.data.percentage.length; q++){
              if (d.data.reads[q] >= scope.readsThreshold) {
                nodesharecount = nodesharecount + 1
              }
            }
              return sharescale(nodesharecount);
            }
              else if (typeof d.data[scope.colorTax][0]== 'string') {
                return striscale(String(d.data[scope.colorTax][0]));
              } else {
                if (maxs[scope.colorTax]>=10000){
                  nodedata=0
                  for (var q=0; q<d.data[scope.colorTax].length; q++){
                      nodedata = nodedata + d.data[scope.colorTax][q];
                  }
                  return logscale(Math.log(0.01+nodedata/(d.data[scope.colorTax].length)));
                }else {
                  nodedata=0
                  for (var q=0; q<d.data[scope.colorTax].length; q++){
                      nodedata = nodedata + d.data[scope.colorTax][q];
                  }
                  return smolscale(Math.log(100000*nodedata/(d.data[scope.colorTax].length)));
                }
              }
            });

    nodeUpdate.each(function(nodeData){
      var _map = d3.select(this).selectAll(".box1");
        var mapEnter1 = _map.data(function (d) {
          databox2 = [];
            for (var q=0; q<d.data.percentage.length; q++){
              databox2[q]={}
              databox2[q]["children"]= (d.children) ? d.children : [];
             databox2[q]["num"] = q;
            databox2[q]["name"] = d.data.file[q];
            databox2[q]["percentage"] = d.data.percentage[q];
            databox2[q]["reads"] = d.data.reads[q];
          }
          return databox2;
       })
       .enter().append("svg:g")
     .append("rect")
      .attr("x", function(d) {return 20+(gridSize * databox2.length);})
     .attr("transform", function(d, i){
       return  "translate(" +i * gridSize + ", "+(-5)+")";})
        .attr("class","box1")
        .attr("height", gridSize)
        .attr("width", function (d, i) {
          if(d.children.length == 0 && scope.mapFilter){
              return  gridSize;
            }else{
              return 0;
            }})
            .attr("stroke", "#000")
        .attr("fill", function(d){
          return bigscale(Math.log(d.percentage/rootready * 10000000));});

          var mapUpdate1 = _map.merge(mapEnter1);

          mapUpdate1.attr("width", function(d){
            if(d.children.length == 0 && scope.mapFilter){
                return  gridSize;
              }else{
                return 0;
              }
          })  .attr("height", gridSize)
          .attr("fill", function(d){
            return bigscale(Math.log(d.percentage/rootready *10000000));})
      });

      nodeEnter.append("text")
      .attr("dy", function (d) {
        if(d.data.rank[0]=="superkingdom"){
          return 12;
        }else if (d.data.rank[0]=="phylum") {
          return -3;
        }else{
          return 3;
        }
      })
        .attr("x", function(d) { if (scope.mapFilter && !d.children) {
          return databox2.length*gridSize*2.2;
        }else {
          return d.children ? -8 : 8;
        }})
  	    .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
  	    .text(function(d) {
            if(d.data.rank[0]=="superkingdom"||d.data.rank[0]=="phylum"){
        return d.data.name[0];
            }
            return d.children ? "" : d.data.name[0];
  	    })
        .style('stroke-width', 0.5)
        .style('stroke', function (d) {
          if (d.class1 === "found") {
              return "#3884ff";
          }
        });

    nodeUpdate.each(function(nodeData){
      var map_ = d3.select(this).selectAll(".box");
        var mapEnter = map_.data(function (d) {
          databox = [];
            for (var q=0; q<d.data.percentage.length; q++){
              databox[q]={}
              databox[q]["children"]= (d.children) ? d.children : [];
             databox[q]["num"] = q;
            databox[q]["name"] = d.data.file[q];
            databox[q]["percentage"] = d.data.percentage[q];
            databox[q]["reads"] = d.data.reads[q];
          }
          return databox;
       })
       .enter().append("svg:g")
       .attr("transform", function(d, i){
       return  "translate(10 , "+(-5)+")";
     }).append("rect")
         .attr("transform", function(d, i){
           return  "translate(" + i * gridSize + ", 0)";
       })
          .attr("class","box")
          .attr("height", gridSize)
          .attr("width", function (d, i) {
            if(d.children.length == 0 && scope.mapFilter){
                return  gridSize;
              }else{
                return 0;
              }})
          .attr("stroke", "#000")
          .attr("fill", function(d){
            var scalio = d3.scaleSequential(d3.interpolateBuPu).domain([0, d3.max(d3.values(databox),function (d){return d.percentage;
            })]);
            return scalio(d.percentage);});

            var mapUpdate = map_.merge(mapEnter);

            mapUpdate.attr("width", function(d){
              if(d.children.length == 0 && scope.mapFilter){
                  return  gridSize;
                }else{
                  return 0;
                }
            })  .attr("height", gridSize)
            .attr("fill", function(d){
              var scalio = d3.scaleSequential(d3.interpolateBuPu).domain([0, d3.max(d3.values(databox),function (d){return d.percentage;
              })]);
              return scalio(d.percentage);})
        });

  	  nodeUpdate.select("text").style("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .attr("dy", function (d) {
        if(d.data.rank[0]=="superkingdom"){
          return 12;
        }else if (d.data.rank[0]=="phylum") {
          return -3;
        }else{
          return 3;
        }
      })
      .attr("x", function(d) { if (scope.mapFilter && !d.children) {
        return databox.length*gridSize*2.7;
      }else {
        return d.children ? -8 : 8;
      }})
  	    .text(function(d) {
          if(d.data.rank[0]=="superkingdom"||d.data.rank[0]=="phylum"){
   return d.data.name[0];
       }
       return d.children ? "" : d.data.name[0];
     })
     .style('stroke-width', 0.5)
     .style('stroke', function (d) {
         if (d.class1 === "found") {
             return "#3884ff";
         }
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
        return colorScale((d.data.percentage[0]+d.data.percentage[1]+d.data.percentage[2]+d.data.percentage[3]+d.data.percentage[4]));
	}

	function runThreholdFilters(node){
    t = 0
    if(!scope.allFilter){
	  if(scope.fdrFilter){
	    for (var q=0; q<node.percentage.length; q++){
      if (!node.pass_fdr_test[q]) {
        return 0;
      }else if (node.uncorrected_pvalue[q] > scope.pvalueThreshold) {
        return 0;
      }else if (node.reads[q] <= scope.readsThreshold) {
        return 0;
      }else if (node.percentage[q]<= node.ctrl_percentage[q]*scope.ratioThreshold) {
        return 0;
      }
    }
  	  return 1;
  }else {
    for (var q=0; q<node.percentage.length; q++){
  if (node.uncorrected_pvalue[q] > scope.pvalueThreshold) {
    return 0;
  } else if (node.reads[q] <= scope.readsThreshold) {
    return 0;
  }else if (node.percentage[q]<= node.ctrl_percentage[q]*scope.ratioThreshold) {
    return 0;
  }
}
  	  return 1;
    }
    }else {
      if(scope.fdrFilter){
        for (var q=0; q<node.percentage.length; q++){
        if (node.pass_fdr_test[q] && node.uncorrected_pvalue[q] < scope.pvalueThreshold && node.reads[q] >=scope.readsThreshold && node.percentage[q] >= node.ctrl_percentage[q]*scope.ratioThreshold) {
          t = 1;
        }
      }
      if (t == 0){
        return 0;
      }
      }else {
      for (var q=0; q<node.percentage.length; q++){
    if (node.uncorrected_pvalue[q] < scope.pvalueThreshold && node.reads[q] >=scope.readsThreshold && node.percentage[q] >= node.ctrl_percentage[q]*scope.ratioThreshold) {
      t = 1;
    }
  }
  if (t == 0){
    return 0;
  }
  }
  }
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
      d.class2 = "collapsed";
      d._children = d.children;
      d.children = null;
    } else {
      d.class2 = "null"
      d.children = d._children;
      d._children = null;
    }
    resizeSVG(root);
    update(d);
    }

  function collapseLevel(d) {
      d.class2 = "null"
      if (d._children){
        d.children = d._children;
        d._children = null;
      }
      if (d.children && d.data.rank[0] == scope.taxFilter) {
          d.class2 = "collapsed";
          d._children = d.children;
          // d._children.forEach(collapseAll);
          d.children = null;
      } else if (d.children) {
          d.children.forEach(collapseLevel);
      }
  }
  function collapseAll(d) {
    if(d.children){
    d._children = d.children;
    d._children.forEach(collapseAll);
    d.children = null;
  }
  }
  getSignificantNodes(data);
  root = d3.hierarchy(data);
  createKeys(root);
  getkeyScales(root);
  createminmax(root);
  makescales(root);
  root.children.forEach(collapseLevel);
  resizeSVG(root);
  rootready = 0
  for (var q=0; q<root.data.reads.length; q++){
      rootready = rootready + root.data.percentage[q];
  }
  update(root);
  updatelabel(root);
});
}
scope.runTree();
      }
    };
  });
