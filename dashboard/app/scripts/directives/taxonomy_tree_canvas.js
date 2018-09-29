'use strict';

/**
 * @ngdoc directive
 * @name dashboardApp.directive:taxonomyTree
 * @description
 * # taxonomyTree
 */
angular.module('dashboardApp')
  .directive('taxonomyTreeCanvas', function ($window) {
    return {
      templateUrl: 'templates/taxonomytree_canvas.html',
      restrict: 'E',
      scope: {
	jsonFile: "@"
      },
      link: function postLink(scope, element, attrs) {
	var d3 = $window.d3;

	function setupCanvas(id, width, height) {
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

	function draw_canvas(context, width, height){
	  var canvas_wrapper = d3.select("#tree-view");
	  context.clearRect(0, 0, width, height);
	  context.beginPath();
	  canvas_wrapper.selectAll("custom.node").each(function(d){
	    var _node = d3.select(this);
	    context.moveTo(d.y, d.x);
	    context.arc(d.y, d.x, _node.attr("size"), 0, 2 * Math.PI);
	    // _node.attr("fill", '#4682B4');
	    // context.lineWidth = 2;
	    // context.strokeStyle = '#000000';
	      context.font = "18px Helvetica";
	      context.fillStyle = "#000000";
	      context.fillText(d.data.taxon_name,d.y,d.x);
	  });
	  context.fill();
	  context.stroke();
	}

	function update(data, context, width, height){
	  var root = d3.hierarchy(data, function(d){return d.children;});
	  console.log(root);
	  var tree_layout = d3.cluster().size([height, width - 300]);
	  var tree = tree_layout(root);
	  var canvas_wrapper = d3.select("#tree-view");
	  var nodes = tree.descendants();
	  var links = tree.descendants().slice(1);
	  
	  var duration = 10;
	  var node = canvas_wrapper.selectAll("custom.node").data(nodes, function(d){
	    return d;
	  });
	  var nodeEnter = node.enter()
	      .append("custom")
	      .classed("node", true)
	      .attr("size", 5);
	  var nodeUpdate = nodeEnter.merge(node);

	  nodeUpdate.transition()
	    .duration(duration);

	  var nodeExit = node.exit()
	      .transition()
	      .duration(duration)
	      .attr("size", 0)
	      .remove();
	  
	  var t = d3.timer(function(elapsed) {
	    draw_canvas(context, width, height);
	    if (elapsed > duration) t.stop();
	  });
	}	

	function search_for_node(node, tax_id){
	  if(node.tax_id == tax_id){
	    return node;
	  } else if(node.children != null) {
	    var t;
	    for(let i = 0; i < node.children.length;i++){
	      t = search_for_node(node.children[i], tax_id);
	      if(t != null){
		return t;
	      }
	    }
	  }
	  return null;
	}

	function remove_children_at_depth(node, depth){
	  if(depth == 0){
	    delete node.children;
	    return true;
	  }
	  for (var i = 0; i < node.children.length; i++) {
	    remove_children_at_depth(node.children[i], depth - 1);
	  }
	}

	function set_view_port(node, tax_id){
	  var n = search_for_node(node, tax_id);
	  console.log(n);
	  if(n == null){
	    return n;
	  }
	  var json = (n.parent == null) ? n : search_for_node(node, n.parent);
	  console.log(json);
	  remove_children_at_depth(json, 2);
	  console.log(json);
	  return json;
	}

	d3.json(scope.jsonFile, function(error, data){
	  var data_orig = data;
	  var height = window.innerHeight,
	      width = window.innerWidth;
	  var context = setupCanvas("tree-view", width, height);
	  data = set_view_port(data_orig, 2);
	  update(data, context, width, height);
	});
      }
    };
  });
