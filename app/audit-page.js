import { fromObject } from '@nativescript/core';
import { Logger } from './logger';

export function onNavigatingTo(args) {
    const page = args.object;

    // Read the log array from the file system
    const auditLogs = Logger.getLogs();

    // Create an observable object context for the view
    const viewModel = fromObject({
        logs: auditLogs
    });

    page.bindingContext = viewModel;
}

export function onGoBack(args) {
    const frame = args.object.page.frame;
    frame.goBack();
}

export function onClearLogs(args) {
    const page = args.object.page;
    // Clear from file system
    Logger.clearLogs();

    // Clear from current context to update UI immediately
    page.bindingContext.set("logs", []);
}
