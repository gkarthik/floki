'use strict';

describe('Directive: taxonomyTreeMap', function () {

  // load the directive's module
  beforeEach(module('dashboardApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<taxonomy-tree-map></taxonomy-tree-map>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the taxonomyTreeMap directive');
  }));
});
