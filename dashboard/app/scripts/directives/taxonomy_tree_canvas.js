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
	var d3 = $window.d3,
	    jQuery = $window.jQuery,
	    canvas_wrapper = d3.select("#tree-view"),
	    data_orig,
	    context,
	    height,
	    width,
	    node_size = 5,
	    stroke_width = 2,
	    canvas_offset_x = 100,
	    data;
	
	var color_scheme = {
	  "fill": "#4682b4",
	  "hover-fill": "red",
	  "stroke-style": "#000000",
	  "text-fill": "#000000",
	  "link-stroke-style": "#000000"
	};
	
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
	  context.clearRect(0, 0, width, height);
	  canvas_wrapper.selectAll("custom-link").each(function(d){
	    var _link = d3.select(this);
	    context.beginPath();
	    context.moveTo(_link.attr("sx"), _link.attr("sy"));
	    context.lineTo(0.5 * (parseFloat(_link.attr("tx")) + parseFloat(_link.attr("sx"))), _link.attr("sy"));
	    context.lineTo(0.5 * (parseFloat(_link.attr("tx")) + parseFloat(_link.attr("sx"))), _link.attr("ty"));
	    context.lineTo(_link.attr("tx"), _link.attr("ty"));
	    context.strokeStyle = _link.attr("stroke-style");
	    context.lineWidth = _link.attr("line-width");
	    context.stroke();
	    context.closePath();
	  });
	  canvas_wrapper.selectAll("custom-node").each(function(d){
	    var _node = d3.select(this);
	    context.moveTo(_node.attr("x"), _node.attr("y"));
	    context.beginPath();
	    context.arc(_node.attr("x"), _node.attr("y"), _node.attr("size"), 0, 2 * Math.PI);
	    context.fillStyle =  _node.attr("fill");
	    context.fill();
	    context.lineWidth = _node.attr("line-width");
	    context.strokeStyle = _node.attr("stroke-style");
	    context.stroke();
	    context.closePath();
	    context.beginPath();
	    context.font = "18px Helvetica";
	    context.fillStyle = _node.attr("text-fill");
	    context.textAlign = "left";
	    context.textBaseline = 'middle';
	    context.fillText(_node.text(),parseFloat(_node.attr("x")) + parseFloat(_node.attr("size")),parseFloat(_node.attr("y")));
	    context.fill();
	    context.closePath();
	  });
	}

	function draw_canvas_taxon_up(context, width, height){
	  context.beginPath();
	  context.globalAlpha = 0.3;
	  context.fillStyle = "#000000";
	  context.arc(0, height/2, canvas_offset_x, 0, 2 * Math.PI);
	  context.fill();
	  context.closePath();
	  context.beginPath();
	  context.globalAlpha = 1;
	  context.fillStyle = "#000000";
	  context.font = "30px Helvetica";
	  context.textAlign = "center";
	  context.textBaseline = "middle";
	  context.fillText("Back", canvas_offset_x/2, height/2);
	  context.closePath();
	}
	
	function update(data, context, width, height){
	  var root = d3.hierarchy(data, function(d){return d.children;});
	  var tree_layout = d3.cluster().size([height, width - 300]);
	  var tree = tree_layout(root);
	  var canvas_wrapper = d3.select("#tree-view");
	  var nodes = tree.descendants();
	  var links = tree.descendants().slice(1);
	  nodes.forEach(function(d){
	    d.y = (d.depth * 300) + canvas_offset_x;
	  });
	  
	  var duration = 300;
	  var node = canvas_wrapper.selectAll("custom-node").data(nodes, function(d){
	    return d;
	  });
	  
	  var nodeEnter = node.enter()
	      .append("custom-node")
	      .classed("node", true)
	      .attr("x", function(d){
		return d.y;
	      })
	      .attr("y", function(d){
		return d.x;
	      })
	      .text(function(d){
		return d.data.taxon_name;
	      })
	      .attr("size", node_size)
	      .attr("fill", color_scheme.fill)
	      .attr("stroke-style", color_scheme["stroke-style"])
	      .attr("text-fill", color_scheme["text-fill"])
	      .attr("line-width", stroke_width);
	
	  var nodeUpdate = nodeEnter.merge(node);

	  nodeUpdate.transition()
	    .duration(duration)
	    .attr("x", function(d){
	      return d.y;
	    })
	    .attr("y", function(d){
	      return d.x;
	    })
	    .text(function(d){
	      return d.data.taxon_name;
	    });

	  var nodeExit = node.exit()
	      .transition()
	      .duration(duration)
	      .attr("x", function(d){
		return d.parent.y;
	      })
	      .attr("y", function(d){
		return d.parent.x;
	      })
	      .remove();

	  var link = canvas_wrapper.selectAll("custom-link").data(links, function(d){
	    return d.data.tax_id;
	  });

	  var linkEnter = link.enter()
	      .append("custom-link")
	      .classed("link", true)
	      .attr("sx", function(d){
		return d.parent.y;
	      })
	      .attr("sy", function(d){
		return d.parent.x;
	      })
	      .attr("tx", function(d){
		return d.y;
	      })
	      .attr("ty", function(d){
		return d.x;
	      })
	      .attr("line-width", stroke_width)
	      .attr("stroke-style", color_scheme["link-stroke-style"]);

	  var linkUpdate = linkEnter.merge(link);

	  linkUpdate.transition()
	    .duration(duration)
	    .attr("sx", function(d){
	      return d.parent.y;
	    })
	    .attr("sy", function(d){
	      return d.parent.x;
	    })
	    .attr("tx", function(d){
	      return d.y;
	    })
	    .attr("ty", function(d){
	      return d.x;
	    });
	  
	  var linkExit = link.exit()
	      .transition()
	      .duration(duration)
	      .attr("sx", function(d){
		return d.parent.y;
	      })
	      .attr("sy", function(d){
		return d.parent.x;
	      })
	      .attr("tx", function(d){
		return d.parent.y;
	      })
	      .attr("ty", function(d){
		return d.parent.x;
	      })
	      .remove();

	  var t = d3.timer(function(elapsed) {
	    draw_canvas(context, width, height);
	    if (elapsed > duration + (0.3 * duration)) t.stop();
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

	function remove_children_at_depth(node, depth, tax_id){
	  if(depth == 0 || (depth == 1 && node.tax_id != tax_id && tax_id != 1)){
	    delete node.children;
	    return true;
	  }
	  for (var i = 0; i < node.children.length; i++) {
	    remove_children_at_depth(node.children[i], depth - 1, tax_id);
	  }
	}

	function within_radius(p1,p2,r){
	  var a = (p1[0] - p2[0])**2 + (p1[1] - p2[1])**2;
	  a = Math.sqrt(a);
	  return (a <= r);
	}

	function get_node_data_mouse_click(coords){
	  var n = null;
	  d3.selectAll("custom-node")
	    .each(function(d){
	      if(within_radius([d.y, d.x], coords, node_size+stroke_width)){
		// d3.select(this).attr("fill", "red");
		n = d;
	      }
	    });
	  return n;
	  // draw_canvas(context, width, height);
	}

	function highlight_on_mouseover(coords){
	  var n = null;
	  var cursor_pointer = false;
	  d3.selectAll("custom-node")
	    .each(function(d){
	      if(within_radius([d.y, d.x], coords, node_size+stroke_width)){
		d3.select(this).attr("fill", "red");
		cursor_pointer = true;
	      } else {
		d3.select(this).attr("fill", color_scheme.fill);
	      }
	    });
	  if(cursor_pointer || coords[0] <= canvas_offset_x){
	    canvas_wrapper.style("cursor", "pointer");
	  } else {
	    canvas_wrapper.style("cursor", "auto");
	  }
	  draw_canvas(context, width, height);
	  if(coords[0] <= canvas_offset_x){
	    draw_canvas_taxon_up(context, width, height);
	  }
	}

	function set_view_port(node, tax_id){
	  var n = search_for_node(node, tax_id);
	  if(n == null){
	    return n;
	  }
	  var json = (n.parent == null) ? n : search_for_node(node, n.parent);
	  remove_children_at_depth(json, 2, tax_id);
	  return json;
	}

	d3.json(scope.jsonFile, function(error, data){
	  data_orig = jQuery.extend(true, {}, data);
	  height = window.innerHeight;
	  width = window.innerWidth;
	  context = setupCanvas("tree-view", width, height);
	  d3.select("#tree-view")
	    .on("click", function(d){
	      var coords = d3.mouse(this);
	      var tax_id = -1;
	      if(coords[0] <= canvas_offset_x){
		tax_id = data.tax_id;
	      } else {
		var n = get_node_data_mouse_click(coords);
		tax_id = (n!=null) ? n.data.tax_id: -1;
	      }
	      if(tax_id!=-1){
		data = jQuery.extend(true, {}, data_orig);
		data = set_view_port(data, tax_id);
		update(data, context, width, height);
	      }
	    })
	    .on("mousemove", function(d){
	      var coords = d3.mouse(this);
	      highlight_on_mouseover(coords);
	    });
	  data = set_view_port(data, 1);
	  update(data, context, width, height);
	});
      }
    };
  });
