// import { createViewModel } from './main-view-model-worker';
import { createViewModel } from './main-view-model';
import * as application from "@nativescript/core/application";

export function onNavigatingTo(args) {
  const page = args.object;
  page.bindingContext = createViewModel();
}

export function onPageLoaded(args) {
  // const page = args.object;
  // page.bindingContext = createViewModel();
}
