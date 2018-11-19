'use strict';

/**
 * @ngdoc overview
 * @name dashboardApp
 * @description
 * # dashboardApp
 *
 * Main module of the application.
 */
angular
  .module('dashboardApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/pathogenic', {
        templateUrl: 'views/pathogenic.html',
        controller: 'PathogenicCtrl',
        controllerAs: 'pathogenic'
      })
      .when('/search', {
        templateUrl: 'views/search.html',
        controller: 'SearchCtrl',
        controllerAs: 'search'
      })
      .when('/ar', {
        templateUrl: 'views/ar.html',
        controller: 'ArCtrl',
        controllerAs: 'ar'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
