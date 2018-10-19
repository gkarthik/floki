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
	    y_pos,
	    x_pos,
	    canvas_wrapper =  d3.select("#annotation-wrapper"),
	    annotated_nodes;

	var annotated_heatmap = {
	  "padding": 5,
	  "square_size": 20,
	  "width": window.innerWidth/2,
	  "height": window.innerHeight * 2,
	  "offset_x": window.innerWidth/12,
	  "offset_y": window.innerHeight/6
	};

	var barchart = {
	  "background": "#FFFFFF",
	  "width": window.innerWidth/3,
	  "height": window.innerHeight/6,
	  "fill": "#4682b4",
	  "ctrl": "red",
	  "padding": 20,
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


	function draw_heatmap_annotated(annotated_nodes){

	  annotated_heatmap.width = annotated_nodes.length * (annotated_heatmap.square_size + annotated_heatmap.padding * 2);

	  annotated_heatmap.cell_height = 200 + annotated_nodes[0].percentage.length * annotated_heatmap.square_size;

	  var x = d3.scaleBand()
	      .rangeRound([0, annotated_heatmap.width])
	      .domain(annotated_nodes.map(function(x){return x.taxon_name;}));

	  height = annotated_heatmap.offset_y + x(annotated_nodes[annotated_nodes.length - 1].taxon_name)/(width - 2 * annotated_heatmap.offset_x) * annotated_heatmap.cell_height + annotated_heatmap.offset_x;

	  var node = canvas_wrapper.selectAll(".annotated-node").data(annotated_nodes, function(d){
	    return d;
	  });

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
		return x(d.taxon_name) % (width - 2 * annotated_heatmap.offset_x) + annotated_heatmap.offset_x;
	      })
	      .attr("y", function(d){
		return Math.floor(x(d.taxon_name) / (width - 2 * annotated_heatmap.offset_x)) * annotated_heatmap.cell_height + annotated_heatmap.offset_y;
	      })
	      .text(function(d){
		return d.taxon_name;
	      });

	  var nodeUpdate = nodeEnter.merge(node);

	  var nodeExit = node.exit().remove();

	  var _node;
	  context.clearRect(0, 0, width, height);
	  canvas_wrapper.selectAll(".annotated-node").each(function(d){
	    _node= d3.select(this);
	    context.beginPath();
	    context.strokeStyle = "#000000";
	    context.lineWidth = 2;
	    context.shadowOffsetX = 0;
	    context.shadowOffsetY = 0;
	    context.shadowBlur = 0;
	    context.shadowColor = "rgba(0,0,0,0)";
	    if(_node.attr("hover-status") == "active"){
	      context.shadowOffsetX = 0;
	      context.shadowOffsetY = 0;
	      context.shadowBlur = 2;
	      context.shadowColor = "#666666";
	    }
	    for (var i = 0; i < d.percentage.length; i++) {
	      context.rect(parseFloat(_node.attr("x")), parseFloat(_node.attr("y")) + (i * annotated_heatmap.square_size), annotated_heatmap.square_size, annotated_heatmap.square_size);
	      context.fillStyle = percentage_scale(d.percentage[i]);
	      context.fill();
	      context.stroke();
	    }
	    context.save();
	    context.translate(parseFloat(_node.attr("x")), parseFloat(_node.attr("y")));
	    context.fillStyle="#000000";
	    context.font = "12px Helvetica";
	    context.textAlign = "left";
	    context.textBaseline = "top";
	    context.rotate(-1 * Math.PI/3);
	    context.fillText(_node.text(), 0, 0);
	    context.restore();
	    context.closePath();
	  });
	  
	  canvas_wrapper.selectAll(".annotated-node")
	    .each(function(d){
	      _node = d3.select(this);
	      if(_node.attr("hover-status")=="active"){
		console.log(d.taxon_name);
		draw_hover(d, d3.select(this), ["percentage", "taxon_reads"]);
	      }
	    });
	}

	function highlight_on_mouseover(coords, nodes){
	  var n;
	  d3.selectAll(".annotated-node")
	    .each(function(d){
	      n = d3.select(this);
	      n.attr("hover-status", "inactive");
	      if(within_radius([parseFloat(n.attr("x"))+annotated_heatmap.square_size/2, parseFloat(n.attr("y"))], coords, annotated_heatmap.square_size/2)){
		n.attr("hover-status", "active");
	      } else {

	      }
	    });
	  draw_heatmap_annotated(nodes);
	  // if(coords[0] <= canvas_offset_x){
	  //   draw_canvas_taxon_up(width, height);
	  // }
	}
	
	function within_radius(p1,p2,r){
	  var a = (p1[0] - p2[0])**2 + (p1[1] - p2[1])**2;
	  a = Math.sqrt(a);
	  return (a <= r);
	}

	function draw_hover(d, node, keys){
	  // Background
	  context.beginPath();
	  context.fillStyle = barchart.background;
	  context.rect(parseFloat(node.attr("x")) + 20, parseFloat(node.attr("y")) + 20, 80 + barchart.width + barchart.padding * 2, barchart.height + 4 * barchart.padding);
	  context.fill();
	  context.strokeStyle = "#000000";
	  context.stroke();
	  context.closePath();

	  var _width = barchart.width/keys.length;
	  for (var i = 0; i < keys.length; i++) {
	    draw_barchart(d, keys[i], (_width + barchart.padding) * i, 0, d3.schemeDark2[i]);
	  }
	}

	function draw_barchart(d, key, offset_x, offset_y, _color){
	  offset_y = (offset_y == null) ? 0 : offset_y;
	  offset_x = (offset_x == null) ? 0 : offset_x;

	  var bar_x = d3.scaleBand()
	      .rangeRound([0, barchart.width/2])
	      .padding(0.1);
	  var bar_y = d3.scaleLinear()
	      .rangeRound([0, barchart.height]);

	  var _x = d.y + 50 + offset_x;
	  var _y = d.x + 20 + offset_y;
	  bar_x.domain(d["file"]);
	  var y_domain_elmns = d[key].slice();
	  y_domain_elmns.push(d["ctrl_"+key]); // Get ctrl value as well
	  y_domain_elmns.push(0);		    // Add zero
	  var y_domain = [Math.min.apply(Math, y_domain_elmns), Math.max.apply(Math, y_domain_elmns)];
	  if (y_domain[0] == y_domain[1]) {
	    y_domain[0] = y_domain[1] - 0.5; // If value 0 show zero.
	  }
	  bar_y.domain(y_domain);

	  // x-axis
	  context.beginPath();
	  context.lineWidth = 2;
	  context.strokeStyle = "#000000";
	  context.moveTo(_x + barchart.padding, _y + barchart.padding + barchart.height + 1);
	  context.lineTo(_x + (bar_x.padding() + bar_x.bandwidth()) * (d[key].length + 1) + barchart.padding * 2, _y + barchart.padding + barchart.height + 1);
	  context.moveTo(_x + barchart.padding, _y + barchart.padding+barchart.height + 2);
	  context.lineTo(_x + barchart.padding, _y + barchart.padding);
	  context.stroke();
	  context.closePath();

	  // xaxis ticks
	  context.beginPath();
	  context.fillStyle = "#000000";
	  context.strokeStyle = "#000000";
	  bar_x.domain().forEach(function(d) {
	    context.moveTo(_x + barchart.padding + bar_x(d) + bar_x.bandwidth() / 2, _y + barchart.padding + barchart.height);
	    context.lineTo(_x + barchart.padding + bar_x(d) + bar_x.bandwidth() / 2, _y + barchart.padding + barchart.height + 6);
	    context.font="12px Helvetica";
	    context.save();
	    context.translate(_x + barchart.padding + bar_x(d) + bar_x.bandwidth() / 2 , _y + barchart.padding + barchart.height + 6);
	    context.rotate(-Math.PI/2);
	    context.translate( -1 * (_x + barchart.padding + bar_x(d) + bar_x.bandwidth() / 2) , -1 * (_y + barchart.padding + barchart.height + 6));
	    context.textAlign = "right";
	    context.textBaseline = "middle";
	    context.fillText(d, _x + barchart.padding + bar_x(d) + bar_x.bandwidth() / 2 , _y + barchart.padding + barchart.height + 6);
	    context.restore();
	  });
	  context.strokeStyle = "#000000";
	  context.stroke();

	  // yxais ticks
	  bar_y.ticks(10).forEach(function(d) {
	    context.moveTo(_x + barchart.padding, _y + barchart.padding + barchart.height - bar_y(d) + 0.5);
	    context.lineTo(_x + barchart.padding - 6, _y + barchart.padding + barchart.height - bar_y(d) + 0.5);
	    context.textAlign = "right";
	    context.textBaseline = "middle";
	    context.fillText((d * 100).toExponential(1), _x + barchart.padding - 6, _y + barchart.padding + barchart.height - bar_y(d) + 0.5);
	  });
	  context.strokeStyle = "#000000";
	  context.stroke();

	  for (var i = 0; i < d[key].length; i++) {
	    context.fillStyle = _color;
	    context.rect(_x + barchart.padding + bar_x(d["file"][i]), _y + barchart.padding + (barchart.height - bar_y(d[key][i])), bar_x.bandwidth(), bar_y(d[key][i]));
	    context.fill();
	  }
	  context.beginPath();
	  context.strokeStyle=barchart.ctrl;
	  context.moveTo(_x + barchart.padding, _y + barchart.padding + (barchart.height - bar_y(d["ctrl_"+key])));
	  context.lineTo(_x + barchart.padding+barchart.width/2, _y + barchart.padding + (barchart.height - bar_y(d["ctrl_"+key])));
	  context.stroke();
	}

	d3.json(scope.jsonFile, function(error, data){
	  context = setup_canvas("annotation-wrapper", width, height);
	  annotated_nodes = get_all_annotated_nodes(data, "pathogenic");
	  draw_heatmap_annotated(annotated_nodes);
	  d3.select("#annotation-wrapper")
	    .on("mousemove", function(d){
              var coords = d3.mouse(this);
              highlight_on_mouseover(coords, annotated_nodes);
	    });
	});

      }
    };
  });
