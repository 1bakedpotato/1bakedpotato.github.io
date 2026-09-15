/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/libs/sqlite3blobfs.ts"
/*!***********************************!*\
  !*** ./src/libs/sqlite3blobfs.ts ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   installBlobVfs: () => (/* binding */ installBlobVfs)
/* harmony export */ });
function installBlobVfs(sqlite3, source, vfsName = 'blob-vfs') {
    const { capi, wasm } = sqlite3;
    // Normalise source into a Map<string, Blob>
    const blobs = normaliseSource(source);
    const reader = new FileReaderSync();
    // Per-open-file state, keyed by sqlite3_file* pointer (a number)
    const openFiles = new Map();
    // io-methods
    const ioMethods = new capi.sqlite3_io_methods();
    // iVersion=1 is sufficient; versions 2/3 add shm and fetch extensions
    ioMethods.iVersion = 1;
    // vfs struct
    const vfsStruct = new capi.sqlite3_vfs();
    vfsStruct.$iVersion = 2; // exposes xCurrentTimeInt64
    vfsStruct.$szOsFile = capi.sqlite3_file.prototype.structInfo.sizeof;
    vfsStruct.$mxPathname = 512;
    // register everything
    sqlite3.vfs.installVfs({
        io: {
            struct: ioMethods,
            methods: {
                xClose (pFile) {
                    openFiles.delete(pFile);
                    return 0;
                },
                xRead (pFile, pDest, n, offset64) {
                    const f = openFiles.get(pFile);
                    if (!f) return capi.SQLITE_IOERR_READ;
                    const offset = Number(offset64);
                    const slice = f.blob.slice(offset, offset + n);
                    const buf = new Uint8Array(reader.readAsArrayBuffer(slice));
                    wasm.heap8u().set(buf, Number(pDest));
                    if (buf.length < n) {
                        // SQLite requires the remainder to be zeroed on a short read
                        wasm.heap8u().fill(0, Number(pDest) + buf.length, Number(pDest) + n);
                        return capi.SQLITE_IOERR_SHORT_READ;
                    }
                    return 0;
                },
                // Read-only — writes are not supported
                xWrite (pFile, pSrc, n, offset64) {
                    return capi.SQLITE_READONLY;
                },
                xTruncate (pFile, sz64) {
                    return capi.SQLITE_READONLY;
                },
                xSync (pFile, flags) {
                    return 0;
                },
                xFileSize (pFile, pSz64) {
                    const f = openFiles.get(pFile);
                    if (!f) return capi.SQLITE_IOERR;
                    wasm.poke(pSz64, f.blob.size, 'i64');
                    return 0;
                },
                xLock (pFile, lockType) {
                    return 0;
                },
                xUnlock (pFile, lockType) {
                    return 0;
                },
                xCheckReservedLock (pFile, pOut) {
                    wasm.poke32(pOut, 0);
                    return 0;
                },
                xFileControl (pFile, opId, pArg) {
                    return capi.SQLITE_NOTFOUND;
                },
                // xSectorSize(pFile: SqlitePointer) { return 4096 as any; },
                // IMMUTABLE tells SQLite the file will never change externally,
                // suppressing WAL and journal probing
                xDeviceCharacteristics (pFile) {
                    return capi.SQLITE_IOCAP_IMMUTABLE;
                }
            }
        },
        vfs: {
            struct: vfsStruct,
            name: vfsName,
            asDefault: false,
            methods: {
                xOpen (pVfs, zName, pFile, flags, pOutFlags) {
                    const filename = zName ? wasm.cstrToJs(zName) : null;
                    // Journal/WAL opens are impossible on an immutable blob
                    const isMain = !!(flags & capi.SQLITE_OPEN_MAIN_DB);
                    if (!isMain) return capi.SQLITE_CANTOPEN;
                    const blob = resolveBlob(blobs, filename);
                    if (!blob) return capi.SQLITE_CANTOPEN;
                    openFiles.set(pFile, {
                        blob,
                        filename
                    });
                    new capi.sqlite3_file(pFile).$pMethods = ioMethods.pointer;
                    wasm.poke32(pOutFlags, flags);
                    return 0;
                },
                xDelete (pVfs, zName, doSyncDir) {
                    return 0;
                },
                xAccess (pVfs, zName, flags, pOut) {
                    // Report every filename as accessible so SQLite doesn't abort
                    wasm.poke32(pOut, 1);
                    return 0;
                },
                xFullPathname (pVfs, zName, nOut, pOut) {
                    // Pass the name through unchanged; bail if it doesn't fit
                    return wasm.cstrncpy(pOut, zName, nOut) < nOut ? 0 : capi.SQLITE_CANTOPEN;
                },
                xCurrentTime (pVfs, pOut) {
                    // Julian day number
                    wasm.poke(pOut, 2440587.5 + Date.now() / 86400000, 'double');
                    return 0;
                },
                xCurrentTimeInt64 (pVfs, pOut) {
                    // Julian milliseconds (sqlite3 internal scale)
                    wasm.poke64(pOut, BigInt(2440587.5 * 86400000 + Date.now()));
                    return 0;
                },
                xGetLastError (pVfs, nOut, pOut) {
                    return 0;
                }
            }
        }
    });
    return {
        blobs,
        name: vfsName,
        // open a database from a registered blob
        open (filename) {
            return new sqlite3.oo1.DB({
                filename: filename ?? firstKey(blobs),
                vfs: vfsName,
                flags: 'r'
            });
        }
    };
}
// helpers
function normaliseSource(source) {
    if (source instanceof Blob) {
        return new Map([
            [
                'blob',
                source
            ]
        ]);
    }
    if (source instanceof Map) {
        return source;
    }
    // plain object
    return new Map(Object.entries(source));
}
function resolveBlob(blobs, filename) {
    if (!filename) return blobs.values().next().value ?? null;
    return blobs.get(filename) ?? null;
}
function firstKey(map) {
    return map.keys().next().value ?? 'blob';
}


/***/ },

