"use babel";

import { app, BrowserWindow } from 'electron';
import path from 'path'
require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

require('electron-context-menu')();

let mainWindow = null;

app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        app.quit();

    }
});

app.on('ready', () => {
    mainWindow = new BrowserWindow({ width: 900, height: 700 });
    mainWindow.setMenu(null);
    mainWindow.loadURL('file://' + __dirname + '/index.html');
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

app.on('browser-window-created', function(e, window) {
    window.setMenu(null);
});


process.on('uncaughtException', function(error) {
    // Handle the error
    console.error(error);
});
