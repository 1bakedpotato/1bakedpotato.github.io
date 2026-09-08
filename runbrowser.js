/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "electron"
/*!****************************************!*\
  !*** external {"commonjs":"electron"} ***!
  \****************************************/
(module) {

module.exports = require("electron");

/***/ },

/***/ "path"
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
(module) {

module.exports = require("path");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			const e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			const getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter/value functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			if(Array.isArray(definition)) {
/******/ 				var i = 0;
/******/ 				while(i < definition.length) {
/******/ 					var key = definition[i++];
/******/ 					var binding = definition[i++];
/******/ 					if(!__webpack_require__.o(exports, key)) {
/******/ 						if(binding === 0) {
/******/ 							Object.defineProperty(exports, key, { enumerable: true, value: definition[i++] });
/******/ 						} else {
/******/ 							Object.defineProperty(exports, key, { enumerable: true, get: binding });
/******/ 						}
/******/ 					} else if(binding === 0) { i++; }
/******/ 				}
/******/ 			} else {
/******/ 				for(var key in definition) {
/******/ 					if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 						Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
let __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!************************************!*\
  !*** ./src/headless/runbrowser.ts ***!
  \************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron */ "electron");
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! path */ "path");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);


//don't use browser behavoir of blocking gpu access after an opengl crash
electron__WEBPACK_IMPORTED_MODULE_0__.app.disableDomainBlockingFor3DAPIs();
//don't give up after 3 crashes! keep trying!
electron__WEBPACK_IMPORTED_MODULE_0__.app.commandLine.appendSwitch("disable-gpu-process-crash-limit");
//prevent electron from nerfing performance when the window isn't visible
//TODO should probably toggle only when rendering the map
electron__WEBPACK_IMPORTED_MODULE_0__.app.commandLine.appendSwitch("disable-renderer-backgrounding");
electron__WEBPACK_IMPORTED_MODULE_0__.app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
electron__WEBPACK_IMPORTED_MODULE_0__.app.commandLine.appendSwitch("disable-background-timer-throttling");
electron__WEBPACK_IMPORTED_MODULE_0__.app.commandLine.appendSwitch("js-flags", "--expose-gc --max-old-space-size=16384 --max-heap-size=16384");
//needed to read map imagedata from runeapps
electron__WEBPACK_IMPORTED_MODULE_0__.app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
//for some reason it very crashes very often if using embedded GPU
//so force dedicated GPU if available
// app.commandLine.appendSwitch("force_high_performance_gpu");//only works for mac
//forces dedicated gpu on windows
//https://stackoverflow.com/questions/54464276/how-to-force-discrete-gpu-in-electron-js/63668188#63668188
// process.env.SHIM_MCCOMPAT = '0x800000001';
let hidden = false;
let exitonend = false;
let watchdoglimit = 0; //ms, 0 to disable
let args = [];
let procargs = [];
let entry = "";
for(let i = 0; i < process.argv.length; i++){
    let arg = process.argv[i];
    if (procargs.length < 2) {
        //arguments for electron, script args start after 2 non-flag args, electron.exe and script.js
        if (!arg.startsWith("-")) {
            procargs.push(arg);
        }
    } else if (!entry) {
        //our own bootstrap flags, keep reading until get find the entry script
        if (arg.startsWith("-")) {
            if (arg == "--hidden") {
                hidden = true;
            }
            if (arg == "--exit") {
                exitonend = true;
            }
            if (arg == "--watchdog") {
                watchdoglimit = 10 * 60 * 1000;
            }
        } else {
            entry = arg;
        }
    } else {
        //finally the arguments to pass on to the script
        args.push(arg);
    }
}
let argv = [
    "electron.exe",
    entry,
    ...args
];
const js = `
document.body.style.background="white";
window.addEventListener("keydown", e => {
	if (e.key == "F5") { document.location.reload(); }
	if (e.key == "F12") { require("electron/renderer").ipcRenderer.send("toggledevtools"); }
});

process.chdir(${JSON.stringify(process.cwd())});
var originalcmd={
	argv:(${JSON.stringify(argv)}),
	cwd:(${JSON.stringify(process.cwd())})
};

let originallog=console.log.bind(console);
let originalwarn=console.warn.bind(console);
let originalerror=console.error.bind(console);

console.log=function(...args){
	require("electron/renderer").ipcRenderer.send("console","log",args.map(q=>q+""));
	originallog(...args);
}
console.warn=function(...args){
	require("electron/renderer").ipcRenderer.send("console","warn",args.map(q=>q+""));
	originalwarn(...args);
}
console.error=function(...args){
	require("electron/renderer").ipcRenderer.send("console","error",args.map(q=>q+""));
	originalerror(...args);
}
window.onerror=e=>console.error(e);
window.onunhandledrejection=e=>console.error(e);
window.onCliCompleted=(code)=>{
	require("electron/renderer").ipcRenderer.send("exit",code);
}
window.onWatchdogProgress=()=>{
	require("electron/renderer").ipcRenderer.send("watchdog");
}

require(${JSON.stringify(path__WEBPACK_IMPORTED_MODULE_1__.resolve(process.cwd(), entry))});
`;
console.log(path__WEBPACK_IMPORTED_MODULE_1__.resolve(process.cwd(), entry));
(async ()=>{
    await electron__WEBPACK_IMPORTED_MODULE_0__.app.whenReady();
    //prevents computer from sleeping
    const id = electron__WEBPACK_IMPORTED_MODULE_0__.powerSaveBlocker.start("prevent-app-suspension");
    //powerSaveBlocker.stop(id)
    let lastprogress = Date.now();
    electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.on("toggledevtools", ()=>index.webContents.toggleDevTools());
    electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.on("console", (e, type, args)=>{
        if (type == "error") {
            console.error("[renderer]", ...args);
        } else if (type == "warn") {
            console.warn("[renderer]", ...args);
        } else {
            console.log("[renderer]", ...args);
        }
    });
    electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.on("exit", (e, exitcode)=>{
        if (exitonend) {
            process.exit(exitcode);
        }
    });
    electron__WEBPACK_IMPORTED_MODULE_0__.ipcMain.on("watchdog", (e)=>{
        lastprogress = Date.now();
    });
    var index = new electron__WEBPACK_IMPORTED_MODULE_0__.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            //needed to disable CORS
            webSecurity: false,
            backgroundThrottling: false
        },
        paintWhenInitiallyHidden: true,
        show: !hidden
    });
    index.webContents.openDevTools();
    index.loadFile(`assets/headless.html`);
    // index.webContents.openDevTools();
    index.webContents.on("did-finish-load", ()=>{
        index.webContents.executeJavaScript(js);
    });
    electron__WEBPACK_IMPORTED_MODULE_0__.app.on("render-process-gone", (e, target, data)=>{
        console.log("render-process-gone", data);
        index.reload();
    });
    // watchdog to reload if no progress for a specified limit
    if (watchdoglimit > 0) {
        setInterval(()=>{
            if (Date.now() - lastprogress > watchdoglimit * 0.8) {
                console.warn(`watchdog warning: no progress for ${(Date.now() - lastprogress) / 1000} seconds`);
            }
            if (Date.now() - lastprogress > watchdoglimit) {
                console.warn(`no progress for ${watchdoglimit / 1000 / 60} minutes, reloading`);
                lastprogress = Date.now();
                index.reload();
            }
        }, 10000);
    }
})();

})();

const __webpack_export_target__ = exports;
for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;