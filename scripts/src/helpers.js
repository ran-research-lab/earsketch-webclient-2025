import 'angular';

// TODO: Should replace the global ServiceWrapper in api/angular-wrappers.js
export const getNgService = (name) => angular.element(document).injector().get(name);

export const getNgController = (controllerName) => angular.element(document.querySelector(`[ng-controller="${controllerName}"]`));

export const getNgDirective = (directiveName) => angular.element(document.querySelector(`div[${directiveName}]`));