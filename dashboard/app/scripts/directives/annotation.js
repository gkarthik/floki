'use strict';

/**
 * @ngdoc directive
 * @name dashboardApp.directive:sampleComparison
 * @description
 * # sampleComparison
 */
angular.module('dashboardApp')
  .directive('annotation', function ($window) {
    return {
      templateUrl: 'templates/annotation.html',
      restrict: 'E',
      scope: {
	jsonFile: "@"
      },
      link: function postLink(scope, element, attrs) {
	var d3 = $window.d3,
	    jQuery = $window.jQuery,
	    json = jQuery.extend(scope.jsonData),
	    width = window.innerWidth,
	    height = window.innerHeight,
	    context,
	    canvas_wrapper =  d3.select("#annotation-wrapper");

	var annotated_heatmap = {
	  "padding": 5,
	  "square_size": 20,
	  "width": window.innerWidth,
	  "height": window.innerHeight,
	  "offset_x": window.innerWidth/6,
	  "offset_y": window.innerHeight/10
	};

	function setup_canvas(id, width, height) {
	  var canvas = document.getElementById(id);
	  canvas.style.width = width+"px";
	  canvas.style.height = height+ "px";
	  var dpr = window.devicePixelRatio || 1;
	  var rect = canvas.getBoundingClientRect();
	  canvas.width = rect.width * dpr;
	  canvas.height = rect.height * dpr;
	  var ctx = canvas.getContext('2d');
	  ctx.scale(dpr, dpr);
	  return ctx;
	}

	function get_all_annotated_nodes(n, key, annotated_nodes){
	  annotated_nodes = annotated_nodes || [];
	  if(n[key] && (n.rank == "species" || n.rank == "genus")){
	    annotated_nodes.push(n);
	  }
	  for (var i = 0; i < n.children.length; i++) {
	    annotated_nodes = get_all_annotated_nodes(n.children[i], key, annotated_nodes);
	  }
	  return annotated_nodes;
	}


	function draw_heatmap_annotated(d){

	  var annotated_nodes = get_all_annotated_nodes(d, "pathogenic");
	  // annotated_heatmap.width = annotated_nodes.length * (annotated_heatmap.square_size + annotated_heatmap.padding * 2);
    annotated_heatmap.height = annotated_nodes.length % width_fit_number * (100);
	  width = annotated_heatmap.width;
    height = annotated_heatmap.height + annotated_heatmap["offset_y"] * 2;
	  context = setup_canvas("annotation-wrapper", width, height);
	  var node = canvas_wrapper.selectAll(".annotated-node").data(annotated_nodes, function(d){
	    return d;
	  });

    var width_fit_number = (annotated_heatmap.width - annotated_heatmap["offset_x"])/(annotated_heatmap.square_size + annotated_heatmap.padding * 2)

	  var x = d3.scaleBand()
	      .rangeRound([15, annotated_heatmap.width])
        .domain(d3.range(width_fit_number));

    var y = d3.scaleBand()
        .rangeRound([annotated_heatmap.offset_y, annotated_nodes.length%width_fit_number])
        .domain(d3.range(Math.ceil(annotated_nodes.length/width_fit_number)));

	  var _min = Math.min.apply(Math, annotated_nodes.map(function(x){
	    return Math.min.apply(Math, x.percentage);
	  }));

	  var _max = Math.max.apply(Math, annotated_nodes.map(function(x){
	    return Math.max.apply(Math, x.percentage);
	  }));

	  var percentage_scale = d3.scaleSequential(d3.interpolateYlOrRd)
	      .domain([_min, _max]);

	  var nodeEnter = node.enter()
	      .append("annotated-node")
	      .classed("annotated-node", true)
	      .attr("x", function(d){
          console.log(x(Math.floor(annotated_nodes.indexOf(d) % width_fit_number)))
		return x(Math.floor(annotated_nodes.indexOf(d) % width_fit_number));
	      })
	      .attr("y", function(d){
          console.log(y(Math.floor(annotated_nodes.indexOf(d)/width_fit_number)))
          // console.log(y(Math.floor(annotated_nodes.indexOf(d)/width_fit_number)))
		return y(Math.floor(annotated_nodes.indexOf(d)/width_fit_number));
	      })
	      .text(function(d){
		return d.taxon_name;
	      });

	  var nodeUpdate = nodeEnter.merge(node);

	  var nodeExit = node.exit().remove();

	  context.clearRect(0, 0, width, height);
	  canvas_wrapper.selectAll(".annotated-node").each(function(d){
	    var _node = d3.select(this);
	    context.beginPath();
	    context.strokeStyle = "#000000";
	    context.lineWidth = 2;
	    for (var i = 0; i < d.percentage.length; i++) {
	      context.rect(x(_node.text()),  annotated_heatmap.offset_y +(i*annotated_heatmap.square_size), annotated_heatmap.square_size, annotated_heatmap.square_size);
	      context.fillStyle = percentage_scale(d.percentage[i]);
	      context.fill();
	      context.stroke();
	    }
      context.save();
      context.translate(5 + x(_node.text()), 5 + annotated_heatmap.offset_y + (i*annotated_heatmap.square_size));
      context.rotate(-Math.PI/2);
      context.translate(-1*(x(_node.text())), -1 * (annotated_heatmap.offset_y + (i*annotated_heatmap.square_size)));
	    context.fillStyle="#000000";
	    context.font = "12px Helvetica";
	    context.textAlign = "right";
	    context.textBaseline = "middle";
	    context.fillText(_node.text(), x(_node.text()), annotated_heatmap.offset_y + (i*annotated_heatmap.square_size));
      context.restore();
	    context.closePath();
	  });

	}

	d3.json(scope.jsonFile, function(error, data){
	  console.log(data);
	  draw_heatmap_annotated(data);
	});

      }
    };
  });
