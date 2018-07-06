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
	var ranks = ["superkingdom", "species", "genus"];
  var root;
  var databox;
  var databox2;
  var t;
  var rootready;
	var jsonFile = scope.jsonFile;
	var padding = 20;
	var d3 = $window.d3;
  var margin = {top: 100, right: 300, bottom: 200, left: 30};
	var width = $window.innerWidth +1000 - margin.left - margin.right, height = $window.innerHeight + 3250 - margin.top;
	var rawSvg = element.find("svg")[0];
	var svg = d3.select(rawSvg);
	d3.select(element.find("h3")[0]).html(jsonFile.split("/")[1].replace(".json", ""));
	var base = 100;
	svg.attr("width", width + margin.left + margin.right);
	svg.attr("height", height + margin.top + margin.bottom)
	var g = svg.append("svg:g")
  	g.attr("transform", "translate(" + (30) + "," + height/1.1 + ")");
	var colorScale = d3.scaleSequential(d3.interpolateRdYlBu);
  var bigscale = d3.scaleLinear().domain([0, 3]).range(['#FFFFFF',"#B30409"]);
  var tree;
  scope.runTree = function(){
    if (scope.mapFilter){
    tree = d3.cluster()
      .nodeSize([3,30])
      .separation(function separation(a, b) {
        return a.parent == b.parent ? 5: 5;
    });
    // .size([height-150, width-800]);
    }else {
    tree = d3.tree()
    .nodeSize([3,30])
    .separation(function separation(a, b) {
      return a.parent == b.parent ? 5 : 5;
  });
  // .size([height-150, width-200]);
    }
d3.json(scope.jsonFile, function(error, data){
	scope.updateFilters = function(){
      root.children.forEach(collapseLevel);
      update(root);
	}
// tree.nodeSize([20, 15]);
	var connector = function(d){
	  	    return "M" + d.parent.y + "," + d.parent.x
	      + "V" + d.x + "H" + d.y
	      // + " " + (d.parent.y) + "," + d.parent.x
	      // + " " + d.parent.y + "," + d.parent.x
        ;
	};

	function update(source){
	  var nodes = tree(root);
	  var duration = 250;
	  var link = g.selectAll(".link")
	      .data(root.descendants().slice(1));
	  var linkEnter = link.enter().append("path")
	      .attr("class", "link")
	      .attr("d", connector);
    // var label = g.selectAll(".label")
    // labelEnter = label.enter().append("g")
    // .attr("class", "label")
    // .attr("transform", function () {
    //   return "translate(" + d.y + "," + d.x + ")";
    // });
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

      var gridSize = 10

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
       // .attr("x", function(d) {return 500;})
     //   .attr("transform", function(d, i){
     //     return  "translate(150 , 0)";
     // })
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

            // g.append("text")
            //   .attr("class","lablo")
            //   .attr("dy", '-3550')
            //   .attr("x", function(d) {
            //     return 900 + databox2.length*gridSize*2.2;
            // })
            // .style("text-anchor", "middle")
            //   .text(function(d) {
            //     if (scope.mapFilter) {
            //       return "Percentage across all";
            //     }else{
            //       return null;
            //     }
            //   })
            //   .attr("font-family","sans-serif");
      });

      nodeEnter.append("text")
  	    .attr("dy", 3)
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
            var scalio = d3.scaleLinear().domain([0, d3.max(d3.values(databox),function (d){return d.percentage;
            })]).range(['#FFFFFF','#1a1aff','#800000']);
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
              var scalio = d3.scaleLinear().domain([0, d3.max(d3.values(databox),function (d){return d.percentage;
              })]).range(['#FFFFFF','#1a1aff','#800000']);
              return scalio(d.percentage);})
        });

  	  nodeUpdate.select("text").style("text-anchor", function(d) { return d.children ? "end" : "start"; }).attr("dy", 3)
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

  function reduce(root){
    var nodes = tree(root);
    var duration = 850;
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

      var gridSize = 10

    nodeEnter.append("text")
      .attr("dy", 3)
      .attr("x", function(d) { if (scope.mapFilter && !d.children) {
        return databox.length*gridSize*2.2;
      }else {
        return d.children ? -8 : 8;
      }  })
      .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .text(function(d) {
          if(d.data.rank[0]=="superkingdom"||d.data.rank[0]=="phylum"){
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
       // .attr("x", function(d) {return 500;})
     //   .attr("transform", function(d, i){
     //     return  "translate(150 , 0)";
     // })
     .append("rect")
      .attr("x", function(d) {return 20+ (gridSize * databox2.length);})
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
          return bigscale(Math.log(d.percentage/rootready *10000000));});

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

            // g.selectAll(".lablo")
            // .attr("class","lablo")
            //   .attr("dy", '-3550')
            //   .attr("x", function(d) {
            //     return 900 + databox2.length*gridSize*2.2;
            // })
            // .style("text-anchor", "middle")
            //   .text(function(d) {
            //     if (scope.mapFilter) {
            //       return "Percentage across all";
            //     }else{
            //       return null;
            //     }
            //   })
            //   .attr("font-family","sans-serif");
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
              var scalio = d3.scaleLinear().domain([0, d3.max(d3.values(databox),function (d){return d.percentage;
              })]).range(['#FFFFFF','#1a1aff','#800000']);
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
                var scalio = d3.scaleLinear().domain([0, d3.max(d3.values(databox),function (d){return d.percentage;
                })]).range(['#FFFFFF','#1a1aff','#800000']);
                return scalio(d.percentage);})
          });

    	  nodeUpdate.select("text").style("text-anchor", function(d) { return d.children ? "end" : "start"; }).attr("dy", 3)
        .attr("x", function(d) { if (scope.mapFilter && !d.children) {
          return databox.length*gridSize*2.2;
        }else {
          return d.children ? -8 : 8;
        }})
    	    .text(function(d) {
            if(d.data.rank[0]=="superkingdom"||d.data.rank[0]=="phylum"){
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
    if(!scope.redFilter){
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }else {
    reduce(d);
  }
    }

  function collapseLevel(d) {
      if (d._children){
        d.children = d._children;
        d._children = null;
      }
      if (d.children && d.data.rank[0] == scope.taxFilter) {
          d._children = d.children;
          d._children.forEach(collapseAll);
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
  root.children.forEach(collapseLevel);
  rootready = 0
  for (var q=0; q<root.data.reads.length; q++){
      rootready = rootready + root.data.percentage[q];
  }
  update(root);
});
}
scope.runTree();
      }
    };
  });
