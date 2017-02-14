'use strict';

/**
 * @ngdoc directive
 * @name dashboardApp.directive:sampleComparison
 * @description
 * # sampleComparison
 */
angular.module('dashboardApp')
  .filter('orderObjectBy', function(){
    return function(input, attribute) {
      if (!angular.isObject(input)) return input;

      var array = [];
      for(var objectKey in input) {
        array.push(input[objectKey]);
      }

      array.sort(function(a, b){
	var _a =0, _b = 0;
	if(attribute == "percentage"){
	  _a = 0;
	  for(var i in a){
	    if(a[i].percentage){
	      _a += a[i].percentage;
	    }
	  }
	  _b = 0;
	  for(var i in b){
	    if(b[i].percentage){
	      _b += b[i].percentage;
	    }
	  }
	}
        return _b - _a;
      });
      return array;
    };
  })
  .directive('sampleComparison', function ($window) {
    return {
      templateUrl: 'templates/samplecomparison.html',
      restrict: 'E',
      scope: {
	jsonFiles: "=",
	jsonData: "="
      },
      link: function postLink(scope, element, attrs) {
	scope.sortType     = 'name'; // set the default sort type
	scope.sortReverse  = false;  // set the default sort order
	scope.searchFish   = '';     // set the default search/filter ter
	scope.pvalueThreshold = 0.05,
	scope.readsThreshold = 10;
	scope.ratioThreshold = 1;
	scope.taxFilter = "nofilter";
	scope.fdrFilter = true;

	scope.nodes = [];

	scope.triggerUpdate = function(){
	  updateFilters();
	};

	scope.formatNumber = function(i) {
	  return Math.round(i * 10000)/100; 
	};

	scope.customSort = function(node){
	  var d = node;
	  var c = 0;
	  for(var i in d){
	    if(d[i].percentage){
	      c += d[i].percentage;
	    }
	  }
	  return c;
	};

	function updateFilters(){
	  scope.listNodes = {};
	  var json = angular.copy(scope.jsonData);
	  for(var i in json){
	    getSignificantNodes(json[i]);
	    addAttributestoList(json[i], i);
	  }
	};
	
	function addAttributestoList(n, _indice){
	  var i = 0;
	  if(n.children.length == 0){
	    if(Object.keys(scope.listNodes).indexOf(String(n.taxid)) == -1){
	      var _temp = {};
	      _temp["genus"] = {"name": n.name};
	      for(var _t in scope.jsonFiles){
		_temp[scope.jsonFiles[_t]] = {};
	      }
	      scope.listNodes[n.taxid] = _temp;
	    }
	    scope.listNodes[n.taxid][_indice] = n;
	    delete n.children;
	  }
	  for(var _t in n.children){
	    addAttributestoList(n.children[_t], _indice);	    
	  }
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