/***/ "./src/libs/sqlite3worker.ts"
/*!***********************************!*\
  !*** ./src/libs/sqlite3worker.ts ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _sqlite3wrap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./sqlite3wrap */ "./src/libs/sqlite3wrap.ts");

let idcounter = 1;
let opentables = new Map();
let openstatements = new Map();
async function onMessage(e) {
    let id = e.data.id;
    let packet = e.data.packet;
    try {
        if (packet.type == "sqliteopen") {
            postMessage({
                id,
                data: await sqliteOpen(packet)
            });
        } else if (packet.type == "sqliteexec") {
            postMessage({
                id,
                data: await sqliteExec(packet)
            });
        } else if (packet.type == "sqliteprepare") {
            postMessage({
                id,
                data: await sqlitePrepare(packet)
            });
        } else if (packet.type == "sqliterunprepared") {
            postMessage({
                id,
                data: await sqliteRunPrepared(packet)
            });
        } else if (packet.type == "sqliteclose") {
            postMessage({
                id,
                data: await sqliteClose(packet)
            });
        } else {
            throw new Error(`unknown packet type ${packet.type}`);
        }
    } catch (e) {
        postMessage({
            id,
            error: e.message
        });
    }
}
// if used as dedicated worker
self.addEventListener("message", onMessage);
console.log("worker started");
async function sqliteOpen(packet) {
    let entry = opentables.values().find((q)=>q.name == packet.dbname);
    if (!entry) {
        entry = {
            refs: 0,
            name: packet.dbname,
            id: idcounter++,
            backend: await _sqlite3wrap__WEBPACK_IMPORTED_MODULE_0__.AbstractSQLiteWasm.create(packet.dbname, packet.file)
        };
        opentables.set(entry.id, entry);
    }
    entry.refs++;
    return entry.id;
}
async function sqliteExec(packet) {
    let entry = opentables.get(packet.dbid);
    if (!entry) {
        throw new Error(`no such dbid ${packet.dbid}`);
    }
    await entry.backend.exec(packet.query);
}
async function sqlitePrepare(packet) {
    let entry = opentables.get(packet.dbid);
    if (!entry) {
        throw new Error(`no such dbid ${packet.dbid}`);
    }
    let stmt = await entry.backend.prepare(packet.query);
    let stmtid = idcounter++;
    openstatements.set(stmtid, {
        id: stmtid,
        dbid: packet.dbid,
        originalquery: packet.query,
        backend: stmt
    });
    return stmtid;
}
async function sqliteRunPrepared(packet) {
    let entry = openstatements.get(packet.queryid);
    if (!entry) {
        throw new Error(`no such queryid ${packet.queryid}`);
    }
    return entry.backend.run(...packet.args);
}
async function sqliteClose(packet) {
    let entry = opentables.get(packet.dbid);
    if (!entry) {
        throw new Error(`no such dbid ${packet.dbid}`);
    }
    entry.refs--;
    if (entry.refs <= 0) {
        await entry.backend.close();
        opentables.delete(packet.dbid);
    }
}


/***/ },

/***/ "./src/libs/sqlite3wrap.ts"
/*!*********************************!*\
  !*** ./src/libs/sqlite3wrap.ts ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AbstractSQLite: () => (/* binding */ AbstractSQLite),
/* harmony export */   AbstractSQLiteNode: () => (/* binding */ AbstractSQLiteNode),
/* harmony export */   AbstractSQLiteStatement: () => (/* binding */ AbstractSQLiteStatement),
/* harmony export */   AbstractSQLiteWasm: () => (/* binding */ AbstractSQLiteWasm),
/* harmony export */   AbstractSQLiteWorker: () => (/* binding */ AbstractSQLiteWorker),
/* harmony export */   WasmSQLiteManager: () => (/* binding */ WasmSQLiteManager)
/* harmony export */ });
/* harmony import */ var _sqlite3blobfs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./sqlite3blobfs */ "./src/libs/sqlite3blobfs.ts");
/* harmony import */ var fs_promises__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! fs/promises */ "fs/promises");
/* harmony import */ var fs_promises__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(fs_promises__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! path */ "path");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils */ "./src/utils.ts");




