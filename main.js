/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "electron/main":
/*!*********************************************!*\
  !*** external {"commonjs":"electron/main"} ***!
  \*********************************************/
/***/ ((module) => {

module.exports = require("electron/main");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
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
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
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
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var electron_main__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron/main */ "electron/main");
/* harmony import */ var electron_main__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(electron_main__WEBPACK_IMPORTED_MODULE_0__);

//don't use browser behavoir of blocking gpu access after a opengl crash
electron_main__WEBPACK_IMPORTED_MODULE_0__.app.disableDomainBlockingFor3DAPIs();
//don't give up after 3 crashes! keep trying!
electron_main__WEBPACK_IMPORTED_MODULE_0__.app.commandLine.appendSwitch("disable-gpu-process-crash-limit");
electron_main__WEBPACK_IMPORTED_MODULE_0__.app.commandLine.appendSwitch("force_high_performance_gpu"); //only works for mac
//forces dedicated gpu on windows
//https://stackoverflow.com/questions/54464276/how-to-force-discrete-gpu-in-electron-js/63668188#63668188
process.env.SHIM_MCCOMPAT = '0x800000001';
electron_main__WEBPACK_IMPORTED_MODULE_0__.app.whenReady().then(async () => {
    var index = new electron_main__WEBPACK_IMPORTED_MODULE_0__.BrowserWindow({
        width: 800, height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    index.webContents.openDevTools();
    await index.loadFile(`assets/index.html`);
    electron_main__WEBPACK_IMPORTED_MODULE_0__.ipcMain.handle("openfolder", async (e, startfolder) => {
        return electron_main__WEBPACK_IMPORTED_MODULE_0__.dialog.showOpenDialog(index, { properties: ["openDirectory"], defaultPath: startfolder });
    });
});
electron_main__WEBPACK_IMPORTED_MODULE_0__.app.on("window-all-closed", () => {
    //prevent shutdown until all scripts are done
    //TODO allow some way to exit updater?
    // return;
    // MacOS stuff I guess?
    if (process.platform !== "darwin") {
        electron_main__WEBPACK_IMPORTED_MODULE_0__.app.quit();
    }
});

})();

var __webpack_export_target__ = exports;
for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;