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
	    breadcrumbs = d3.select("#breadcrumbs"),
	    data_orig,
	    context,
	    height,
	    width,
	    node_size = 5,
	    stroke_width = 2,
	    canvas_offset_x = window.innerWidth/12,
	    data;

	var heatmap = {
	  "square_size": 10
	};
	
	var color_scheme = {
	  "fill": "#4682b4",
	  "hover-fill": "red",
	  "stroke-style": "#000000",
	  "text-fill": "#000000",
	  "link-stroke-style": "#000000"
	};

	var scales = {
	  "taxon_reads": [],
	  "percentage": [],
	  "pathogenic": [],
	  "pvalue": []
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

	function draw_barchart(d, key, offset_x, offset_y, _color){
	  offset_y = (offset_y == null) ? 0 : offset_y;
	  offset_x = (offset_x == null) ? 0 : offset_x;

	  var x = d3.scaleBand()
	      .rangeRound([0, barchart.width/2])
	      .padding(0.1);
	  var y = d3.scaleLinear()
	      .rangeRound([0, barchart.height]);
	  var _x = d.y + 20 + offset_x;
	  var _y = d.x + 20 + offset_y;
	  x.domain(d.data["file"]);
	  var y_domain_elmns = d.data[key].slice();
	  y_domain_elmns.push(d.data["ctrl_"+key]); // Get ctrl value as well
	  y_domain_elmns.push(0);		    // Add zero
	  var y_domain = [Math.min.apply(Math, y_domain_elmns), Math.max.apply(Math, y_domain_elmns)];
	  if (y_domain[0] == y_domain[1]) {
	    y_domain[0] = y_domain[1] - 0.5; // If value 0 show zero.
	  }
	  y.domain(y_domain);

	  // x-axis
	  context.beginPath();
	  context.lineWidth = 2;
	  context.strokeStyle = "#000000";
	  context.moveTo(_x + barchart.padding, _y + barchart.padding + barchart.height + 1);
	  context.lineTo(_x + (x.padding() + x.bandwidth()) * (d.data[key].length + 1) + barchart.padding * 2, _y + barchart.padding + barchart.height + 1);
	  context.moveTo(_x + barchart.padding, _y + barchart.padding+barchart.height + 2);
	  context.lineTo(_x + barchart.padding, _y + barchart.padding);
	  context.stroke();
	  context.closePath();

	  // xaxis ticks
	  context.beginPath();
	  context.fillStyle = "#000000";
	  context.strokeStyle = "#000000";
	  x.domain().forEach(function(d) {
	    context.moveTo(_x + barchart.padding + x(d) + x.bandwidth() / 2, _y + barchart.padding + barchart.height);
	    context.lineTo(_x + barchart.padding + x(d) + x.bandwidth() / 2, _y + barchart.padding + barchart.height + 6);
	    context.font="12px Helvetica";
	    context.save();
	    context.translate(_x + barchart.padding + x(d) + x.bandwidth() / 2 , _y + barchart.padding + barchart.height + 6);
	    context.rotate(-Math.PI/2);
	    context.translate( -1 * (_x + barchart.padding + x(d) + x.bandwidth() / 2) , -1 * (_y + barchart.padding + barchart.height + 6));
	    context.textAlign = "right";
	    context.textBaseline = "middle";
	    context.fillText(d, _x + barchart.padding + x(d) + x.bandwidth() / 2 , _y + barchart.padding + barchart.height + 6);
	    context.restore();
	  });
	  context.strokeStyle = "#000000";
	  context.stroke();
	  
	  // yxais ticks
	  y.ticks(10).forEach(function(d) {
	    context.moveTo(_x + barchart.padding, _y + barchart.padding + barchart.height - y(d) + 0.5);
	    context.lineTo(_x + barchart.padding - 6, _y + barchart.padding + barchart.height - y(d) + 0.5);
	    context.textAlign = "right";
	    context.textBaseline = "middle";
	    context.fillText(d, _x + barchart.padding - 6, _y + barchart.padding + barchart.height - y(d) + 0.5);
	  });
	  context.strokeStyle = "#000000";
	  context.stroke();

	  for (var i = 0; i < d.data[key].length; i++) {
	    context.fillStyle = _color;
	    context.rect(_x + barchart.padding + x(d.data["file"][i]), _y + barchart.padding + (barchart.height - y(d.data[key][i])), x.bandwidth(), y(d.data[key][i]));
	    context.fill();
	  }
	  context.beginPath();
	  context.strokeStyle=barchart.ctrl;
	  context.moveTo(_x + barchart.padding, _y + barchart.padding + (barchart.height - y(d.data["ctrl_"+key])));
	  context.lineTo(_x + barchart.padding+barchart.width/2, _y + barchart.padding + (barchart.height - y(d.data["ctrl_"+key])));
	  context.stroke();
	}
	
	function draw_hover(d, keys){	  
	  // Background
	  context.beginPath();
	  context.fillStyle = barchart.background;
	  context.rect(d.y + 20,d.x+20, barchart.width + barchart.padding * 2, barchart.height + 4 * barchart.padding);
	  context.fill();
	  context.strokeStyle = "#000000";
	  context.stroke();
	  context.closePath();
	  
	  var _width = barchart.width/keys.length;
	  for (var i = 0; i < keys.length; i++) {
	    draw_barchart(d, keys[i], (_width + barchart.padding) * i, 0, d3.schemeDark2[i]);
	  }
	}

	
	function draw_heatmap(_node, d, key){
	  var start_x = parseFloat(_node.attr("x")) + heatmap.square_size,
	      start_y = parseFloat(_node.attr("y"));
	  if(d.children !=null){
	    start_x = parseFloat(_node.attr("x")) - (heatmap.square_size * d.data[key].length)/2;
	    start_y = start_y + 22;
	  }
	  for (var i = 0; i < d.data[key].length; i++) {
	    context.beginPath();
	    context.fillStyle = scales[key][d.depth-1](d.data[key][i]);
	    context.moveTo(start_x + (heatmap.square_size * i), start_y - (heatmap.square_size/2));
	    context.rect(start_x + (heatmap.square_size * i), start_y - (heatmap.square_size/2), heatmap.square_size, heatmap.square_size);
	    context.fill();
	    context.strokeStyle = "#000000";
	    context.stroke();
	    context.closePath();
	  }
	  return 0;
	}


	function draw_canvas(width, height){
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
	    if(d.children!=null){
	      context.textAlign = "center";
	      context.textBaseline = 'middle';
	      context.fillText(_node.text(),parseFloat(_node.attr("x")),parseFloat(_node.attr("y")) + parseFloat(_node.attr("size")) + 5);
	    } else {
	      context.textAlign = "left";
	      context.textBaseline = 'middle';
	      context.fillText(_node.text(),parseFloat(_node.attr("x")) + heatmap.square_size * (d.data.percentage.length + 1) + parseFloat(_node.attr("size")),parseFloat(_node.attr("y")));
	    }
	    context.fill();
	    context.closePath();
	    if(d.depth > 0){
	      draw_heatmap(_node, d, "percentage");
	    }
	  });
	  canvas_wrapper.selectAll("custom-node").each(function(d){
	    var _node = d3.select(this);
	    if(_node.attr("hover-status")=="active"){
	      draw_hover(d, ["percentage", "taxon_reads"]);
	    }
	  });
	}

	function draw_canvas_taxon_up(width, height){
	  context.beginPath();
	  context.globalAlpha = 0.4;
	  context.fillStyle = "#000000";
	  context.arc(0, height/2, canvas_offset_x, 0, 2 * Math.PI);
	  context.fill();
	  context.closePath();
	  context.beginPath();
	  context.globalAlpha = 1;
	  context.fillStyle = "#FFFFFF";
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
	    d.y = (d.depth * width/6) + canvas_offset_x;
	  });
	  
	  var duration = 300;
	  var node = canvas_wrapper.selectAll("custom-node").data(nodes, function(d){
	    return d;
	  });
	  
	  var node_enter = node.enter()
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
	
	  var node_update = node_enter.merge(node);

	  node_update
	    .attr("x", function(d){
	      return d.y;
	    })
	    .attr("y", function(d){
	      return d.x;
	    })
	    .text(function(d){
	      return d.data.taxon_name;
	    });

	  var node_exit = node.exit()
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

	  var m1 = get_range_at_depth(data, "percentage", data.depth + 1);
	  var m2 = get_range_at_depth(data, "percentage", data.depth + 2);

	  scales.percentage[0] = d3.scaleSequential(d3.interpolateGreens)
	    .domain([Math.min.apply(Math, m1[0]), Math.max.apply(Math, m1[1])]);
	  scales.percentage[1] = d3.scaleSequential(d3.interpolateBlues)
	    .domain([Math.min.apply(Math, m2[0]), Math.max.apply(Math, m2[1])]);
	  
	  var t = d3.timer(function(elapsed) {
	    draw_canvas(width, height);
	    if (elapsed > duration + (0.3 * duration)) t.stop();
	  });
	}

	function search_for_node(node, tax_id, path_root){
	  path_root = (path_root == null) ? [] : path_root;
	  if(node.tax_id == tax_id){
	    path_root.push(node);
	    return path_root;
	  } else if(node.children != null) {
	    var t;
	    for(let i = 0; i < node.children.length;i++){
	      t = search_for_node(node.children[i], tax_id, path_root);
	      if(t.length != 0){
		t.unshift(node);
		return t;
	      }
	    }
	  }
	  return [];
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
		n = d;
	      }
	    });
	  return n;
	}

	function highlight_on_mouseover(coords){
	  var n = null;
	  var cursor_pointer = false;
	  d3.selectAll("custom-node")
	    .each(function(d){
	      if(within_radius([d.y, d.x], coords, node_size+stroke_width)){
		d3.select(this).attr("fill", color_scheme["hover-fill"]);
		d3.select(this).attr("hover-status", "active");
		cursor_pointer = true;
	      } else {
		d3.select(this).attr("hover-status", "inactive");
		d3.select(this).attr("fill", color_scheme.fill);
	      }
	    });
	  if(cursor_pointer || coords[0] <= canvas_offset_x){
	    canvas_wrapper.style("cursor", "pointer");
	  } else {
	    canvas_wrapper.style("cursor", "auto");
	  }
	  draw_canvas(width, height);
	  if(coords[0] <= canvas_offset_x){
	    draw_canvas_taxon_up(width, height);
	  }
	}

	function set_view_port(node, tax_id){
	  var n = search_for_node(node, tax_id);
	  draw_breadcrumbs(n);
	  // n = n[n.length - 1];
	  if(n.length == 0){
	    return null;
	  }
	  var json = (n.length == 1) ? n[n.length - 1] : n[n.length - 2]; // To account for root
	  remove_children_at_depth(json, 2, tax_id);
	  return json;
	}

	function get_range_at_depth(_data, key, depth, min, max){
	  if(min == null || max == null){
	    min = Array(_data[key].length).fill(Infinity);
	    max = Array(_data[key].length).fill(-1);
	  }
	  if(_data.depth == depth){
	    for (let i = 0; i < _data[key].length; i++) {
	      min[i] = (_data[key][i] < min[i]) ? _data[key][i] : min[i];
	      max[i] = (_data[key][i] > max[i]) ? _data[key][i] : max[i];
	    }
	  }
	  var m;
	  if(_data.children == null || _data.depth > depth){
	    return [min, max];
	  }
	  for (let i = 0; i < _data.children.length; i++) {
	    m = get_range_at_depth(_data.children[i], key, depth, min, max);
	    min = m[0];
	    max = m[1];
	  }
	  return [min, max];
	}

	function get_path_to_root(n, path){
	  path = (path == null) ? [] : path;
	  if(n.parent == null){
	    return path;
	  }
	  path.unshift({
	    "taxon_name": n.taxon_name,
	    "tax_id": n.tax_id
	  });
	  return get_path_to_root(n.parent, path);
	}

	function draw_breadcrumbs(path_root){
	  var current_tax = path_root[path_root.length - 1].tax_id;
	  var li = breadcrumbs.selectAll(".breadcrumb-item").data(path_root, function(d){
	    return d;
	  });
	  var liEnter = li.enter()
	      .append("li")
	      .attr("class", function(d,i){
		if(d.tax_id == current_tax){
		  return "breadcrumb-item active";
		}
		return "breadcrumb-item";
	      })
	      .style("cursor", "pointer")
	      .text(function(d){
		return d.taxon_name;
	      })
	      .on("click", function(d){
		data = jQuery.extend(true, {}, data_orig);
		data = set_view_port(data, d.tax_id);
		update(data, context, width, height);
	      });
	  
	  var liUpdate = liEnter.merge(li)
	      .attr("class", function(d,i){
		if(d.tax_id == current_tax){
		  return "breadcrumb-item active";
		}
		return "breadcrumb-item";
	      })

	      .text(function(d){
		return d.taxon_name;
	      });

	  var liExit = li.exit().remove();
	  
	}
	
	
	d3.json(scope.jsonFile, function(error, data){
	  data_orig = jQuery.extend(true, {}, data);
	  height = window.innerHeight;
	  width = window.innerWidth;
	  context = setup_canvas("tree-view", width, height);
	  var t;
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