const nodecachefolder = "./cache";
class AbstractSQLiteStatement {
}
class AbstractSQLite {
    async transaction(trans) {
        await this.exec("BEGIN TRANSACTION");
        try {
            await trans();
            await this.exec("COMMIT");
        } catch (e) {
            await this.exec("ROLLBACK");
            throw e;
        }
    }
    static createAutoCache(filename) {
        if (!!(fs_promises__WEBPACK_IMPORTED_MODULE_1___default().constants)) {
            // nodejs
            return AbstractSQLiteNode.create(filename, {
                write: true,
                create: true
            });
        } else {
            // web
            return AbstractSQLiteWorker.create(filename);
        }
    }
}
class AbstractSQLiteNode extends AbstractSQLite {
    db = null;
    constructor(){
        super();
    }
    static async create(filename, opts) {
        let db = new AbstractSQLiteNode();
        //only actually load the dependency when used
        let sqlite = require("sqlite3");
        let flags = (opts.write ? sqlite.OPEN_READWRITE : sqlite.OPEN_READONLY) | (opts.create ? sqlite.OPEN_CREATE : 0);
        await fs_promises__WEBPACK_IMPORTED_MODULE_1___default().mkdir(nodecachefolder, {
            recursive: true
        });
        let fullfilename = path__WEBPACK_IMPORTED_MODULE_2___default().join(nodecachefolder, filename);
        db.db = await new Promise((done, err)=>{
            let res = new sqlite.Database(fullfilename, flags, (e)=>e ? err(e) : done(res));
        });
        return db;
    }
    async exec(query) {
        return new Promise((done, err)=>{
            this.db.exec(query, (e)=>e ? err(e) : done());
        });
    }
    async prepare(query) {
        return new Promise((done, err)=>{
            let stmt = this.db.prepare(query, (e)=>e ? err(e) : done(new AbstractSQLiteNodeStatement(stmt)));
        });
    }
    async close() {
        return new Promise((done, err)=>{
            this.db.close((e)=>e ? err(e) : done());
        });
    }
}
class AbstractSQLiteNodeStatement extends AbstractSQLiteStatement {
    stmt;
    constructor(stmt){
        super();
        this.stmt = stmt;
    }
    async run(...args) {
        return new Promise((done, err)=>{
            this.stmt.all(args, (e, rows)=>e ? err(e) : done(rows));
        });
    }
}
// This entire class is needed to support multi-tab access to the same OPFS database.
// There are many experimental ways to support this but as of aug 2026 they all have one flaw or another
// - can't use SharedWorker because it doesn't support synchronous file access
//   - this is a completely arbitrary limitation of the spec, but it is what it is
//   - in theory async wasm now exists, but there are no existing implementations
// - FileSystemHandles in chrome support unsafe-readwrite, but not in firefox, and there are no sqlite implmementations (requires a lot of custom locking)
// - in theory sqlite-wasm has a multi-tab safe implementation, but it requires SharedArrayBuffer and cross-origin isolation, which limits portability
// - could have one tab "own" the database and other tabs orchestrate messagechannels to it
// 
// this implementation simply only lets one tab access the OPFS file at a time
// A tab signals its intent to access the database by "stealing" the stealer lock. This notifies the current holder of
// that lock which will in turn wind down its access, close the database and release the holder lock.
class PausableSqliteWasmBackend {
    sqlite;
    name;
    lockholdername;
    lockstealername;
    pool = null;
    statements = new Set();
    lockState = null;
    constructor(sqlite, name){
        this.sqlite = sqlite;
        this.name = name;
        this.lockholdername = `db-hold-${name}`;
        this.lockstealername = `db-steal-${name}`;
    }
    static async createSAHPoolDb(name) {
        // sqlitewasm does NOT return the same instance on multiple inits, need to reuse it to prevent locking issues and multiple wasms
        sqliteWasmPromise ??= __webpack_require__.e(/*! import() */ "vendors-node_modules_sqlite_org_sqlite-wasm_dist_node_mjs").then(__webpack_require__.bind(__webpack_require__, /*! @sqlite.org/sqlite-wasm */ "./node_modules/@sqlite.org/sqlite-wasm/dist/node.mjs")).then((q)=>q.default());
        let sqlite = await sqliteWasmPromise;
        let db = new PausableSqliteWasmBackend(sqlite, name);
        return db;
    }
    static async createBlobDb(name, blob) {
        // sqlitewasm does NOT return the same instance on multiple inits, need to reuse it to prevent locking issues and multiple wasms
        sqliteWasmPromise ??= __webpack_require__.e(/*! import() */ "vendors-node_modules_sqlite_org_sqlite-wasm_dist_node_mjs").then(__webpack_require__.bind(__webpack_require__, /*! @sqlite.org/sqlite-wasm */ "./node_modules/@sqlite.org/sqlite-wasm/dist/node.mjs")).then((q)=>q.default());
        let sqlite = await sqliteWasmPromise;
        let vfsname = `${Math.random()}-${name}`;
        let db = new PausableSqliteWasmBackend(sqlite, vfsname);
        let blobfs = (0,_sqlite3blobfs__WEBPACK_IMPORTED_MODULE_0__.installBlobVfs)(sqlite, blob, vfsname);
        let dbInstance = blobfs.open();
        db.lockState = {
            unlock: Promise.withResolvers(),
            ready: Promise.withResolvers(),
            entrants: new Set(),
            db: null
        };
        db.lockState.ready.resolve(dbInstance);
        return db;
    }
    obtainAccess() {
        if (this.lockState) {
            return this.lockState;
        }
        // state of out access/request for access
        this.lockState = {
            unlock: Promise.withResolvers(),
            ready: Promise.withResolvers(),
            entrants: new Set(),
            db: null
        };
        let state = this.lockState;
        // post notification to current holder that we want the database
        console.log("requesting lock", this.name);
        let requestlock = navigator.locks.request(this.lockstealername, {
            mode: "exclusive",
            steal: true
        }, ()=>new Promise(()=>null));
        // queue for the actual lock
        navigator.locks.request(this.lockholdername, {
            mode: "exclusive"
        }, async ()=>{
            console.log("obtained lock", this.name);
            let pool = this.pool ??= await this.sqlite.installOpfsSAHPoolVfs({
                name: this.name,
                directory: this.name
            });
            await pool.unpauseVfs();
            console.log("opening database", this.name);
            state.db = new pool.OpfsSAHPoolDb(this.name);
            state.ready.resolve(state.db);
            let timeslice = (0,_utils__WEBPACK_IMPORTED_MODULE_3__.delay)(500);
            // someone else requested the lock, we need to wind down and release it
            requestlock.catch(async ()=>{
                await timeslice;
                // stop accepting tasks, finish all actions and release the lock
                console.log("release request received for lock", this.name);
                this.lockState = null;
                Promise.all([
                    ...state.entrants
                ]).finally(async ()=>{
                    this.statements.forEach((stmt)=>stmt.finalize());
                    this.statements.clear();
                    state.db?.close();
                    console.log("closed", this.name, "isopen", state.db?.isOpen());
                    state.db = null;
                    pool.pauseVfs();
                    console.log("releasing lock for", this.name);
                    state.unlock.resolve();
                });
            });
            return state.unlock.promise;
        });
        return this.lockState;
    }
    lockedAction(callback) {
        let state = this.obtainAccess();
        let prom = state.ready.promise.then((db)=>{
            let prom = callback(db);
            state.entrants.add(prom);
            prom.finally(()=>state.entrants.delete(prom));
            return prom;
        });
        state.entrants.add(prom);
        return prom;
    }
    async free() {
        this.lockState?.db?.close();
        await this.pool?.removeVfs();
    }
}
let sqliteWasmPromise = null;
class AbstractSQLiteWasm extends AbstractSQLite {
    db = null;
    manager;
    constructor(manager){
        super();
        this.manager = manager;
    }
    static async create(dbname, file) {
        if (file instanceof Blob) {
            let backend = await PausableSqliteWasmBackend.createBlobDb(dbname, file);
            return new AbstractSQLiteWasm(backend);
        } else {
            let backend = await PausableSqliteWasmBackend.createSAHPoolDb(dbname);
            return new AbstractSQLiteWasm(backend);
        }
    }
    async exec(query) {
        return this.manager.lockedAction(async (db)=>{
            db.exec(query);
        });
    }
    async prepare(query) {
        return new AbstractSQLiteWasmStatement(this, query);
    }
    async transaction(trans) {
        return this.manager.lockedAction(()=>super.transaction(trans));
    }
    async close() {
        await this.manager.free();
    }
}
class AbstractSQLiteWasmStatement extends AbstractSQLiteStatement {
    db;
    sqltext;
    implementation = null;
    constructor(db, sqltext){
        super();
        this.db = db;
        this.sqltext = sqltext;
    }
    run(...args) {
        return this.db.manager.lockedAction(async (db)=>{
            // the database might have been reopened since the last time
            if (!this.implementation || this.implementation.db !== db) {
                let stmt = db.prepare(this.sqltext);
                this.db.manager.statements.add(stmt);
                // bug in sqlite-wasm: stmt.getColumnNames() throws if columnCount=0
                let columns = stmt.columnCount == 0 ? [] : stmt.getColumnNames();
                this.implementation = {
                    db,
                    stmt,
                    columns
                };
            }
            let imp = this.implementation;
            let rows = [];
            try {
                if (imp.stmt.parameterCount != 0) {
                    imp.stmt.bind(args);
                }
                while(imp.stmt.step()){
                    let obj = {};
                    for(let i = 0; i < imp.columns.length; i++){
                        obj[imp.columns[i]] = imp.stmt.get(i);
                    }
                    rows.push(obj);
                }
            } finally{
                imp.stmt.reset();
            }
            return rows;
        });
    }
}
class WasmSQLiteManager {
    callbacks = new Map();
    worker;
    msgidcounter = 1;
    refcount = 0;
    constructor(){
        this.worker = new __webpack_require__.wc(new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u("src_libs_sqlite3worker_ts-src_libs_sqlite3wrap_ts-node_module"), __webpack_require__.b));
        this.worker.onmessage = (e)=>{
            let handler = this.callbacks.get(e.data.id);
            if (e.data.error) {
                if (handler) {
                    let err = e.data.error;
                    handler.reject(new Error(err));
                }
            } else {
                handler?.resolve(e.data.data);
            }
            this.callbacks.delete(e.data.id);
        };
    }
    static instance = null;
    static getInstance() {
        if (!this.instance) {
            this.instance = new WasmSQLiteManager();
        }
        this.instance.refcount++;
        return this.instance;
    }
    call(packet) {
        let id = this.msgidcounter++;
        this.worker.postMessage({
            id,
            packet
        });
        let prom = Promise.withResolvers();
        this.callbacks.set(id, prom);
        return prom.promise;
    }
    deref() {
        this.refcount--;
        if (this.refcount <= 0) {
            this.worker.terminate();
            WasmSQLiteManager.instance = null;
        }
    }
}
class AbstractSQLiteWorker extends AbstractSQLite {
    worker = WasmSQLiteManager.getInstance();
    dbid = -1;
    constructor(){
        super();
    }
    static async create(uniquename, file) {
        let db = new AbstractSQLiteWorker();
        db.dbid = await db.worker.call({
            type: "sqliteopen",
            dbname: uniquename,
            file,
            write: false,
            create: false
        });
        return db;
    }
    async exec(query) {
        return this.worker.call({
            type: "sqliteexec",
            dbid: this.dbid,
            query
        });
    }
    async prepare(query) {
        let stmtid = await this.worker.call({
            type: "sqliteprepare",
            dbid: this.dbid,
            query
        });
        return new AbstractSQLiteWorkerStatement(this.worker, stmtid);
    }
    async close() {
        return this.worker.call({
            type: "sqliteclose",
            dbid: this.dbid
        });
    }
}
class AbstractSQLiteWorkerStatement extends AbstractSQLiteStatement {
    stmtid;
    worker;
    constructor(worker, stmtid){
        super();
        this.worker = worker;
        this.stmtid = stmtid;
    }
    async run(...args) {
        return this.worker.call({
            type: "sqliterunprepared",
            queryid: this.stmtid,
            args
        });
    }
}


/***/ },

/***/ "./src/utils.ts"
/*!**********************!*\
  !*** ./src/utils.ts ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BlobTS: () => (/* binding */ BlobTS),
/* harmony export */   CallbackPromise: () => (/* binding */ CallbackPromise),
/* harmony export */   FetchThrottler: () => (/* binding */ FetchThrottler),
/* harmony export */   HSL2RGB: () => (/* binding */ HSL2RGB),
/* harmony export */   HSL2RGBfloat: () => (/* binding */ HSL2RGBfloat),
/* harmony export */   HSL2packHSL: () => (/* binding */ HSL2packHSL),
/* harmony export */   IterableWeakMap: () => (/* binding */ IterableWeakMap),
/* harmony export */   RGB2HSL: () => (/* binding */ RGB2HSL),
/* harmony export */   Stream: () => (/* binding */ Stream),
/* harmony export */   TypedEmitter: () => (/* binding */ TypedEmitter),
/* harmony export */   WeakRefMap: () => (/* binding */ WeakRefMap),
/* harmony export */   arrayEnum: () => (/* binding */ arrayEnum),
/* harmony export */   cacheFilenameHash: () => (/* binding */ cacheFilenameHash),
/* harmony export */   checkObject: () => (/* binding */ checkObject),
/* harmony export */   constrainedMap: () => (/* binding */ constrainedMap),
/* harmony export */   delay: () => (/* binding */ delay),
/* harmony export */   escapeHTML: () => (/* binding */ escapeHTML),
/* harmony export */   findParentElement: () => (/* binding */ findParentElement),
/* harmony export */   flipEndian16: () => (/* binding */ flipEndian16),
/* harmony export */   getOrInsert: () => (/* binding */ getOrInsert),
/* harmony export */   hex2hsl: () => (/* binding */ hex2hsl),
/* harmony export */   hsl2hex: () => (/* binding */ hsl2hex),
/* harmony export */   packComponent: () => (/* binding */ packComponent),
/* harmony export */   packCoordgrid: () => (/* binding */ packCoordgrid),
/* harmony export */   packFrameid: () => (/* binding */ packFrameid),
/* harmony export */   packMapsquare: () => (/* binding */ packMapsquare),
/* harmony export */   packedHSL2HSL: () => (/* binding */ packedHSL2HSL),
/* harmony export */   posmod: () => (/* binding */ posmod),
/* harmony export */   prettyFileSize: () => (/* binding */ prettyFileSize),
/* harmony export */   rsmarkupToSafeHtml: () => (/* binding */ rsmarkupToSafeHtml),
/* harmony export */   stringToFileRange: () => (/* binding */ stringToFileRange),
/* harmony export */   stringToMapArea: () => (/* binding */ stringToMapArea),
/* harmony export */   taskTrickler: () => (/* binding */ taskTrickler),
/* harmony export */   trickleTasks: () => (/* binding */ trickleTasks),
/* harmony export */   trickleTasksTwoStep: () => (/* binding */ trickleTasksTwoStep),
/* harmony export */   unpackComponent: () => (/* binding */ unpackComponent),
/* harmony export */   unpackCoordgrid: () => (/* binding */ unpackCoordgrid),
/* harmony export */   unpackDBTableField: () => (/* binding */ unpackDBTableField),
/* harmony export */   unpackFrameid: () => (/* binding */ unpackFrameid),
/* harmony export */   unpackMapsquare: () => (/* binding */ unpackMapsquare),
/* harmony export */   ushortToHalf: () => (/* binding */ ushortToHalf)
/* harmony export */ });
// fix typings conflict between nodejs Buffer typings and browser arraybuffer typings
const BlobTS = Blob;
function checkObject(obj, props) {
    if (!obj || typeof obj != "object") {
        return null;
    }
    let res = {};
    for (let [key, type] of Object.entries(props)){
        if (!(key in obj)) {
            return null;
        }
        let prop = obj[key];
        if (type == "numberarray") {
            if (!Array.isArray(prop)) {
                return null;
            }
            if (prop.some((v)=>typeof v != "number")) {
                return null;
            }
            res[key] = prop.slice();
        } else {
            if (typeof prop != type) {
                return null;
            }
            res[key] = prop;
        }
    }
    return res;
}
function cacheFilenameHash(name, oldhash) {
    let hash = 0;
    if (oldhash) {
        name = name.toUpperCase();
        for (let ch of name){
            hash = Math.imul(hash, 61) + ch.charCodeAt(0) - 32 | 0;
        }
    } else {
        for (let ch of name){
            hash = ((hash << 5) - hash | 0) + ch.charCodeAt(0) | 0;
        }
    }
    return hash >>> 0; //cast to u32
}
function stringToMapArea(str) {
    let [x, z, xsize, zsize] = str.split(/[,\.\/:;]/).map((n)=>+n);
    xsize = xsize ?? 1;
    zsize = zsize ?? xsize;
    if (isNaN(x) || isNaN(z) || isNaN(xsize) || isNaN(zsize)) {
        return null;
    }
    return {
        x,
        z,
        xsize,
        zsize
    };
}
function stringToFileRange(str) {
    let parts = str.split(",");
    let ranges = parts.map((q)=>{
        let ends = q.split("-");
        let start = ends[0] ? ends[0].split(".") : [];
        let end = ends[0] || ends[1] ? (ends[1] ?? ends[0]).split(".") : [];
        return {
            start: [
                +(start[0] ?? 0),
                +(start[1] ?? 0),
                +(start[2] ?? 0)
            ],
            end: [
                +(end[0] ?? Infinity),
                +(end[1] ?? Infinity),
                +(end[2] ?? Infinity)
            ]
        };
    });
    return ranges;
}
//weird generics on fallback to force ts to use the stricter type provided by map
function getOrInsert(map, key, fallback) {
    let val = map.get(key);
    if (val === undefined) {
        val = fallback();
        map.set(key, val);
    }
    return val;
}
function delay(ms) {
    return new Promise((d)=>{
        setTimeout(d, ms);
    });
}
function posmod(x, n) {
    return (x % n + n) % n;
}
function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function rsmarkupToSafeHtml(str) {
    let res = "";
    let tokenstack = [];
    try {
        while(str){
            let token = str.match(/<(\/?)(\w+)(=(\w+))?>/);
            if (!token) {
                res += escapeHTML(str);
                str = "";
            } else {
                res += escapeHTML(str.slice(0, token.index));
                str = str.slice(token.index + token[0].length);
                let isclose = !!token[1];
                let tagname = token[2];
                if (isclose) {
                    let last = tokenstack.pop();
                    if (last != tagname) {
                        throw new Error("markup token mismatch");
                    }
                    if (last == "col") {
                        res += "</span>";
                    } else {
                        throw new Error("unknown markup closing token " + last);
                    }
                } else if (tagname == "br") {
                    res += "<br/>";
                } else if (tagname == "col") {
                    res += `<span style="color:#${token[4].replace(/\W/g, "")};">`;
                    tokenstack.push("col");
                } else {
                    throw new Error("unknown token " + tagname);
                }
            }
        }
        while(tokenstack.length != 0){
            let token = tokenstack.pop();
            if (token == "col") {
                res += "</span>";
            } else {
                throw new Error("non-autocloseable token left unclosed " + token);
            }
        }
    } catch (e) {
        console.log(e.message);
        res = escapeHTML(str);
    }
    return res;
}
/**
 * used to get an array with enum typing
 */ function arrayEnum(v) {
    return v;
}
/**
 * Used to provide literal typing of map keys while also constraining each value
 */ function constrainedMap() {
    return function(v) {
        return v;
    };
}
const Stream = function Stream(data, scan = 0) {
    // Double check the mime type
    /*if (data[data.length - 4] != 0x4F) // O
		return null;
	else if (data[data.length - 3] != 0x42) // B
		return null;
	else if (data[data.length - 2] != 0x58) // X
		return null;
	else if (data[data.length - 1] != 0x33) // 3
		return null;*/ this.getData = function() {
        return data;
    };
    this.bytesLeft = function() {
        return data.length - scan;
    };
    this.readBuffer = function(len = data.length - scan) {
        let res = data.slice(scan, scan + len);
        scan += len;
        return res;
    };
    this.tee = function() {
        return new Stream(data, scan);
    };
    this.eof = function() {
        if (scan > data.length) {
            throw new Error("reading past end of buffer");
        }
        return scan >= data.length;
    };
    this.skip = function(n) {
        scan += n;
        return this;
    };
    this.scanloc = function() {
        return scan;
    };
    this.readByte = function() {
        var val = this.readUByte();
        if (val > 127) return val - 256;
        return val;
    };
    this.readUShortSmart = function() {
        let byte0 = this.readUByte();
        if ((byte0 & 0x80) == 0) {
            return byte0;
        }
        let byte1 = this.readUByte();
        return (byte0 & 0x7f) << 8 | byte1;
    };
    this.readShortSmart = function() {
        let byte0 = this.readUByte();
        let byte0val = byte0 & 0x7f;
        byte0val = byte0 < 0x40 ? byte0 : byte0 - 0x80;
        if ((byte0 & 0x80) == 0) {
            return byte0val;
        }
        let byte1 = this.readUByte();
        return byte0val << 8 | byte1;
    };
    this.readShortSmartBias = function() {
        let byte0 = this.readUByte();
        if ((byte0 & 0x80) == 0) {
            return byte0 - 0x40;
        }
        let byte1 = this.readUByte();
        return ((byte0 & 0x7f) << 8 | byte1) - 0x4000;
    };
    this.readUIntSmart = function() {
        let byte0 = this.readUByte();
        let byte1 = this.readUByte();
        if ((byte0 & 0x80) == 0) {
            return byte0 << 8 | byte1;
        }
        let byte2 = this.readUByte();
        let byte3 = this.readUByte();
        return (byte0 & 0x7f) << 24 | byte1 << 16 | byte2 << 8 | byte3;
    };
    this.readUByte = function() {
        return data[scan++];
    };
    this.readShort = function(bigendian = false) {
        var val = this.readUShort(bigendian);
        if (val > 32767) return val - 65536;
        return val;
    };
    this.readTribyte = function() {
        let val = data.readIntBE(scan, 3);
        scan += 3;
        return val;
    };
    this.readUShort = function(bigendian = false) {
        if (bigendian) return data[scan++] << 8 & 0xFF00 | data[scan++];
        else return data[scan++] | data[scan++] << 8 & 0xFF00;
    };
    this.readUInt = function(bigendian = false) {
        if (bigendian) return (data[scan++] << 24 & 0xFF000000 | data[scan++] << 16 & 0xFF0000 | data[scan++] << 8 & 0xFF00 | data[scan++]) >>> 0;
        else return (data[scan++] | data[scan++] << 8 & 0xFF00 | data[scan++] << 16 & 0xFF0000 | data[scan++] << 24 & 0xFF000000) >>> 0;
    };
    this.readFloat = function(bigendian = false, signage = false) {
        var upper, mid, lower, exponent;
        if (bigendian) {
            exponent = data[scan++];
            lower = data[scan++] << 16 & 0xFF0000;
            mid = data[scan++] << 8 & 0xFF00;
            upper = data[scan++];
        } else {
            upper = data[scan++];
            mid = data[scan++] << 8 & 0xFF00;
            lower = data[scan++] << 16 & 0xFF0000;
            exponent = data[scan++];
        }
        var mantissa = upper | mid | lower;
        if (signage) {
            //console.log(exponent.toString(16), mantissa.toString(16));
            exponent = exponent << 1 & 0xFE;
            if ((mantissa & 0x800000) == 0x800000) exponent |= 0x1;
            mantissa &= 0x7FFFFF;
        //console.log(exponent.toString(16), mantissa.toString(16));
        }
        return (1.0 + mantissa * Math.pow(2.0, signage ? -23.0 : -24.0)) * Math.pow(2.0, exponent - 127.0);
    };
    this.readHalf = function(flip = false) {
        //TODO flip isn't even implemented?
        var upper = data[scan++];
        var lower = data[scan++];
        var mantissa = lower | upper << 8 & 0x0300;
        var exponent = upper >> 2 & 0x1F;
        mantissa = mantissa * Math.pow(2.0, -10.0) + (exponent == 0 ? 0.0 : 1.0);
        mantissa *= Math.pow(2.0, exponent - 15.0);
        if ((upper & 0x80) == 0x80) mantissa *= -1.0;
        return mantissa;
    };
/*var scan = data.length - 12;
	var imageScan = 0;
	var metadataScan = this.readInt();
	var modelScan = this.readInt();
	scan = modelScan;*/ };
function flipEndian16(u16) {
    return (u16 & 0xff) << 8 | (u16 & 0xff00) >>> 8;
}
//2 bytes interpreted as u16 BE to float16 LE
function ushortToHalf(bytes) {
    bytes = flipEndian16(bytes);
    let positive = (bytes & 0x8000) == 0;
    let exponent = (bytes & 0x7c00) >> 10;
    let mantissa = bytes & 0x03ff;
    let res = mantissa * Math.pow(2.0, -10.0) + (exponent == 0 ? 0.0 : 1.0);
    res *= Math.pow(2.0, exponent - 15.0);
    if (positive) {
        return res;
    }
    return -res;
}
// https://stackoverflow.com/a/9493060
function HSL2RGBfloat(hsl) {
    var h = hsl[0];
    var s = hsl[1];
    var l = hsl[2];
    var r, g, b;
    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [
        r,
        g,
        b
    ];
}
// https://stackoverflow.com/a/9493060
function HSL2RGB(hsl) {
    let rgb = HSL2RGBfloat(hsl);
    return [
        Math.round(rgb[0] * 255),
        Math.round(rgb[1] * 255),
        Math.round(rgb[2] * 255)
    ];
}
function RGB2HSL(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0;
    var s = 0;
    let l = (max + min) / 2;
    if (max != min) {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return [
        h,
        s,
        l
    ];
}
function HSL2packHSL(h, s, l) {
    if (h < 0) {
        h += 1;
    }
    return Math.round(h * 63) << 10 | Math.round(s * 7) << 7 | Math.round(l * 127);
}
function packedHSL2HSL(hsl) {
    var h = (hsl >> 10 & 0x3F) / 63.0;
    var s = (hsl >> 7 & 0x7) / 7.0;
    var l = (hsl & 0x7F) / 127.0;
    if (h > 0.5) h = h - 1.0;
    return [
        h,
        s,
        l
    ];
}
function hsl2hex(hsl) {
    let rgb = HSL2RGB(packedHSL2HSL(hsl));
    return `#${(rgb[0] << 16 | rgb[1] << 8 | rgb[2] << 0).toString(16).padStart(6, "0")}`;
}
function hex2hsl(hex) {
    let n = parseInt(hex.replace(/^#/, ""), 16);
    return HSL2packHSL(...RGB2HSL(n >> 16 & 0xff, n >> 8 & 0xff, n >> 0 & 0xff));
}
function unpackCoordgrid(coord) {
    let level = coord >> 28 & 0x3;
    let x = coord >> 14 & 0x3FFF;
    let z = coord & 0x3FFF;
    return {
        level,
        x,
        z
    };
}
function packCoordgrid(level, x, z) {
    return (level & 0x3) << 28 | (x & 0x3FFF) << 14 | z & 0x3FFF;
}
function unpackDBTableField(tablefield) {
    let dbtable = tablefield >> 12 & 0xffff;
    let columnid = tablefield >> 4 & 0xff;
    let subfield = tablefield & 0xf;
    return {
        dbtable,
        columnid,
        subfield
    };
}
function unpackComponent(comp) {
    let intf = comp >>> 16 & 0xFFFF;
    let sub = comp & 0xFFFF;
    return {
        intf,
        sub
    };
}
function packFrameid(file, index) {
    return file << 16 | index;
}
function unpackFrameid(value) {
    let file = value >>> 16 & 0xFFFF;
    let index = value & 0xFFFF;
    return {
        file,
        index
    };
}
function packComponent(intf, sub) {
    return intf << 16 | sub;
}
function packMapsquare(x, z) {
    const worldStride = 128;
    return z * worldStride + x;
}
function unpackMapsquare(mapsquare) {
    const worldStride = 128;
    let x = mapsquare % worldStride;
    let z = Math.floor(mapsquare / worldStride);
    return {
        x,
        z
    };
}
class TypedEmitter {
    listeners = {};
    on(event, listener) {
        let listeners = this.listeners[event] ?? (this.listeners[event] = new Set());
        listeners.add(listener);
    }
    once(event, listener) {
        let listeners = this.listeners[event] ?? (this.listeners[event] = new Set());
        let oncer = (v)=>{
            listeners.delete(oncer);
            listener(v);
        };
        listeners.add(oncer);
    }
    off(event, listener) {
        let listeners = this.listeners[event] ?? (this.listeners[event] = new Set());
        listeners.delete(listener);
    }
    emit(event, value) {
        let listeners = this.listeners[event] ?? (this.listeners[event] = new Set());
        listeners.forEach((cb)=>cb(value));
    }
}
//same as the new Promise.WithResolvers built-in (late 2023)
class CallbackPromise extends Promise {
    done;
    err;
    constructor(exe = (done, err)=>{}){
        //tmp vars since i can't access this during the super callback
        let tmpdone;
        let tmperr;
        super((done, err)=>{
            tmpdone = done;
            tmperr = err;
            return exe(done, err);
        });
        this.done = tmpdone;
        this.err = tmperr;
    }
}
//runs at most [parallel] async tasks at the same time
function trickleTasks(name, parallel, tasks) {
    let len = Array.isArray(tasks) ? tasks.length : -1;
    if (name) {
        console.log(`starting ${name}, ${len == -1 ? "??" : len} tasks`);
    }
    if (typeof tasks == "function") {
        tasks = tasks();
    }
    let iter = tasks[Symbol.iterator]();
    return new Promise((done)=>{
        let index = 0;
        let running = 0;
        let run = ()=>{
            let next = iter.next();
            if (!next.done) {
                next.value.finally(run);
                if (index % 100 == 0 && name) {
                    console.log(`${name} progress ${index}/${len == -1 ? "" : len}`);
                }
            } else {
                running--;
                if (running <= 0) {
                    if (name) {
                        console.log(`completed ${name}`);
                    }
                    done();
                }
            }
        };
        for(let i = 0; i < parallel; i++){
            running++;
            run();
        }
    });
}
//the second callback is guaranteed to be called in the same order as the tasks were queued
async function trickleTasksTwoStep(parallel, tasks, steptwo) {
    let writecounter = 0;
    let completecounter = 0;
    let queue = new Array(parallel).fill(null);
    for (let prom of tasks()){
        let index = writecounter++;
        queue[index % parallel] = prom;
        if (writecounter >= completecounter + parallel) {
            if (writecounter >= parallel) {
                let res = await queue[completecounter % parallel];
                completecounter++;
                steptwo(res);
            }
        }
    }
    while(completecounter < writecounter){
        let res = await queue[completecounter % parallel];
        completecounter++;
        steptwo(res);
    }
}
function taskTrickler(maxparallel = 1, delaytime = 1) {
    let stallindex = 0;
    let stall = new Array(maxparallel).fill(Promise.resolve());
    return function gate(task) {
        let res = stall[stallindex].then(()=>task());
        stall[stallindex] = res.finally(()=>{
            delaytime != 0 && delay(delaytime);
        });
        stallindex = (stallindex + 1) % maxparallel;
        return res;
    };
}
class FetchThrottler {
    reqQueue = [];
    activeReqs = 0;
    maxParallelReqs;
    constructor(maxParallelReqs){
        this.maxParallelReqs = maxParallelReqs;
    }
    //prevent overloading the server by using to many parallel requests
    async apiRequest(url, init, retrycount = 5, retrydelay = 1000) {
        if (this.activeReqs >= this.maxParallelReqs) {
            let prom = new CallbackPromise();
            this.reqQueue.push(prom.done);
            await prom;
        }
        this.activeReqs++;
        let res = null;
        try {
            //TODO get right typescript lib version for abortsignal.timeout
            res = await fetch(url, {
                signal: AbortSignal.timeout(init?.timeout ?? 1000 * 60),
                ...init
            });
        } catch (e) {
        //handled later
        } finally{
            this.activeReqs--;
            let stalled = this.reqQueue.shift();
            stalled?.();
        }
        if (!res || res.status == 503 || res.status == 429) {
            let retryheader = res?.headers.get("retry-after");
            let delaytime = retryheader && !isNaN(+retryheader) ? +retryheader : retrydelay;
            await delay(delaytime);
            return this.apiRequest(url, init, retrycount - 1, delaytime * 2);
        }
        return res;
    }
}
class IterableWeakMap {
    weakMap = new WeakMap();
    refSet = new Set();
    finalizationGroup = new FinalizationRegistry(IterableWeakMap.cleanup);
    static cleanup({ set, ref }) {
        set.delete(ref);
    }
    constructor(){}
    set(key, value) {
        const ref = new WeakRef(key);
        let prev = this.weakMap.get(key);
        if (prev) {
            this.refSet.delete(prev.ref);
        }
        this.weakMap.set(key, {
            value,
            ref
        });
        this.refSet.add(ref);
        this.finalizationGroup.register(key, {
            set: this.refSet,
            ref
        }, ref);
    }
    get(key) {
        const entry = this.weakMap.get(key);
        return entry && entry.value;
    }
    getOrInsert(key, data) {
        let entry = this.weakMap.get(key);
        if (entry) {
            return entry.value;
        }
        let val = data();
        this.set(key, val);
        return val;
    }
    delete(key) {
        const entry = this.weakMap.get(key);
        if (!entry) {
            return false;
        }
        this.weakMap.delete(key);
        this.refSet.delete(entry.ref);
        this.finalizationGroup.unregister(entry.ref);
        return true;
    }
    *[Symbol.iterator]() {
        for (const ref of this.refSet){
            const key = ref.deref();
            if (!key) continue;
            const { value } = this.weakMap.get(key);
            yield [
                key,
                value
            ];
        }
    }
    entries() {
        return this[Symbol.iterator]();
    }
    *keys() {
        for (const [key, value] of this){
            yield key;
        }
    }
    *values() {
        for (const [key, value] of this){
            yield value;
        }
    }
}
class WeakRefMap {
    map = new Map();
    registry = new FinalizationRegistry((k)=>this.map.delete(k));
    set(key, value) {
        let prev = this.map.get(key)?.deref();
        if (prev) {
            this.registry.unregister(prev);
        }
        this.map.set(key, new WeakRef(value));
        this.registry.register(value, key);
    }
    delete(key) {
        let prev = this.map.get(key)?.deref();
        if (prev) {
            this.map.delete(key);
            this.registry.unregister(prev);
        }
    }
    get(key) {
        return this.map.get(key)?.deref();
    }
    getOrDefault(key, create) {
        let v = this.map.get(key)?.deref();
        if (!v) {
            v = create();
            this.set(key, v);
        }
        return v;
    }
    *keys() {
        yield* this.map.keys();
    }
    *values() {
        for (const [k, v] of this){
            yield v;
        }
    }
    *[Symbol.iterator]() {
        for (const [k, ref] of this.map){
            const v = ref.deref();
            if (!v) continue;
            yield [
                k,
                v
            ];
        }
    }
}
function findParentElement(el, cond, fallback = null) {
    while(el){
        if (cond(el)) {
            return el;
        }
        el = el.parentElement;
    }
    return fallback;
}
function prettyFileSize(size) {
    if (size < 1024) {
        return size + " B";
    }
    if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + " KB";
    }
    if (size < 1024 * 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(2) + " MB";
    }
    return (size / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}


/***/ },

/***/ "fs/promises"
/*!******************************!*\
  !*** external "fs/promises" ***!
  \******************************/
(module) {

module.exports = require("fs/promises");

/***/ },

/***/ "node:module"
/*!******************************!*\
  !*** external "node:module" ***!
  \******************************/
(module) {

module.exports = require("node:module");

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
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
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
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		const getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		let leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			const ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			const def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; (typeof current == 'object' || typeof current == 'function') && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
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
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "generated/" + "7464ef0413ff8d3c7996" + ".js";
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
/******/ 	/* webpack/runtime/worker */
/******/ 	(() => {
/******/ 		__webpack_require__.wc = typeof Worker !== "undefined" ? Worker : typeof process !== "undefined" && typeof process.getBuiltinModule === "function" && process.getBuiltinModule("node:worker_threads").Worker;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		__webpack_require__.p = "";
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/require chunk loading */
/******/ 	(() => {
/******/ 		__webpack_require__.b = require("node:url").pathToFileURL(__dirname + "/../");
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "loaded", otherwise not loaded yet
/******/ 		const installedChunks = {
/******/ 			"src_libs_sqlite3worker_ts-src_libs_sqlite3wrap_ts-node_module": 1
/******/ 		};
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		const installChunk = (chunk) => {
/******/ 			const moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			for(var i = 0; i < chunkIds.length; i++)
/******/ 				installedChunks[chunkIds[i]] = 1;
/******/ 		
/******/ 		};
/******/ 		
/******/ 		// require() chunk loading for javascript
/******/ 		__webpack_require__.f.require = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					const installedChunk = require("../" + __webpack_require__.u(chunkId));
/******/ 					if (!installedChunks[chunkId]) {
/******/ 						installChunk(installedChunk);
/******/ 					}
/******/ 				} else installedChunks[chunkId] = 1;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no external install chunk
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	let __webpack_exports__ = __webpack_require__("./src/libs/sqlite3worker.ts");
/******/ 	const __webpack_export_target__ = exports;
/******/ 	for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
/******/ 	if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ 	
/******/ })()
;