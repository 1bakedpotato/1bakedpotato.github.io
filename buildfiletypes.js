/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/json-schema/lib/validate.js"
/*!**************************************************!*\
  !*** ./node_modules/json-schema/lib/validate.js ***!
  \**************************************************/
(module, exports) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
 * JSONSchema Validator - Validates JavaScript objects using JSON Schemas
 *	(http://www.json.com/json-schema-proposal/)
 * Licensed under AFL-2.1 OR BSD-3-Clause
To use the validator call the validate function with an instance object and an optional schema object.
If a schema is provided, it will be used to validate. If the instance object refers to a schema (self-validating),
that schema will be used to validate and the schema parameter is not necessary (if both exist,
both validations will occur).
The validate method will return an array of validation errors. If there are no errors, then an
empty list will be returned. A validation error will have two properties:
"property" which indicates which property had the error
"message" which indicates what the error was
 */
(function (root, factory) {
    if (true) {
        // AMD. Register as an anonymous module.
        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {
            return factory();
        }).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    } else // removed by dead control flow
{}
}(this, function () {// setup primitive classes to be JSON Schema types
var exports = validate
exports.Integer = {type:"integer"};
var primitiveConstructors = {
	String: String,
	Boolean: Boolean,
	Number: Number,
	Object: Object,
	Array: Array,
	Date: Date
}
exports.validate = validate;
function validate(/*Any*/instance,/*Object*/schema) {
		// Summary:
		//  	To use the validator call JSONSchema.validate with an instance object and an optional schema object.
		// 		If a schema is provided, it will be used to validate. If the instance object refers to a schema (self-validating),
		// 		that schema will be used to validate and the schema parameter is not necessary (if both exist,
		// 		both validations will occur).
		// 		The validate method will return an object with two properties:
		// 			valid: A boolean indicating if the instance is valid by the schema
		// 			errors: An array of validation errors. If there are no errors, then an
		// 					empty list will be returned. A validation error will have two properties:
		// 						property: which indicates which property had the error
		// 						message: which indicates what the error was
		//
		return validate(instance, schema, {changing: false});//, coerce: false, existingOnly: false});
	};
exports.checkPropertyChange = function(/*Any*/value,/*Object*/schema, /*String*/property) {
		// Summary:
		// 		The checkPropertyChange method will check to see if an value can legally be in property with the given schema
		// 		This is slightly different than the validate method in that it will fail if the schema is readonly and it will
		// 		not check for self-validation, it is assumed that the passed in value is already internally valid.
		// 		The checkPropertyChange method will return the same object type as validate, see JSONSchema.validate for
		// 		information.
		//
		return validate(value, schema, {changing: property || "property"});
	};
var validate = exports._validate = function(/*Any*/instance,/*Object*/schema,/*Object*/options) {

	if (!options) options = {};
	var _changing = options.changing;

	function getType(schema){
		return schema.type || (primitiveConstructors[schema.name] == schema && schema.name.toLowerCase());
	}
	var errors = [];
	// validate a value against a property definition
	function checkProp(value, schema, path,i){

		var l;
		path += path ? typeof i == 'number' ? '[' + i + ']' : typeof i == 'undefined' ? '' : '.' + i : i;
		function addError(message){
			errors.push({property:path,message:message});
		}

		if((typeof schema != 'object' || schema instanceof Array) && (path || typeof schema != 'function') && !(schema && getType(schema))){
			if(typeof schema == 'function'){
				if(!(value instanceof schema)){
					addError("is not an instance of the class/constructor " + schema.name);
				}
			}else if(schema){
				addError("Invalid schema/property definition " + schema);
			}
			return null;
		}
		if(_changing && schema.readonly){
			addError("is a readonly field, it can not be changed");
		}
		if(schema['extends']){ // if it extends another schema, it must pass that schema as well
			checkProp(value,schema['extends'],path,i);
		}
		// validate a value against a type definition
		function checkType(type,value){
			if(type){
				if(typeof type == 'string' && type != 'any' &&
						(type == 'null' ? value !== null : typeof value != type) &&
						!(value instanceof Array && type == 'array') &&
						!(value instanceof Date && type == 'date') &&
						!(type == 'integer' && value%1===0)){
					return [{property:path,message:value + " - " + (typeof value) + " value found, but a " + type + " is required"}];
				}
				if(type instanceof Array){
					var unionErrors=[];
					for(var j = 0; j < type.length; j++){ // a union type
						if(!(unionErrors=checkType(type[j],value)).length){
							break;
						}
					}
					if(unionErrors.length){
						return unionErrors;
					}
				}else if(typeof type == 'object'){
					var priorErrors = errors;
					errors = [];
					checkProp(value,type,path);
					var theseErrors = errors;
					errors = priorErrors;
					return theseErrors;
				}
			}
			return [];
		}
		if(value === undefined){
			if(schema.required){
				addError("is missing and it is required");
			}
		}else{
			errors = errors.concat(checkType(getType(schema),value));
			if(schema.disallow && !checkType(schema.disallow,value).length){
				addError(" disallowed value was matched");
			}
			if(value !== null){
				if(value instanceof Array){
					if(schema.items){
						var itemsIsArray = schema.items instanceof Array;
						var propDef = schema.items;
						for (i = 0, l = value.length; i < l; i += 1) {
							if (itemsIsArray)
								propDef = schema.items[i];
							if (options.coerce)
								value[i] = options.coerce(value[i], propDef);
							errors.concat(checkProp(value[i],propDef,path,i));
						}
					}
					if(schema.minItems && value.length < schema.minItems){
						addError("There must be a minimum of " + schema.minItems + " in the array");
					}
					if(schema.maxItems && value.length > schema.maxItems){
						addError("There must be a maximum of " + schema.maxItems + " in the array");
					}
				}else if(schema.properties || schema.additionalProperties){
					errors.concat(checkObj(value, schema.properties, path, schema.additionalProperties));
				}
				if(schema.pattern && typeof value == 'string' && !value.match(schema.pattern)){
					addError("does not match the regex pattern " + schema.pattern);
				}
				if(schema.maxLength && typeof value == 'string' && value.length > schema.maxLength){
					addError("may only be " + schema.maxLength + " characters long");
				}
				if(schema.minLength && typeof value == 'string' && value.length < schema.minLength){
					addError("must be at least " + schema.minLength + " characters long");
				}
				if(typeof schema.minimum !== 'undefined' && typeof value == typeof schema.minimum &&
						schema.minimum > value){
					addError("must have a minimum value of " + schema.minimum);
				}
				if(typeof schema.maximum !== 'undefined' && typeof value == typeof schema.maximum &&
						schema.maximum < value){
					addError("must have a maximum value of " + schema.maximum);
				}
				if(schema['enum']){
					var enumer = schema['enum'];
					l = enumer.length;
					var found;
					for(var j = 0; j < l; j++){
						if(enumer[j]===value){
							found=1;
							break;
						}
					}
					if(!found){
						addError("does not have a value in the enumeration " + enumer.join(", "));
					}
				}
				if(typeof schema.maxDecimal == 'number' &&
					(value.toString().match(new RegExp("\\.[0-9]{" + (schema.maxDecimal + 1) + ",}")))){
					addError("may only have " + schema.maxDecimal + " digits of decimal places");
				}
			}
		}
		return null;
	}
	// validate an object against a schema
	function checkObj(instance,objTypeDef,path,additionalProp){

		if(typeof objTypeDef =='object'){
			if(typeof instance != 'object' || instance instanceof Array){
				errors.push({property:path,message:"an object is required"});
			}
			
			for(var i in objTypeDef){ 
				if(objTypeDef.hasOwnProperty(i) && i != '__proto__' && i != 'constructor'){
					var value = instance.hasOwnProperty(i) ? instance[i] : undefined;
					// skip _not_ specified properties
					if (value === undefined && options.existingOnly) continue;
					var propDef = objTypeDef[i];
					// set default
					if(value === undefined && propDef["default"]){
						value = instance[i] = propDef["default"];
					}
					if(options.coerce && i in instance){
						value = instance[i] = options.coerce(value, propDef);
					}
					checkProp(value,propDef,path,i);
				}
			}
		}
		for(i in instance){
			if(instance.hasOwnProperty(i) && !(i.charAt(0) == '_' && i.charAt(1) == '_') && objTypeDef && !objTypeDef[i] && additionalProp===false){
				if (options.filter) {
					delete instance[i];
					continue;
				} else {
					errors.push({property:path,message:"The property " + i +
						" is not defined in the schema and the schema does not allow additional properties"});
				}
			}
			var requires = objTypeDef && objTypeDef[i] && objTypeDef[i].requires;
			if(requires && !(requires in instance)){
				errors.push({property:path,message:"the presence of the property " + i + " requires that " + requires + " also be present"});
			}
			value = instance[i];
			if(additionalProp && (!(objTypeDef && typeof objTypeDef == 'object') || !(i in objTypeDef))){
				if(options.coerce){
					value = instance[i] = options.coerce(value, additionalProp);
				}
				checkProp(value,additionalProp,path,i);
			}
			if(!_changing && value && value.$schema){
				errors = errors.concat(checkProp(value,value.$schema,path,i));
			}
		}
		return errors;
	}
	if(schema){
		checkProp(instance,schema,'',_changing || '');
	}
	if(!_changing && instance && instance.$schema){
		checkProp(instance,instance.$schema,'','');
	}
	return {valid:!errors.length,errors:errors};
};
exports.mustBeValid = function(result){
	//	summary:
	//		This checks to ensure that the result is valid and will throw an appropriate error message if it is not
	// result: the result returned from checkPropertyChange or validate
	if(!result.valid){
		throw new TypeError(result.errors.map(function(error){return "for property " + error.property + ': ' + error.message;}).join(", \n"));
	}
}

return exports;
}));


/***/ },

/***/ "./src/constants.ts"
/*!**************************!*\
  !*** ./src/constants.ts ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   cacheConfigPages: () => (/* binding */ cacheConfigPages),
/* harmony export */   cacheMajors: () => (/* binding */ cacheMajors),
/* harmony export */   cacheMapFiles: () => (/* binding */ cacheMapFiles),
/* harmony export */   internalNameFiles: () => (/* binding */ internalNameFiles),
/* harmony export */   internalNameFilesWithVarbit: () => (/* binding */ internalNameFilesWithVarbit),
/* harmony export */   lastClassicBuildnr: () => (/* binding */ lastClassicBuildnr),
/* harmony export */   lastLegacyBuildnr: () => (/* binding */ lastLegacyBuildnr),
/* harmony export */   latestBuildNumber: () => (/* binding */ latestBuildNumber),
/* harmony export */   vartypeReverseMap: () => (/* binding */ vartypeReverseMap),
/* harmony export */   vartypes: () => (/* binding */ vartypes)
/* harmony export */ });
const cacheMajors = {
    framemaps: 1,
    config: 2,
    components: 3,
    mapsquares: 5,
    sprites: 8,
    clientscript: 12,
    sounds: 14,
    locs: 16,
    enums: 17,
    npcs: 18,
    items: 19,
    sequences: 20,
    spotanims: 21,
    structs: 22,
    worldmap: 23,
    quickchat: 24,
    materials: 26,
    particles: 27,
    client_cutscenes: 35,
    music: 40,
    worldmaprender: 41,
    maplabellocations: 42,
    models: 47,
    frames: 48,
    texturesDds: 52,
    texturesPng: 53,
    texturesBmp: 54,
    texturesKtx: 55,
    skeletalAnims: 56,
    achievements: 57,
    fontmetrics: 58,
    vectorfonts: 59,
    stylesheets: 60,
    cutscenes: 66,
    filenames: 67,
    // old stuff
    oldmodels: 7,
    texturesOldPng: 9,
    fontmetricsOld: 13,
    texturesOldCompoundPng: 37,
    textures2015Png: 43,
    textures2015CompoundPng: 44,
    textures2015Dds: 45,
    textures2015CompoundPngMips: 46,
    textures2015CompoundDds: 50,
    textures2015PngMips: 51,
    index: 255
};
const internalNameFiles = {
    component: 0,
    bas: 5,
    category: 9,
    cursor: 12,
    dbrow: 14,
    dbtable: 15,
    enum: 16,
    headbar: 20,
    hitmark: 21,
    interface: 24,
    inv: 25,
    loc: 28,
    mapelement: 29,
    material: 32,
    model: 34,
    npc: 35,
    obj: 36,
    param: 37,
    quest: 41,
    seq: 44,
    graphic: 49,
    struct: 50,
    var_clan: 55,
    var_clan_setting: 56,
    var_client: 57,
    var_npc: 59,
    var_object: 60,
    var_player: 61,
    sound: 64,
    midi: 69,
    var_player_group: 80,
    achievement: 89,
    fontmetrics: 90,
    stylesheet: 92,
    ui_anim_curve: 96,
    ui_anim: 97,
    // hardcoded, extracts its values from various var_x files, not a real file in the cache
    varbit: 1001
};
//represents the largest build number that this application is aware off
//is used as default value when a cache is considered "current"
//only needs to be updated when backward incompatible code paths are added
const latestBuildNumber = 950;
const cacheMapFiles = {
    locations: 0,
    squares: 3,
    squaresWater: 4,
    square_nxt: 5,
    env: 6
};
const cacheConfigPages = {
    mapunderlays: 1,
    // 2: 742 empty files (just one 0x00)
    identityKit: 3,
    mapoverlays: 4,
    inventories: 5,
    // 7: 350 empty files
    params: 11,
    // 18: 2888 empty files
    skyboxes: 29,
    // 31: 37 small files which seem to have color and some other data
    animgroups: 32,
    cursors: 33,
    mapscenes: 34,
    quests: 35,
    maplabels: 36,
    dbtables: 40,
    dbrows: 41,
    // 42: 1024 empty files
    hitmarks: 46,
    // 48: 19 empty files
    // 49: 2 empty files
    varplayer: 60,
    varnpc: 61,
    varclient: 62,
    varworld: 63,
    varregion: 64,
    varobject: 65,
    varclan: 66,
    varclansettings: 67,
    varcampaign: 68,
    varbits: 69,
    // 70: 365 empty files
    headbars: 72,
    // 73: 45 empty files
    varplayergroup: 75,
    // 76: 40 moderately complex files
    // 80: 24 files only one having one value
    // 83: 869 complex files, already decoded in config83.jsonc, meaning unclear
    //used before 488 (feb 2008)
    locs_old: 6,
    npcs_old: 9,
    items_old: 10,
    spotanim_old: 13
};
const internalNameFilesWithVarbit = new Map([
    [
        internalNameFiles.var_player,
        cacheConfigPages.varplayer
    ],
    [
        internalNameFiles.var_clan,
        cacheConfigPages.varclan
    ],
    [
        internalNameFiles.var_clan_setting,
        cacheConfigPages.varclansettings
    ],
    [
        internalNameFiles.var_client,
        cacheConfigPages.varclient
    ],
    [
        internalNameFiles.var_npc,
        cacheConfigPages.varnpc
    ],
    [
        internalNameFiles.var_object,
        cacheConfigPages.varobject
    ],
    [
        internalNameFiles.var_player_group,
        cacheConfigPages.varplayergroup
    ]
]);
// from runestar cs2-rs3
const vartypes = {
    int: 0,
    boolean: 1,
    type_2: 2,
    quest: 3,
    questhelp: 4,
    cursor: 5,
    seq: 6,
    colour: 7,
    loc_shape: 8,
    component: 9,
    idkit: 10,
    midi: 11,
    npc_mode: 12,
    namedobj: 13,
    synth: 14,
    type_15: 15,
    area: 16,
    stat: 17,
    npc_stat: 18,
    writeinv: 19,
    mesh: 20,
    maparea: 21,
    coordgrid: 22,
    graphic: 23,
    chatphrase: 24,
    fontmetrics: 25,
    enum: 26,
    type_27: 27,
    jingle: 28,
    chatcat: 29,
    loc: 30,
    model: 31,
    npc: 32,
    obj: 33,
    player_uid: 34,
    type_35: 35,
    string: 36,
    spotanim: 37,
    npc_uid: 38,
    inv: 39,
    texture: 40,
    category: 41,
    char: 42,
    laser: 43,
    bas: 44,
    type_45: 45,
    collision_geometry: 46,
    physics_model: 47,
    physics_control_modifier: 48,
    clanhash: 49,
    coordfine: 50,
    cutscene: 51,
    itemcode: 53,
    type_54: 54,
    mapsceneicon: 55,
    clanforumqfc: 56,
    sound: 57,
    verify_object: 58,
    mapelement: 59,
    categorytype: 60,
    social_network: 61,
    hitmark: 62,
    package: 63,
    particle_effector: 64,
    type_65: 65,
    particle_emitter: 66,
    plogtype: 67,
    unsigned_int: 68,
    skybox: 69,
    skydecor: 70,
    hash64: 71,
    inputtype: 72,
    struct: 73,
    dbrow: 74,
    type_75: 75,
    type_76: 76,
    type_77: 77,
    type_78: 78,
    type_79: 79,
    type_80: 80,
    type_81: 81,
    type_83: 83,
    type_84: 84,
    type_85: 85,
    type_86: 86,
    type_87: 87,
    type_88: 88,
    gwc_platform: 89,
    type_90: 90,
    type_91: 91,
    type_92: 92,
    headbar: 93,
    bug_template: 94,
    billing_auth_flag: 95,
    account_feature_flag: 96,
    interface: 97,
    toplevelinterface: 98,
    overlayinterface: 99,
    clientinterface: 100,
    movespeed: 101,
    material: 102,
    seqgroup: 103,
    temp_hiscore: 104,
    temp_hiscore_length_type: 105,
    temp_hiscore_display_type: 106,
    temp_hiscore_contribute_result: 107,
    audiogroup: 108,
    audiomixbuss: 109,
    long: 110,
    crm_channel: 111,
    http_image: 112,
    pop_up_display_behaviour: 113,
    poll: 114,
    type_115: 115,
    type_116: 116,
    pointlight: 117,
    player_group: 118,
    player_group_status: 119,
    player_group_invite_result: 120,
    player_group_modify_result: 121,
    player_group_join_or_create_result: 122,
    player_group_affinity_modify_result: 123,
    player_group_delta_type: 124,
    client_type: 125,
    telemetry_interval: 126,
    type_127: 127,
    achievement_or_varbit: 128,
    type_129: 129,
    type_130: 130,
    achievement: 131,
    stylesheet: 133,
    type_138: 138,
    type_200: 200,
    type_201: 201,
    type_202: 202,
    type_203: 203,
    type_204: 204,
    type_205: 205,
    type_206: 206,
    type_207: 207,
    type_208: 208,
    var_reference: 209,
    var_player: 210,
    //hardcoded placeholder types
    //TODO try to remove this, no longer required but still used for unknown subtypes
    unknown_int: 501,
    unknown_long: 502,
    unknown_string: 503,
    clientscript: 504,
    scriptsubref: 505
};
const vartypeReverseMap = new Map(Object.entries(vartypes).map((q)=>[
        q[1],
        q[0]
    ]));
const lastLegacyBuildnr = 377;
//unclear if there ended up being overlap with (public) rs2 since this was 12 years after rs2 release
//first known rs2 is 254
//TODO apparently there was some overlap with rs2 beta caches which are technically not possible to support because of this
const lastClassicBuildnr = 235;


/***/ },

/***/ "./src/parser/jsonschemas.ts"
/*!***********************************!*\
  !*** ./src/parser/jsonschemas.ts ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   assertSchema: () => (/* binding */ assertSchema),
/* harmony export */   customModelDefSchema: () => (/* binding */ customModelDefSchema),
/* harmony export */   maprenderConfigSchema: () => (/* binding */ maprenderConfigSchema),
/* harmony export */   parseJsonOrDefault: () => (/* binding */ parseJsonOrDefault),
/* harmony export */   scenarioStateSchema: () => (/* binding */ scenarioStateSchema)
/* harmony export */ });
/* harmony import */ var json_schema__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! json-schema */ "./node_modules/json-schema/lib/validate.js");
/* harmony import */ var json_schema__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(json_schema__WEBPACK_IMPORTED_MODULE_0__);

function assertSchema(v, schema) {
    (0,json_schema__WEBPACK_IMPORTED_MODULE_0__.mustBeValid)((0,json_schema__WEBPACK_IMPORTED_MODULE_0__.validate)(v, schema));
}
function parseJsonOrDefault(str, schema, defaultvalue) {
    try {
        if (typeof str != "string") {
            throw new Error("json string expected");
        }
        let v = JSON.parse(str);
        assertSchema(v, schema);
        return v;
    } catch  {
        return typeof defaultvalue == "function" ? defaultvalue() : defaultvalue;
    }
}
const int = {
    type: "integer"
};
const number = {
    type: "number"
};
const string = {
    type: "string"
};
const boolean = {
    type: "boolean"
};
const mapRectSchema = {
    properties: {
        x: int,
        z: int,
        xsize: int,
        zsize: int
    },
    required: [
        "x",
        "z",
        "xsize",
        "zsize"
    ]
};
const modelModsSchema = {
    properties: {
        replaceMaterials: {
            type: "array",
            minLength: 2,
            maxLength: 2,
            items: int
        },
        replaceColors: {
            type: "array",
            minLength: 2,
            maxLength: 2,
            items: int
        }
    }
};
const simpleModelDefSchema = {
    type: "array",
    items: {
        properties: {
            modelid: int,
            mods: modelModsSchema
        },
        required: [
            "modelid",
            "mods"
        ]
    }
};
const customModelDefSchema = {
    properties: {
        type: {
            const: "custom"
        },
        modelkey: string,
        name: string,
        simpleModel: simpleModelDefSchema,
        globalMods: modelModsSchema,
        basecomp: string
    },
    required: [
        "type",
        "modelkey",
        "name",
        "simplemodel",
        "globalMods",
        "basecomp"
    ]
};
const scenarioModelSchema = {
    oneOf: [
        {
            properties: {
                type: {
                    const: "simple"
                },
                modelkey: string,
                name: string,
                simpleModel: simpleModelDefSchema
            },
            required: [
                "type",
                "modelkey",
                "name",
                "simplemodel"
            ]
        },
        {
            properties: {
                type: {
                    const: "map"
                },
                modelkey: string,
                name: string,
                mapRect: mapRectSchema
            },
            required: [
                "type",
                "modelkey",
                "name",
                "mapRect"
            ]
        },
        customModelDefSchema
    ]
};
const scenarioActionSchema = {
    oneOf: [
        {
            properties: {
                type: {
                    const: "location"
                },
                target: int,
                x: number,
                z: number,
                level: int,
                dy: number,
                rotation: number
            },
            required: [
                "type",
                "target",
                "x",
                "z",
                "level",
                "dy"
            ]
        },
        {
            properties: {
                type: {
                    const: "transform"
                },
                target: int,
                flip: boolean,
                scalex: number,
                scaley: number,
                scalez: number
            },
            required: [
                "type",
                "target",
                "flip",
                "scalex",
                "scaley",
                "scalez"
            ]
        },
        {
            properties: {
                type: {
                    const: "anim"
                },
                target: int,
                animid: int
            },
            required: [
                "type",
                "target",
                "animid"
            ]
        },
        {
            properties: {
                type: {
                    const: "animset"
                },
                target: int,
                animid: int,
                anims: {
                    type: "object",
                    additionalProperties: int
                }
            },
            required: [
                "type",
                "target",
                "animid",
                "anims"
            ]
        },
        {
            properties: {
                type: {
                    const: "delay"
                },
                target: {
                    const: -1
                },
                duration: number
            },
            required: [
                "type",
                "target",
                "duration"
            ]
        },
        {
            properties: {
                type: {
                    const: "visibility"
                },
                target: int,
                visibility: boolean
            },
            required: [
                "type",
                "target",
                "visibility"
            ]
        },
        {
            properties: {
                type: {
                    const: "scale"
                },
                target: int,
                scalex: number,
                scaley: number,
                scalez: number
            },
            required: [
                "type",
                "target",
                "scalex",
                "scaley",
                "scalez"
            ]
        }
    ]
};
const scenarioStateSchema = {
    properties: {
        components: {
            type: "object",
            additionalProperties: scenarioModelSchema
        },
        actions: {
            type: "array",
            items: scenarioActionSchema
        }
    }
};
const maprenderConfigSchema = {
    properties: {
        tileimgsize: number,
        mapsizex: number,
        mapsizez: number,
        area: {
            default: "full",
            description: "A string representing the the map area to render. Either one of the named presets (main, full, test ...), or one or more chunk ranges. eg: 50.50,20.20-70.70",
            anyOf: [
                {
                    type: "string",
                    pattern: /^\d+\.\d+(-\d+\.\d+)?(,\d+\.\d+(-\d+\.\d+)?)*$/.source
                },
                {
                    type: "string",
                    enum: [
                        "main",
                        "full",
                        "test"
                    ]
                },
                {
                    type: "string",
                    pattern: /^\w+$/.source
                }
            ]
        },
        noyflip: {
            type: "boolean",
            default: false,
            description: "Set to true to keep the output y origin at the bottom left, equal to the game z origin."
        },
        nochunkoffset: {
            type: "boolean",
            default: false,
            description: "Set to true to keep output chunks aligned with in-game chunks. Incurs performance penalty as more neighbouring chunks have to be loaded."
        },
        skipsymlinks: {
            type: "boolean",
            default: false,
            description: "Stops outputting symlinks and relies on the map viewer reading variant files to construct redirects. Also outputs separate small variant files."
        },
        layers: {
            items: {
                properties: {
                    mode: string,
                    pxpersquare: number,
                    name: string,
                    level: number,
                    usegzip: boolean,
                    subtractlayers: {
                        items: string
                    },
                    format: {
                        type: "string",
                        enum: [
                            "png",
                            "webp"
                        ]
                    },
                    mipmode: {
                        enum: [
                            "default",
                            "avg"
                        ]
                    }
                },
                required: [
                    "mode",
                    "name",
                    "pxpersquare",
                    "level"
                ],
                oneOf: [
                    {
                        properties: {
                            mode: {
                                enum: [
                                    "3d",
                                    "minimap",
                                    "interactions"
                                ]
                            },
                            dxdy: number,
                            dzdy: number,
                            hidelocs: boolean,
                            overlaywalls: boolean,
                            overlayicons: boolean
                        },
                        required: [
                            "mode",
                            "dxdy",
                            "dzdy"
                        ]
                    },
                    {
                        properties: {
                            mode: {
                                const: "map"
                            },
                            wallsonly: boolean,
                            mapicons: boolean,
                            thicklines: boolean
                        },
                        required: [
                            "mode"
                        ]
                    },
                    {
                        properties: {
                            mode: {
                                const: "height"
                            },
                            allcorners: boolean
                        },
                        required: [
                            "mode"
                        ]
                    },
                    {
                        properties: {
                            mode: {
                                enum: [
                                    "collision",
                                    "locs",
                                    "maplabels",
                                    "rendermeta"
                                ]
                            }
                        },
                        required: [
                            "mode"
                        ]
                    }
                ]
            }
        }
    },
    required: [
        "layers",
        "tileimgsize",
        "mapsizex",
        "mapsizez",
        "area"
    ]
};


/***/ },

/***/ "./src/parser/opcode_reader.ts"
/*!*************************************!*\
  !*** ./src/parser/opcode_reader.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildParser: () => (/* binding */ buildParser),
/* harmony export */   buildReference: () => (/* binding */ buildReference),
/* harmony export */   getDebug: () => (/* binding */ getDebug)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../constants */ "./src/constants.ts");

const BufferTypes = {
    buffer: {
        constr: Buffer,
        bigEndian: false
    },
    hex: {
        constr: Uint8Array,
        bigEndian: false
    },
    byte: {
        constr: Int8Array,
        bigEndian: false
    },
    ubyte: {
        constr: Uint8Array,
        bigEndian: false
    },
    short: {
        constr: Int16Array,
        bigEndian: false
    },
    ushort: {
        constr: Uint16Array,
        bigEndian: false
    },
    int: {
        constr: Int32Array,
        bigEndian: false
    },
    uint: {
        constr: Uint32Array,
        bigEndian: false
    },
    float: {
        constr: Float32Array,
        bigEndian: false
    },
    float_be: {
        constr: Float32Array,
        bigEndian: true
    }
};
var debugdata = null;
function getDebug(trigger) {
    let ret = debugdata;
    debugdata = trigger ? {
        rootstate: null,
        opcodes: []
    } : null;
    return ret;
}
function resolveAlias(typename, parent, typedef) {
    if (!Object.hasOwn(typedef, typename)) {
        throw new Error(`Type '${typename}' not found in typedef.json`);
    }
    let newtype = typedef[typename];
    if (typeof newtype != "string") {
        //TODO this recursion is unchecked
        return buildParser(parent, newtype, typedef);
    } else if (Object.hasOwn(parserPrimitives, newtype)) {
        return parserPrimitives[newtype];
    } else {
        return resolveAlias(newtype, parent, typedef);
    }
}
function buildParser(parent, chunkdef, typedef) {
    parent ??= ()=>{
        throw new Error("reference failed to resolve");
    };
    switch(typeof chunkdef){
        case "boolean":
        case "number":
            return literalValueParser(chunkdef);
        case "string":
            {
                if (Object.hasOwn(parserPrimitives, chunkdef)) {
                    return parserPrimitives[chunkdef];
                } else {
                    return resolveAlias(chunkdef, parent, typedef);
                }
            }
        case "object":
            if (chunkdef == null) {
                return literalValueParser(null);
            } else if (!Array.isArray(chunkdef)) {
                return opcodesParser(chunkdef, parent, typedef);
            } else {
                if (chunkdef.length < 1) throw new Error(`'read' variables must either be a valid type-defining string, an array of type-defining strings / objects, or a valid type-defining object: ${JSON.stringify(chunkdef)}`);
                let args = chunkdef.slice(1);
                if (parserFunctions[chunkdef[0]]) {
                    return parserFunctions[chunkdef[0]](args, parent, typedef);
                }
            }
        default:
            throw new Error(`'read' variables must either be a valid type-defining string, an array of type-defining strings / objects, or a valid type-defining object: ${JSON.stringify(chunkdef)}`);
    }
}
function opcodesParser(chunkdef, parent, typedef) {
    let r = {
        read (state) {
            let r = {};
            let hidden = {
                $opcode: 0
            };
            state.stack.push(r);
            state.hiddenstack.push(hidden);
            if (debugdata && !debugdata.rootstate) {
                debugdata.rootstate = r;
            }
            while(true){
                if (state.scan == state.endoffset) {
                    if (!hasexplicitnull) {
                        // throw new Error("ended reading opcode struct at end of file without 0x00 opcode");
                        console.log("ended reading opcode struct at end of file without 0x00 opcode");
                    }
                    break;
                }
                let opt = opcodetype.read(state);
                hidden.$opcode = opt;
                if (!hasexplicitnull && opt == 0) {
                    break;
                }
                let parser = map.get(opt);
                if (debugdata) {
                    debugdata.opcodes.push({
                        op: parser ? parser.key : `_0x${opt.toString(16)}_`,
                        index: state.scan - 1,
                        stacksize: state.stack.length
                    });
                }
                if (!parser) {
                    throw new Error("unknown chunk 0x" + opt.toString(16).toUpperCase());
                }
                r[parser.key] = parser.parser.read(state);
            }
            state.stack.pop();
            state.hiddenstack.pop();
            return r;
        },
        write (state, value) {
            if (typeof value != "object" || !value) {
                throw new Error("oject expected");
            }
            state.stack.push(value);
            state.hiddenstack.push({});
            for(let key in value){
                if (key.startsWith("$")) {
                    continue;
                }
                let opt = opts[key];
                if (!opt) {
                    throw new Error("unknown property " + key);
                }
                opcodetype.write(state, opt.op);
                opt.parser.write(state, value[key]);
            }
            if (!hasexplicitnull) {
                opcodetype.write(state, 0);
            }
            state.stack.pop();
            state.hiddenstack.pop();
        },
        getTypescriptType (indent) {
            let r = "{\n";
            let newindent = indent + "\t";
            for (let val of map.values()){
                r += newindent + val.key + "?: " + val.parser.getTypescriptType(newindent) + " | null\n";
            }
            r += indent + "}";
            return r;
        },
        getJsonSchema () {
            let propschema = {};
            for (let prop of map.values()){
                if (prop.key.startsWith("$")) {
                    continue;
                }
                propschema[prop.key] = {
                    oneOf: [
                        prop.parser.getJsonSchema(),
                        {
                            type: "null"
                        }
                    ]
                };
                propschema[prop.key]["x-rsmv-type"] = prop.rstype;
            }
            return {
                type: "object",
                properties: propschema,
                "x-rsmv-type": roottype
            };
        }
    };
    let resolveReference = function(targetprop, name, childresolve) {
        let result = {
            stackdepth: childresolve.stackdepth + 1,
            resolve (v, oldvalue) {
                if (typeof v != "object" || !v) {
                    throw new Error("object expected");
                }
                let res = v[targetprop];
                return childresolve.resolve(res, oldvalue);
            }
        };
        if (name == "$opcode" || Object.prototype.hasOwnProperty.call(opts, name)) {
            refs[name] ??= [];
            refs[name].push(result);
            return result;
        } else {
            return buildReference(name, parent, result);
        }
    };
    let refs = {};
    let opcodetype = buildParser(null, chunkdef["$opcode"] ?? "unsigned byte", typedef);
    let opts = {};
    let roottype = "";
    for(let key in chunkdef){
        if (key.startsWith("$")) {
            if (key == "$type") {
                roottype = chunkdef[key];
            }
            continue;
        }
        let op = chunkdef[key];
        if (typeof op != "object" || !op) {
            throw new Error("op name expected");
        }
        let opname = op["name"];
        if (typeof opname != "string") {
            throw new Error("op name expected");
        }
        let optype = op["type"] ?? "";
        if (typeof optype != "string") {
            throw new Error("op type expected");
        }
        if (opts[opname]) {
            throw new Error("duplicate opcode key " + opname);
        }
        opts[opname] = {
            op: parseInt(key),
            parser: buildParser(resolveReference.bind(null, key), op["read"], typedef),
            rstype: optype
        };
    }
    let map = new Map();
    for(let key in opts){
        let opt = opts[key];
        map.set(opt.op, {
            key: key,
            parser: opt.parser,
            rstype: opt.rstype
        });
    }
    let hasexplicitnull = !!map.get(0);
    return r;
}
function tupleParserFactory(istyped) {
    return (args, parent, typedef)=>{
        let r = {
            read (state) {
                let r = [];
                for (let prop of props){
                    let v = prop.read(state);
                    r.push(v);
                }
                return r;
            },
            write (state, value) {
                if (!Array.isArray(value)) {
                    throw new Error("array expected");
                }
                for (let [i, prop] of props.entries()){
                    prop.write(state, value[i]);
                }
            },
            getTypescriptType (indent) {
                let r = "[\n";
                let newindent = indent + "\t";
                for (let prop of props){
                    r += newindent + prop.getTypescriptType(newindent) + ",\n";
                }
                r += indent + "]";
                return r;
            },
            getJsonSchema () {
                let items = props.map((prop, i)=>{
                    let res = prop.getJsonSchema();
                    if (istyped) {
                        res["x-rsmv-type"] = proptypes[i];
                    }
                    return res;
                });
                return {
                    type: "array",
                    items: items,
                    minItems: Object.keys(props).length,
                    maxItems: Object.keys(props).length
                };
            }
        };
        const resolveReference = function(index, name, child) {
            return buildReference(name, parent, {
                stackdepth: child.stackdepth,
                resolve (v, old) {
                    if (!Array.isArray(v)) {
                        throw new Error("Array expected");
                    }
                    return child.resolve(v[index], old);
                }
            });
        };
        let props = [];
        let proptypes = [];
        for (let arg of args){
            let parsearg = null;
            let type = "";
            if (istyped) {
                if (!Array.isArray(arg) || arg.length != 2) {
                    throw new Error("typed tuple args should be [type, vartype]");
                }
                [parsearg, type] = arg;
            } else {
                parsearg = arg;
            }
            props.push(buildParser(resolveReference.bind(null, props.length), parsearg, typedef));
            proptypes.push(type);
        }
        return r;
    };
}
function buildReference(name, container, startingpoint) {
    if (!container) {
        throw new Error("reference " + name + " could not be resolved");
    }
    return container(name, startingpoint);
}
function refgetter(refparent, propname, resolve) {
    let final = buildReference(propname, refparent, {
        stackdepth: 0,
        resolve
    });
    let depth = final.stackdepth;
    let hidden = propname.startsWith("$");
    return {
        read (state) {
            let stack = hidden ? state.hiddenstack : state.stack;
            return stack[stack.length - depth][propname];
        },
        write (state, newvalue) {
            if (state.isWrite && !hidden) {
                throw new Error(`can update ref values in write mode when they are hidden (prefixed with $) in ${propname}`);
            }
            let stack = hidden ? state.hiddenstack : state.stack;
            stack[stack.length - depth][propname] = newvalue;
        }
    };
}
function structParserFactory(ismini) {
    return function structParser(args, parent, typedef) {
        let refs = {};
        let r = {
            read (state) {
                let r = {};
                let hidden = {};
                state.stack.push(r);
                state.hiddenstack.push(hidden);
                if (debugdata && !debugdata.rootstate) {
                    debugdata.rootstate = r;
                }
                if (debugdata && ismini) {
                    debugdata.opcodes.push({
                        op: "struct",
                        index: state.scan,
                        stacksize: state.stack.length
                    });
                }
                for (let key of keys){
                    if (debugdata && !ismini) {
                        debugdata.opcodes.push({
                            op: key,
                            index: state.scan,
                            stacksize: state.stack.length
                        });
                    }
                    let v = props[key].read(state);
                    if (v !== undefined) {
                        if (key[0] == "$") {
                            hidden[key] = v;
                        } else {
                            r[key] = v;
                        }
                    }
                }
                state.stack.pop();
                state.hiddenstack.pop();
                return r;
            },
            write (state, value) {
                if (typeof value != "object" || !value) {
                    throw new Error("object expected");
                }
                let hiddenvalue = {};
                state.stack.push(value);
                state.hiddenstack.push(hiddenvalue);
                for (let key of keys){
                    let propvalue = value[key];
                    let prop = props[key];
                    if (key.startsWith("$")) {
                        if (prop.readConst != undefined) {
                            propvalue = prop.readConst(state);
                        } else {
                            let refarray = refs[key];
                            if (!refarray) {
                                throw new Error("cannot write hidden values if they are not constant or not referenced");
                            }
                            propvalue ??= 0;
                            for (let ref of refarray){
                                propvalue = ref.resolve(value, propvalue);
                            }
                        }
                        hiddenvalue[key] = propvalue;
                    }
                    prop.write(state, propvalue);
                }
                state.stack.pop();
                state.hiddenstack.pop();
            },
            getTypescriptType (indent) {
                let r = "{\n";
                let newindent = indent + "\t";
                for (let key of keys){
                    if (key[0] == "$") {
                        continue;
                    }
                    r += newindent + key + ": " + props[key].getTypescriptType(newindent) + ",\n";
                }
                r += indent + "}";
                return r;
            },
            getJsonSchema () {
                let propschema = {};
                for(let prop in props){
                    if (prop.startsWith("$")) {
                        continue;
                    }
                    propschema[prop] = props[prop].getJsonSchema();
                    let proptype = proptypes[prop];
                    if (proptype) {
                        propschema[prop]["x-rsmv-type"] = proptype;
                    }
                }
                return {
                    type: "object",
                    properties: propschema,
                    required: Object.keys(propschema)
                };
            }
        };
        let resolveReference = function(targetprop, name, childresolve) {
            let result = {
                stackdepth: childresolve.stackdepth + 1,
                resolve (v, oldvalue) {
                    if (typeof v != "object" || !v) {
                        throw new Error("object expected");
                    }
                    let res = v[targetprop];
                    return childresolve.resolve(res, oldvalue);
                }
            };
            if (Object.prototype.hasOwnProperty.call(props, name)) {
                refs[name] ??= [];
                refs[name].push(result);
                return result;
            } else {
                return buildReference(name, parent, result);
            }
        };
        let props = {};
        let proptypes = {};
        for (let propdef of args){
            if (!Array.isArray(propdef) || propdef.length != 2 && propdef.length != 3) {
                throw new Error("each struct args should be a [name,type] pair");
            }
            if (typeof propdef[0] != "string") {
                throw new Error("prop name should be string");
            }
            if (props[propdef[0]]) {
                throw new Error("duplicate struct prop " + propdef[0]);
            }
            props[propdef[0]] = buildParser(resolveReference.bind(null, propdef[0]), propdef[1], typedef);
            proptypes[propdef[0]] = propdef[2] ?? "";
        }
        let keys = Object.keys(props);
        return r;
    };
}
function optParser(args, parent, typedef) {
    let r = {
        read (state) {
            let matchindex = condchecker.match(state);
            if (matchindex == -1) {
                return null;
            }
            return type.read(state);
        },
        write (state, value) {
            if (value != null) {
                return type.write(state, value);
            }
        },
        getTypescriptType (indent) {
            return type.getTypescriptType(indent) + " | null";
        },
        getJsonSchema () {
            return {
                oneOf: [
                    type.getJsonSchema(),
                    {
                        type: "null"
                    }
                ]
            };
        }
    };
    let resolveReference = function(name, child) {
        return buildReference(name, parent, {
            stackdepth: child.stackdepth,
            resolve (v, old) {
                return v != null ? child.resolve(v, old) : old;
            }
        });
    };
    if (args.length < 2) throw new Error(`2 arguments exptected for proprety with type opt`);
    let arg1 = args[0];
    let condstr = "";
    if (typeof arg1 == "string") {
        condstr = arg1;
    } else {
        let condvar;
        let condvalue;
        let cmpmode = "eq";
        if (Array.isArray(arg1)) {
            if (typeof arg1[1] != "number") {
                throw new Error("only literal ints as condition value are supported");
            }
            condvar = arg1[0];
            cmpmode = arg1[2] ?? "eq";
            condvalue = arg1[1];
        } else {
            if (typeof arg1 != "number") {
                throw new Error("");
            }
            condvar = "$opcode";
            condvalue = arg1;
        }
        let condmap = {
            bitand: "&=",
            bitflag: "&",
            bitflagnot: "!&",
            bitor: "&",
            eq: "==",
            eqnot: "!=",
            gteq: ">=",
            lteq: "<="
        };
        let mapped = condmap[cmpmode];
        if (cmpmode == "bitflag" || cmpmode == "bitflagnot") {
            condvalue = 1 << condvalue;
        }
        condstr = `${condvar}${mapped}${condvalue}`;
    }
    let condchecker = conditionParser(resolveReference, [
        condstr
    ], (v)=>v == null ? -1 : 0);
    let type = buildParser(resolveReference, args[1], typedef);
    return r;
}
function chunkedArrayParser(args, parent, typedef) {
    let r = {
        read (state) {
            let len = lengthtype.read(state);
            let r = [];
            let hiddenprops = [];
            for(let chunkindex = 0; chunkindex < chunktypes.length; chunkindex++){
                let proptype = chunktypes[chunkindex];
                if (debugdata) {
                    debugdata.opcodes.push({
                        op: Object.keys(proptype).join(),
                        index: state.scan,
                        stacksize: state.stack.length
                    });
                }
                for(let i = 0; i < len; i++){
                    let hidden;
                    let obj;
                    if (chunkindex == 0) {
                        obj = {};
                        r.push(obj);
                        hidden = {};
                        hiddenprops.push(hidden);
                    } else {
                        obj = r[i];
                        hidden = hiddenprops[i];
                    }
                    //TODO check if we can save speed by manually overwriting stack[length-1] instead of pop->push
                    state.stack.push(obj);
                    state.hiddenstack.push(hidden);
                    for(let key in proptype){
                        let value = proptype[key].read(state);
                        if (key.startsWith("$")) {
                            hidden[key] = value;
                        } else {
                            obj[key] = value;
                        }
                    }
                    state.stack.pop();
                    state.hiddenstack.pop();
                }
            }
            return r;
        },
        write (state, v) {
            if (!Array.isArray(v)) {
                throw new Error("array expected");
            }
            lengthtype.write(state, v.length);
            let hiddenprops = [];
            for(let chunkindex = 0; chunkindex < chunktypes.length; chunkindex++){
                let proptype = chunktypes[chunkindex];
                for(let i = 0; i < v.length; i++){
                    let entry = v[i];
                    let hiddenvalue = chunkindex == 0 ? hiddenprops[i] = {} : hiddenprops[i];
                    state.stack.push(entry);
                    state.hiddenstack.push(hiddenvalue);
                    if (typeof entry != "object" || !entry) {
                        throw new Error("object expected");
                    }
                    for(let key in proptype){
                        let prop = proptype[key];
                        let propvalue = entry[key];
                        if (key.startsWith("$")) {
                            if (prop.readConst != undefined) {
                                propvalue = prop.readConst(state);
                            } else {
                                let refarray = refs[key];
                                if (!refarray) {
                                    throw new Error("cannot write hidden values if they are not constant or not referenced");
                                }
                                propvalue ??= 0;
                                for (let ref of refarray){
                                    propvalue = ref.resolve(entry, propvalue);
                                }
                            }
                            hiddenvalue[key] = propvalue;
                        }
                        prop.write(state, propvalue);
                    }
                    state.stack.pop();
                    state.hiddenstack.pop();
                }
            }
        },
        getTypescriptType (indent) {
            let r = "{\n";
            let newindent = indent + "\t";
            for (let [key, prop] of Object.entries(fullobj)){
                if (key[0] == "$") {
                    continue;
                }
                r += newindent + key + ": " + prop.getTypescriptType(newindent) + ",\n";
            }
            r += indent + "}[]";
            return r;
        },
        getJsonSchema () {
            let propschema = {};
            for(let prop in fullobj){
                if (prop.startsWith("$")) {
                    continue;
                }
                propschema[prop] = fullobj[prop].getJsonSchema();
                let proptype = proptypes[prop];
                if (proptype) {
                    propschema[prop]["x-rsmv-type"] = proptype;
                }
            }
            return {
                type: "array",
                items: {
                    type: "object",
                    properties: Object.fromEntries([
                        ...Object.entries(fullobj)
                    ].filter(([key])=>!key.startsWith("$")).map(([key, prop])=>[
                            key,
                            prop.getJsonSchema()
                        ])),
                    required: keys.filter((k)=>!k.startsWith("$"))
                }
            };
        }
    };
    const resolveLength = function(prop, childresolve) {
        return buildReference(prop, parent, {
            stackdepth: childresolve.stackdepth,
            resolve (v, old) {
                if (!Array.isArray(v)) {
                    throw new Error("array expected");
                }
                return childresolve.resolve(v.length, old);
            }
        });
    };
    const resolveReference = function(targetprop, name, childresolve) {
        let result = {
            stackdepth: childresolve.stackdepth + 1,
            resolve (v, oldvalue) {
                if (typeof v != "object" || !v) {
                    throw new Error("object expected");
                }
                let res = v[targetprop];
                return childresolve.resolve(res, oldvalue);
            }
        };
        if (Object.prototype.hasOwnProperty.call(fullobj, name)) {
            refs[name] ??= [];
            refs[name].push(result);
            return result;
        } else {
            return buildReference(name, parent, result);
        }
    };
    let rawchunks = args.slice(1);
    let lengthtype = buildParser(resolveLength, args[0], typedef);
    let refs = {};
    let fullobj = {};
    let chunktypes = [];
    let proptypes = {};
    for (let chunk of rawchunks){
        if (!Array.isArray(chunk)) {
            throw new Error("each argument for composed chunk should be an array");
        }
        let group = {};
        chunktypes.push(group);
        for (let propdef of chunk){
            if (!Array.isArray(propdef) || propdef.length != 2 && propdef.length != 3 || typeof propdef[0] != "string") {
                throw new Error("each composedchunk should be a [name,type,type?] pair");
            }
            let p = buildParser(resolveReference.bind(null, propdef[0]), propdef[1], typedef);
            group[propdef[0]] = p;
            fullobj[propdef[0]] = p;
            proptypes[propdef[0]] = propdef[2] ?? "";
        }
    }
    let keys = chunktypes.flatMap(Object.keys);
    return r;
}
function bufferParserValue(value, type, scalartype) {
    if (typeof value == "string") {
        if (scalartype == "hex") {
            return Buffer.from(value, "hex");
        } else {
            //accept json-ified version of our data as well
            let m = value.match(/^buffer ([\w\[\]]+){([\d,\-\.]*)}/);
            if (!m) {
                throw new Error("invalid arraybuffer string");
            }
            return new type.constr(m[2].split(",").map((q)=>+q));
        }
    }
    if (!(value instanceof type.constr)) {
        throw new Error("arraybuffer expected");
    }
    return value;
}
function flipBufferEndianness(bytes, bytesPerElement) {
    if (bytesPerElement == 1) {
    //noop
    } else if (bytesPerElement == 2) {
        for(let i = 0; i < bytes.length; i += 2){
            let a = bytes[i];
            bytes[i] = bytes[i + 1];
            bytes[i + 1] = a;
        }
    } else if (bytesPerElement == 4) {
        for(let i = 0; i < bytes.length; i += 4){
            let a = bytes[i];
            let b = bytes[i + 1];
            bytes[i] = bytes[i + 3];
            bytes[i + 1] = bytes[i + 2];
            bytes[i + 2] = b;
            bytes[i + 3] = a;
        }
    } else {
        throw new Error("unsupported BYTES_PER_ELEMENT " + bytesPerElement);
    }
}
function bufferParser(args, parent, typedef) {
    let r = {
        read (state) {
            let len = lengthtype.read(state);
            let bytelen = len * vectorLength * type.constr.BYTES_PER_ELEMENT;
            let backing = new ArrayBuffer(bytelen);
            if (state.scan + bytelen > state.endoffset) {
                throw new Error("trying to read outside buffer bounds");
            }
            let bytes = Buffer.from(backing);
            bytes.set(state.buffer.subarray(state.scan, state.scan + bytelen));
            state.scan += bytelen;
            if (type.bigEndian) {
                flipBufferEndianness(bytes, type.constr.BYTES_PER_ELEMENT);
            }
            let array = scalartype == "buffer" ? bytes : new type.constr(backing);
            if (scalartype == "hex") {
                Object.defineProperty(array, "toJSON", {
                    value: ()=>bytes.toString("hex"),
                    enumerable: false
                });
            } else if (state.args.keepBufferJson === true) {
                Object.defineProperty(array, "toJSON", {
                    value: ()=>`buffer ${scalartype}${vectorLength != 1 ? `[${vectorLength}]` : ""}[${len}]`,
                    enumerable: false
                });
            } else {
                Object.defineProperty(array, "toJSON", {
                    value: ()=>`buffer ${scalartype}${vectorLength != 1 ? `[${vectorLength}]` : ""}[]{${[
                            ...array
                        ].join(",")}}`,
                    enumerable: false
                });
            }
            return array;
        },
        write (state, rawvalue) {
            let value = bufferParserValue(rawvalue, type, scalartype);
            if (value.length % vectorLength != 0) {
                throw new Error("araybuffer is not integer multiple of vectorlength");
            }
            lengthtype.write(state, value.length / vectorLength);
            let bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
            if (type.bigEndian) {
                flipBufferEndianness(bytes, type.constr.BYTES_PER_ELEMENT);
            }
            state.buffer.set(bytes, state.scan);
            state.scan += bytes.byteLength;
        },
        getTypescriptType (indent) {
            return type.constr.name;
        },
        getJsonSchema () {
            return {
                type: "string"
            };
        }
    };
    const resolveLengthReference = function(name, child) {
        return buildReference(name, parent, {
            stackdepth: child.stackdepth,
            resolve (rawvalue, old) {
                let value = bufferParserValue(rawvalue, type, scalartype);
                return child.resolve(value.length / vectorLength, old);
            }
        });
    };
    if (args.length < 1) throw new Error(`'read' variables interpretted as an array must contain items: ${JSON.stringify(args)}`);
    let typestring = args[1] ?? "buffer";
    let lenarg = args[2] ?? 1;
    if (typeof typestring != "string" || !Object.hasOwn(BufferTypes, typestring)) {
        throw new Error("unknown buffer type " + args[1]);
    }
    if (typeof lenarg != "number") {
        throw new Error("vectorlength should be a number");
    }
    let vectorLength = lenarg;
    let scalartype = typestring;
    let lengthtype = buildParser(resolveLengthReference, args[0], typedef);
    const type = BufferTypes[typestring];
    return r;
}
function arrayParser(args, parent, typedef) {
    let r = {
        read (state) {
            let len = lengthtype.read(state);
            let ctx = {
                $index: 0,
                $length: len
            };
            state.hiddenstack.push(ctx);
            state.stack.push({});
            let r = [];
            for(let i = 0; i < len; i++){
                ctx.$index = i;
                r.push(subtype.read(state));
            }
            state.hiddenstack.pop();
            state.stack.pop();
            return r;
        },
        write (state, value) {
            if (!Array.isArray(value)) {
                throw new Error("array expected");
            }
            lengthtype.write(state, value.length);
            state.stack.push({});
            state.hiddenstack.push({
                $index: 0,
                $length: value.length
            });
            for(let i = 0; i < value.length; i++){
                subtype.write(state, value[i]);
            }
            state.hiddenstack.pop();
            state.stack.pop();
        },
        getTypescriptType (indent) {
            return `${subtype.getTypescriptType(indent)}[]`;
        },
        getJsonSchema () {
            let itemtype = subtype.getJsonSchema();
            itemtype["x-rsmv-type"] = displaytype;
            return {
                type: "array",
                items: itemtype
            };
        }
    };
    const resolveLengthReference = function(name, child) {
        return buildReference(name, parent, {
            stackdepth: child.stackdepth,
            resolve (v, old) {
                if (!Array.isArray(v)) {
                    throw new Error("array expected");
                }
                return child.resolve(v.length, old);
            }
        });
    };
    const resolvePropReference = function(name, child) {
        if (name == "$index" || name == "$length") {
            return {
                stackdepth: child.stackdepth + 1,
                resolve (v, old) {
                    throw new Error("not implemented");
                }
            };
        }
        return buildReference(name, parent, {
            stackdepth: child.stackdepth + 1,
            resolve (v, old) {
                if (!Array.isArray(v)) {
                    throw new Error("array expected");
                }
                //possibly do this for all elements in the array if needed and allowed by performance
                return child.resolve(v[0], old);
            }
        });
    };
    if (args.length < 1) throw new Error(`'read' variables interpretted as an array must contain items: ${JSON.stringify(args)}`);
    let sizearg = args.length >= 2 ? args[0] : "variable unsigned short";
    let lengthtype = buildParser(resolveLengthReference, sizearg, typedef);
    let subtype = buildParser(resolvePropReference, args[args.length >= 2 ? 1 : 0], typedef);
    let displaytype = args[2];
    return r;
}
function arrayNullTerminatedParser(args, parent, typedef) {
    let r = {
        read (state) {
            let r = [];
            let ctx = {
                $opcode: 0
            };
            state.hiddenstack.push(ctx);
            state.stack.push({});
            while(true){
                let oldscan = state.scan;
                let header = lengthtype.read(state);
                if (debugdata) {
                    debugdata.opcodes.push({
                        op: "$opcode",
                        index: oldscan,
                        stacksize: state.stack.length
                    });
                }
                ctx.$opcode = header;
                let endint = endvalue.read(state);
                if (header == endint) {
                    break;
                }
                r.push(subtype.read(state));
            }
            state.hiddenstack.pop();
            state.stack.pop();
            return r;
        },
        write (state, value) {
            if (!Array.isArray(value)) {
                throw new Error("array expected");
            }
            //TODO probably very wrong
            state.stack.push(value);
            state.hiddenstack.push({});
            for (let prop of value){
                lengthtype.write(state, 1);
                subtype.write(state, prop);
            }
            lengthtype.write(state, 0);
            state.stack.pop();
            state.hiddenstack.pop();
        },
        getTypescriptType (indent) {
            return `${subtype.getTypescriptType(indent)}[]`;
        },
        getJsonSchema () {
            return {
                type: "array",
                items: subtype.getJsonSchema()
            };
        }
    };
    const resolveReference = function(name, child) {
        if (name == "$opcode") {
            return {
                stackdepth: child.stackdepth + 1,
                resolve (v, old) {
                    throw new Error("not implemented");
                }
            };
        }
        return buildReference(name, parent, {
            stackdepth: child.stackdepth + 1,
            resolve (v, old) {
                if (!Array.isArray(v)) {
                    throw new Error("array expected");
                }
                //possibly do this for all elements in the array if needed and allowed by performance
                return child.resolve(v[0], old);
            }
        });
    };
    if (args.length < 1) throw new Error(`'read' variables interpretted as an array must contain items: ${JSON.stringify(args)}`);
    let sizearg = args.length >= 2 ? args[0] : "variable unsigned short";
    let endintarg = args.length >= 3 ? args[1] : 0;
    let lengthtype = buildParser(null, sizearg, typedef);
    let endvalue = buildParser(null, endintarg, typedef);
    let subtype = buildParser(resolveReference, args[args.length - 1], typedef);
    return r;
}
function literalValueParser(constvalue) {
    if (typeof constvalue != "number" && typeof constvalue != "string" && typeof constvalue != "boolean" && constvalue != null) {
        throw new Error("only bool, number, string or null literals allowed");
    }
    let r = {
        read (state) {
            return constvalue;
        },
        readConst () {
            return constvalue;
        },
        write (state, value) {
            if (value != constvalue) throw new Error(`expected constant ${constvalue} was not present during write`);
        //this is a nop, the existence of this field implies its value
        },
        getTypescriptType () {
            return JSON.stringify(constvalue);
        },
        getJsonSchema () {
            return {
                const: constvalue
            };
        }
    };
    return r;
}
function referenceValueParser(args, parent, typedef) {
    let read = (state)=>{
        let value = ref.read(state);
        if (indexgetter) {
            let index = indexgetter.read(state);
            value = value[index];
        }
        if (minbit != -1) {
            value = value >> minbit & ~(~0 << bitlength);
        }
        return value + offset;
    };
    let r = {
        read,
        readConst: read,
        write (state, value) {
        //noop, the referenced value does the writing and will get its value from this prop through refgetter
        },
        getTypescriptType () {
            return "number";
        },
        getJsonSchema () {
            return {
                type: "integer",
                minimum: bitlength == -1 ? undefined : 0,
                maximum: bitlength == -1 ? undefined : 2 ** bitlength - 1
            };
        }
    };
    if (args.length < 1) throw new Error(`1 argument exptected for proprety with type ref`);
    if (typeof args[0] != "string") {
        throw new Error("ref propname expected");
    }
    let propname = args[0];
    let [minbit, bitlength] = [
        -1,
        -1
    ];
    let indexgetter = null;
    if (args[1]) {
        if (Array.isArray(args[1]) && args[1].length == 2 && typeof args[1][0] == "number" && typeof args[1][1] == "number") {
            minbit = args[1][0];
            bitlength = args[1][1];
        } else if (typeof args[1] == "string") {
            indexgetter = refgetter(parent, args[1], (v, old)=>{
                return old;
            });
        } else {
            throw new Error("second argument for ref should be [minbit,bitlen] pair");
        }
    }
    let offset = args[2] ?? 0;
    if (typeof offset != "number") {
        throw new Error("ref offset should be a number");
    }
    let ref = refgetter(parent, propname, (v, old)=>{
        if (typeof v != "number") {
            throw new Error("number expected");
        }
        if (minbit != -1) {
            let mask = ~(-1 << bitlength) << minbit;
            return old & ~mask | v << minbit;
        } else {
            return v;
        }
    });
    return r;
}
function bytesRemainingParser() {
    return {
        read (state) {
            return state.endoffset - state.scan;
        },
        write (state, value) {
        //nop, value exists only in context of output
        },
        getTypescriptType () {
            return "number";
        },
        getJsonSchema () {
            return {
                type: "integer"
            };
        }
    };
}
function intAccumolatorParser(args, parent, typedef) {
    let r = {
        read (state) {
            //TODO fix the context situation
            let increment = value.read(state);
            let newvalue;
            let refvalue = ref.read(state) ?? 0;
            if (mode == "add" || mode == "add-1" || mode == "postadd") {
                newvalue = refvalue + (increment ?? 0) + (mode == "add-1" ? -1 : 0);
            } else if (mode == "hold") {
                newvalue = increment ?? refvalue;
            } else {
                throw new Error("unknown accumolator mode");
            }
            ref.write(state, newvalue);
            return mode == "postadd" ? refvalue : newvalue;
        },
        write (state, v) {
            if (typeof v != "number") {
                throw new Error("number expected");
            }
            let refvalue = ref.read(state) ?? 0;
            let increment;
            if (mode == "add" || mode == "add-1") {
                increment = v - refvalue + (mode == "add-1" ? 1 : 0);
            } else if (mode == "hold") {
                throw new Error("writing accum intaccum hold not implemented");
            } else if (mode == "postadd") {
                throw new Error("writing accum intaccum postadd not implemented");
            } else {
                throw new Error("unknown accumolator mode");
            }
            value.write(state, increment);
            ref.write(state, v);
        },
        getTypescriptType () {
            return "number";
        },
        getJsonSchema () {
            return {
                type: "integer"
            };
        }
    };
    if (args.length < 2) throw new Error(`2 arguments exptected for proprety with type accum`);
    let refname = args[0];
    let value = buildParser(parent, args[1], typedef);
    let mode = args[2] ?? "add";
    if (typeof refname != "string") {
        throw new Error("ref name should be a string");
    }
    let ref = refgetter(parent, refname, (v, old)=>{
        return old;
    });
    return r;
}
function stringParser(prebytes) {
    const encoding = "latin1";
    return {
        read (state) {
            let terminator = getClientVersion(state.args) <= _constants__WEBPACK_IMPORTED_MODULE_0__.lastLegacyBuildnr ? 0xA : 0;
            for(let i = 0; i < prebytes.length; i++, state.scan++){
                if (state.buffer.readUInt8(state.scan) != prebytes[i]) {
                    throw new Error("failed to match string header bytes");
                }
            }
            let end = state.scan;
            while(true){
                if (end == state.endoffset) {
                    throw new Error("reading string without null termination");
                }
                if (state.buffer.readUInt8(end) == terminator) {
                    break;
                }
                end++;
            }
            let outputstr = state.buffer.toString(encoding, state.scan, end);
            state.scan = end + 1;
            return outputstr;
        },
        write (state, value) {
            if (typeof value != "string") throw new Error(`string expected`);
            let terminator = getClientVersion(state.args) <= _constants__WEBPACK_IMPORTED_MODULE_0__.lastLegacyBuildnr ? 0xA : 0;
            let writebytes = [
                ...prebytes,
                ...Buffer.from(value, encoding),
                terminator
            ];
            state.buffer.set(writebytes, state.scan);
            state.scan += writebytes.length;
            ;
        },
        getTypescriptType () {
            return "string";
        },
        getJsonSchema () {
            return {
                type: "string"
            };
        }
    };
}
function typedParser(args, parent, typedef) {
    let sub = buildParser(parent, args[0], typedef);
    let type = args[1];
    if (typeof type != "string") {
        throw new Error("typed parser second argument should be a type string");
    }
    return {
        ...sub,
        getJsonSchema () {
            let schema = sub.getJsonSchema();
            schema["x-rsmv-type"] = type;
            return schema;
        }
    };
}
function conditionParser(parent, optionstrings, writegetindex) {
    let varmap = [];
    let options = [];
    for (let str of optionstrings){
        str = str.replace(/\s/g, "");
        let parts = str.split(/&&/g);
        let conds = [];
        for (let opt of parts){
            let op;
            let varname;
            let value = 0;
            if (opt == "default" || opt == "other") {
                continue;
            } else {
                let m = opt.match(/^((?<var>[\$a-zA-Z]\w*)?(?<op><|<=|>|>=|&|==|=|!&|&=|!=)?)?(?<version>0x[\da-fA=F]+|-?\d+)$/);
                if (!m) {
                    throw new Error("invalid match value, expected <op><version>. For example '>10'");
                }
                value = parseInt(m.groups.version);
                op = m.groups.op ?? "=";
                if (op == "==") {
                    op = "=";
                }
                varname = m.groups.var ?? "$opcode";
            }
            let varindex = varmap.findIndex((q)=>q.name == varname);
            if (varindex == -1) {
                varindex = varmap.length;
                varmap.push({
                    name: varname,
                    parser: refgetter(parent, varname, (v, oldvalue)=>{
                        if (!writegetindex) {
                            throw new Error("write not implemented");
                        }
                        let index = writegetindex(v);
                        for(let optionindex = 0; optionindex < options.length; optionindex++){
                            let option = options[optionindex];
                            for (let con of option){
                                if (con.varindex != varindex) {
                                    continue;
                                }
                                let state = optionindex == index;
                                let compValue = con.value;
                                switch(con.op){
                                    case "=":
                                        oldvalue = state ? compValue : oldvalue;
                                        break;
                                    case "!=":
                                        oldvalue = state ? oldvalue : compValue;
                                        break;
                                    case "&":
                                        oldvalue = state ? oldvalue | compValue : oldvalue & ~compValue;
                                        break;
                                    case "&=":
                                        oldvalue = state ? oldvalue | compValue : oldvalue & ~compValue;
                                        break;
                                    case "!&":
                                        oldvalue = state ? oldvalue & ~compValue : oldvalue | compValue;
                                        break;
                                    case ">=":
                                        oldvalue = state ? Math.max(compValue, oldvalue) : oldvalue;
                                        break;
                                    case ">":
                                        oldvalue = state ? Math.max(compValue + 1, oldvalue) : oldvalue;
                                        break;
                                    case "<=":
                                        oldvalue = state ? Math.min(compValue, oldvalue) : oldvalue;
                                        break;
                                    case "<":
                                        oldvalue = state ? Math.min(compValue - 1, oldvalue) : oldvalue;
                                        break;
                                    default:
                                        throw new Error("unknown condition " + con.op);
                                }
                            }
                        }
                        return oldvalue;
                    })
                });
            }
            conds.push({
                op,
                value,
                varname,
                varindex
            });
        }
        options.push(conds);
    }
    let match = (state)=>{
        let vars = varmap.map((q)=>q.parser.read(state));
        for(let optindex = 0; optindex < options.length; optindex++){
            let opt = options[optindex];
            let matched = true;
            for (let cond of opt){
                let value = vars[cond.varindex];
                switch(cond.op){
                    case "=":
                        matched = value == cond.value;
                        break;
                    case "!=":
                        matched = value != cond.value;
                        break;
                    case "<":
                        matched = value < cond.value;
                        break;
                    case "<=":
                        matched = value <= cond.value;
                        break;
                    case ">":
                        matched = value > cond.value;
                        break;
                    case ">=":
                        matched = value >= cond.value;
                        break;
                    case "&":
                        matched = (value & cond.value) != 0;
                        break;
                    case "!&":
                        matched = (value & cond.value) == 0;
                        break;
                    case "&=":
                        matched = (value & cond.value) == cond.value;
                        break;
                    default:
                        throw new Error("unknown op" + cond.op);
                }
                if (!matched) {
                    break;
                }
            }
            if (matched) {
                return optindex;
            }
        }
        return -1;
    };
    return {
        match
    };
}
const hardcodes = {
    playeritem: function() {
        return {
            read (state) {
                let byte0 = state.buffer.readUInt8(state.scan++);
                if (byte0 == 0) {
                    return 0;
                }
                let byte1 = state.buffer.readUInt8(state.scan++);
                if (byte1 == 0xff && byte0 == 0xff) {
                    return -1;
                }
                return byte0 << 8 | byte1;
            },
            write (state, value) {
                if (typeof value != "number") {
                    throw new Error("number expected");
                }
                if (value == 0) {
                    state.buffer.writeUInt8(0, state.scan++);
                } else {
                    //replicate explicit 16bit overflow bug since that's what the game does
                    state.buffer.writeUint16BE(value == -1 ? 0xffff : value & 0xffff, state.scan);
                    state.scan += 2;
                }
            },
            getTypescriptType () {
                return "number";
            },
            getJsonSchema () {
                return {
                    type: "integer",
                    minimum: -1,
                    maximum: 0xffff - 0x4000 - 1
                };
            }
        };
    },
    itemvar: function(args) {
        let type = args[0];
        if (typeof type != "string" || ![
            "ref",
            "matcount",
            "colorcount",
            "modelcount"
        ].includes(type)) {
            throw new Error();
        }
        //yes this is hacky af...
        return {
            read (state) {
                let activeitem = typeof state.args.activeitem == "number" ? state.args.activeitem : -1;
                if (type == "ref") {
                    activeitem++;
                    state.args.activeitem = activeitem;
                }
                if (!Array.isArray(state.args.slots)) {
                    throw new Error("");
                }
                let ref = state.args.slots[activeitem];
                if (type == "ref") {
                    return ref;
                } else if (type == "matcount") {
                    return ref?.replaceMaterials?.length ?? 0;
                } else if (type == "colorcount") {
                    return ref?.replaceColors?.length ?? 0;
                } else if (type == "modelcount") {
                    return ref?.models.length;
                } else {
                    throw new Error();
                }
            },
            write () {
            //noop
            },
            getTypescriptType () {
                return type == "ref" ? "any" : "number";
            },
            getJsonSchema () {
                return {
                    type: type == "ref" ? "any" : "integer"
                };
            }
        };
    },
    buildnr: function(args, typedef) {
        return {
            readConst (state) {
                return getClientVersion(state.args);
            },
            read (state) {
                return getClientVersion(state.args);
            },
            write (state, v) {},
            getTypescriptType (indent) {
                return "number";
            },
            getJsonSchema () {
                return {
                    type: "number"
                };
            }
        };
    },
    match: function(args, parent, typedef) {
        let r = {
            read (state) {
                let opcodeprop = {
                    $opcode: 0
                };
                state.stack.push({});
                state.hiddenstack.push(opcodeprop);
                let value = opvalueparser ? opvalueparser.read(state) : 0;
                opcodeprop.$opcode = value;
                let opindex = conditionparser.match(state);
                if (opindex == -1) {
                    throw new Error("no opcode matched");
                }
                let res = optionvalues[opindex].read(state);
                state.stack.pop();
                state.hiddenstack.pop();
                return res;
            },
            write (state, v) {
                let opcodeprop = {
                    $opcode: 0
                };
                state.stack.push({});
                state.hiddenstack.push(opcodeprop);
                if (opvalueparser) {
                    //supporting this would require finding out the type from v
                    if (!opvalueparser.readConst) {
                        throw new Error("non-const or non-reference match value not implemented in write mode");
                    }
                    opcodeprop.$opcode = opvalueparser.readConst(state);
                }
                let opindex = conditionparser.match(state);
                if (opindex == -1) {
                    throw new Error("no opcode matched");
                }
                optionvalues[opindex].write(state, v);
                state.stack.pop();
                state.hiddenstack.pop();
            },
            getTypescriptType (indent) {
                return "(" + optionvalues.map((opt)=>opt.getTypescriptType(indent + "\t")).join("|") + ")";
            },
            getJsonSchema () {
                return {
                    anyOf: optionvalues.map((opt)=>opt.getJsonSchema())
                };
            }
        };
        const resolveReference = function(name, child) {
            let res = {
                stackdepth: child.stackdepth + 1,
                resolve (v, old) {
                    throw new Error("write not supported");
                }
            };
            if (name == "$opcode") {
                return res;
            }
            return buildReference(name, parent, res);
        };
        if (args.length == 1) {
            args = [
                null,
                args[0]
            ];
        }
        if (args.length != 2) {
            throw new Error("match chunks needs 2 arguments");
        }
        if (typeof args[1] != "object") {
            throw new Error("match chunk requires 2n+2 arguments");
        }
        let opvalueparser = args[0] ? buildParser(resolveReference, args[0], typedef) : null;
        let conditionstrings = Object.keys(args[1]);
        let optionvalues = Object.values(args[1]).map((q)=>buildParser(resolveReference, q, typedef));
        let conditionparser = conditionParser(resolveReference, conditionstrings);
        return r;
    },
    footer: function(args, parent, typedef) {
        if (args.length != 2) {
            throw new Error("footer requires length and subtype arguments");
        }
        let lentype = buildParser(parent, args[0], typedef);
        let subtype = buildParser(parent, args[1], typedef);
        return {
            read (state) {
                let len = lentype.read(state);
                let oldscan = state.scan;
                let footstart = state.endoffset - len;
                state.scan = footstart;
                if (debugdata) {
                    // debugdata.opcodes.push({ op: `footer`, index: oldscan, stacksize: state.stack.length + 1, external: { start: state.scan, len: 0 } });
                    debugdata.opcodes.push({
                        op: `footer`,
                        index: oldscan,
                        stacksize: state.stack.length + 1,
                        jump: {
                            to: footstart
                        }
                    });
                }
                let res = subtype.read(state);
                if (debugdata) {
                    debugdata.opcodes.push({
                        op: `footer`,
                        index: state.scan,
                        stacksize: state.stack.length + 1,
                        jump: {
                            to: oldscan
                        }
                    });
                }
                if (state.scan != state.endoffset) {
                    console.log(`didn't read full footer, ${state.endoffset - state.scan} bytes left`);
                }
                state.scan = oldscan;
                state.endoffset = state.endoffset - len;
                return res;
            },
            write (state, v) {
                let oldscan = state.scan;
                subtype.write(state, v);
                let len = state.scan - oldscan;
                state.buffer.copyWithin(state.endoffset - len, oldscan, state.scan);
                state.scan = oldscan;
                state.endoffset -= len;
            },
            getTypescriptType (indent) {
                return subtype.getTypescriptType(indent);
            },
            getJsonSchema () {
                return subtype.getJsonSchema();
            }
        };
    },
    varushortbias: function() {
        return {
            read (s) {
                let firstByte = s.buffer.readUInt8(s.scan++);
                if ((firstByte & 0x80) == 0) {
                    return firstByte - 0x40;
                }
                let secondByte = s.buffer.readUInt8(s.scan++);
                return ((firstByte & 0x7f) << 8 | secondByte) - 0x4000;
            },
            write (s, v) {
                if (typeof v != "number") {
                    throw new Error("number expected");
                }
                if (v < 0x40 && v >= -0x40) {
                    s.buffer.writeUInt8(v + 0x40, s.scan);
                    s.scan += 1;
                } else {
                    s.buffer.writeInt16BE((v | 0x8000) + 0x4000, s.scan);
                    s.scan += 2;
                }
            },
            getTypescriptType (indent) {
                return "number";
            },
            getJsonSchema () {
                return {
                    type: "number"
                };
            }
        };
    },
    "tailed varushort": function(args, parent, typedef) {
        const overflowchunk = 0x7fff;
        return {
            read (state) {
                let sum = 0;
                while(true){
                    let byte0 = state.buffer.readUint8(state.scan++);
                    let v;
                    if ((byte0 & 0x80) == 0) {
                        v = byte0;
                    } else {
                        let byte1 = state.buffer.readUint8(state.scan++);
                        v = (byte0 & 0x7f) << 8 | byte1;
                    }
                    sum += v;
                    if (v != overflowchunk) {
                        return sum;
                    }
                }
            },
            write (state, v) {
                if (typeof v != "number") {
                    throw new Error("number expected");
                }
                while(v >= 0){
                    let chunk = Math.min(overflowchunk, v);
                    if (chunk < 0x80) {
                        state.buffer.writeUint8(chunk, state.scan++);
                    } else {
                        state.buffer.writeUint16BE(chunk | 0x8000, state.scan);
                        state.scan += 2;
                    }
                    v -= chunk;
                }
            },
            getTypescriptType (indent) {
                return "number";
            },
            getJsonSchema () {
                return {
                    type: "number"
                };
            }
        };
    },
    "legacy_maptile": function(args, parent, typedef) {
        return {
            read (state) {
                let res = {
                    flags: 0,
                    shape: null,
                    overlay: null,
                    settings: null,
                    underlay: null,
                    height: null
                };
                while(true){
                    let op = state.buffer.readUint8(state.scan++);
                    if (op == 0) {
                        break;
                    }
                    if (op == 1) {
                        res.height = state.buffer.readUint8(state.scan++);
                        break;
                    }
                    if (op >= 2 && op <= 49) {
                        res.shape = op - 2;
                        res.overlay = state.buffer.readUint8(state.scan);
                        state.scan += 1;
                    }
                    if (op >= 50 && op <= 81) {
                        res.settings = op - 49;
                    }
                    if (op >= 82) {
                        res.underlay = op - 81;
                    }
                }
                return res;
            },
            write (state) {
                throw new Error("not implemented");
            },
            getTypescriptType (indent) {
                let newindent = indent + "\t";
                return `{\n` + `${newindent}flags: number,\n` + `${newindent}shape: number | null,\n` + `${newindent}overlay: number | null,\n` + `${newindent}settings: number | null,\n` + `${newindent}underlay: number | null,\n` + `${newindent}height: number | null,\n` + `${indent}}`;
            },
            getJsonSchema () {
                return {
                    type: "any"
                };
            }
        };
    },
    scriptopt: function(args, parent, typedef) {
        return {
            read (state) {
                if (debugdata) {
                    debugdata.opcodes.push({
                        op: "opcode",
                        index: state.scan,
                        stacksize: state.stack.length + 1
                    });
                }
                let deob = state.args.clientScriptDeob;
                if (!deob || !deob.loaded) {
                    throw new Error("clientScriptDeob not set in args");
                }
                return deob.loaded.readOpcode(state);
            },
            write (state, v) {
                let deob = state.args.clientScriptDeob;
                if (!deob || !deob.loaded) {
                    throw new Error("clientScriptDeob not set in args");
                }
                deob.loaded.writeOpCode(state, v);
            },
            getJsonSchema () {
                return {
                    type: "object",
                    properties: {
                        opcode: {
                            type: "number"
                        },
                        imm: {
                            type: "number"
                        },
                        imm_obj: {
                            oneOf: [
                                {
                                    type: "number"
                                },
                                {
                                    type: "string"
                                },
                                {
                                    type: "null"
                                }
                            ]
                        }
                    }
                };
            },
            getTypescriptType (indent) {
                let newindent = indent + "\t";
                return `{\n` + `${newindent}opcode:number,\n` + `${newindent}imm:number,\n` + `${newindent}imm_obj:number|string|[number,number]|null,\n` + `${indent}}`;
            }
        };
    }
};
function getClientVersion(args) {
    if (typeof args.clientVersion != "number") {
        throw new Error("client version not set");
    }
    return args.clientVersion;
}
const numberTypes = {
    ubyte: {
        read (s) {
            let r = s.buffer.readUInt8(s.scan);
            s.scan += 1;
            return r;
        },
        write (s, v) {
            s.buffer.writeUInt8(v, s.scan);
            s.scan += 1;
        },
        min: 0,
        max: 255
    },
    byte: {
        read (s) {
            let r = s.buffer.readInt8(s.scan);
            s.scan += 1;
            return r;
        },
        write (s, v) {
            s.buffer.writeInt8(v, s.scan);
            s.scan += 1;
        },
        min: -128,
        max: 127
    },
    ushort: {
        read (s) {
            let r = s.buffer.readUInt16BE(s.scan);
            s.scan += 2;
            return r;
        },
        write (s, v) {
            s.buffer.writeUInt16BE(v, s.scan);
            s.scan += 2;
        },
        min: 0,
        max: 2 ** 16 - 1
    },
    short: {
        read (s) {
            let r = s.buffer.readInt16BE(s.scan);
            s.scan += 2;
            return r;
        },
        write (s, v) {
            s.buffer.writeInt16BE(v, s.scan);
            s.scan += 2;
        },
        min: -(2 ** 15),
        max: 2 ** 15 - 1
    },
    uint: {
        read (s) {
            let r = s.buffer.readUInt32BE(s.scan);
            s.scan += 4;
            return r;
        },
        write (s, v) {
            s.buffer.writeUInt32BE(v, s.scan);
            s.scan += 4;
        },
        min: 0,
        max: 2 ** 32 - 1
    },
    int: {
        read (s) {
            let r = s.buffer.readInt32BE(s.scan);
            s.scan += 4;
            return r;
        },
        write (s, v) {
            s.buffer.writeInt32BE(v, s.scan);
            s.scan += 4;
        },
        min: -(2 ** 31),
        max: 2 ** 31 - 1
    },
    uint_le: {
        read (s) {
            let r = s.buffer.readUInt32LE(s.scan);
            s.scan += 4;
            return r;
        },
        write (s, v) {
            s.buffer.writeUint32LE(v, s.scan);
            s.scan += 4;
        },
        min: 0,
        max: 2 ** 32 - 1
    },
    ushort_le: {
        read (s) {
            let r = s.buffer.readUInt16LE(s.scan);
            s.scan += 2;
            return r;
        },
        write (s, v) {
            s.buffer.writeUint16LE(v, s.scan);
            s.scan += 2;
        },
        min: 0,
        max: 2 ** 16 - 1
    },
    utribyte: {
        read (s) {
            let r = s.buffer.readUIntBE(s.scan, 3);
            s.scan += 3;
            return r;
        },
        write (s, v) {
            s.buffer.writeUintBE(v, s.scan, 3);
            s.scan += 3;
        },
        min: 0,
        max: 2 ** 24 - 1
    },
    float: {
        read (s) {
            let r = s.buffer.readFloatBE(s.scan);
            s.scan += 4;
            return r;
        },
        write (s, v) {
            s.buffer.writeFloatBE(v, s.scan);
            s.scan += 4;
        },
        min: Number.MIN_VALUE,
        max: Number.MAX_VALUE
    },
    varushort: {
        read (s) {
            let firstByte = s.buffer.readUInt8(s.scan++);
            if ((firstByte & 0x80) == 0) {
                return firstByte;
            }
            let secondByte = s.buffer.readUInt8(s.scan++);
            return (firstByte & 0x7f) << 8 | secondByte;
        },
        write (s, v) {
            if (v < 0x80) {
                s.buffer.writeUInt8(v, s.scan);
                s.scan += 1;
            } else {
                s.buffer.writeUint16BE(v | 0x8000, s.scan);
                s.scan += 2;
            }
        },
        min: 0,
        max: 2 ** 15 - 1
    },
    varshort: {
        read (s) {
            let firstByte = s.buffer.readUInt8(s.scan++);
            if ((firstByte & 0x80) == 0) {
                //sign extend from 7nth bit (>> fills using 32th bit)
                return firstByte << 32 - 7 >> 32 - 7;
            }
            let secondByte = s.buffer.readUInt8(s.scan++);
            return ((firstByte & 0x7f) << 8 | secondByte) << 32 - 15 >> 32 - 15;
        },
        write (s, v) {
            if (v < 0x40 && v >= -0x40) {
                s.buffer.writeUInt8(v & 0x7f, s.scan);
                s.scan += 1;
            } else {
                s.buffer.writeInt16BE(v | 0x8000, s.scan);
                s.scan += 2;
            }
        },
        min: -(2 ** 14),
        max: 2 ** 14 - 1
    },
    varuint: {
        read (s) {
            let firstWord = s.buffer.readUInt16BE(s.scan);
            s.scan += 2;
            if ((firstWord & 0x8000) == 0) {
                return firstWord;
            } else {
                let secondWord = s.buffer.readUInt16BE(s.scan);
                s.scan += 2;
                return (firstWord & 0x7fff) << 16 | secondWord;
            }
        },
        write (s, v) {
            if (v < 0x8000) {
                s.buffer.writeUInt16BE(v, s.scan);
                s.scan += 2;
            } else {
                //unsigned right shift to cast to uint32 again
                s.buffer.writeUint32BE((v | 0x80000000) >>> 0, s.scan);
                s.scan += 4;
            }
        },
        min: 0,
        max: 2 ** 31 - 1
    },
    varint: {
        read (s) {
            let firstWord = s.buffer.readUInt16BE(s.scan);
            s.scan += 2;
            if ((firstWord & 0x8000) == 0) {
                //sign extend from 7nth bit (>> fills using 32th bit)
                return firstWord << 32 - 15 >> 32 - 15;
            }
            let secondWord = s.buffer.readUInt16BE(s.scan);
            s.scan += 2;
            return ((firstWord & 0x7fff) << 16 | secondWord) << 32 - 31 >> 32 - 31;
        },
        write (s, v) {
            if (v < 0x4000 && v >= -0x4000) {
                //reset bits 31-15
                s.buffer.writeUInt16BE(v & 0x7fff, s.scan);
                s.scan += 2;
            } else {
                s.buffer.writeInt32BE(v | 0x800000, s.scan);
                s.scan += 4;
            }
        },
        min: -(2 ** 30),
        max: 2 ** 30 - 1
    },
    // newer encoding that can fit any uint and stores it in 1-5 bytes
    denseuint: {
        read (state) {
            let value = 0;
            let bitcount = 0;
            while(true){
                let byte = state.buffer.readUint8(state.scan++);
                value |= (byte & 0x7f) << bitcount;
                bitcount += 7;
                if ((byte & 0x80) == 0) {
                    break;
                }
            }
            return value;
        },
        write (state, v) {
            if (typeof v != "number") {
                throw new Error("number expected");
            }
            let value = v;
            while(value){
                let byte = value & 0x7f;
                value >>= 7;
                if (value) {
                    byte |= 0x80;
                }
                state.buffer.writeUint8(byte, state.scan++);
            }
        },
        min: 0,
        max: 2 ** 32 - 1
    }
};
const parserPrimitives = {
    ...Object.fromEntries(Object.entries(numberTypes).map(([k, e])=>[
            k,
            {
                read: e.read,
                write: (s, v)=>{
                    if (typeof v != "number" || v > e.max || v < e.min) {
                        throw new Error();
                    }
                    e.write(s, v);
                },
                getJsonSchema () {
                    return {
                        type: "number",
                        maximum: e.max,
                        minimum: e.min
                    };
                },
                getTypescriptType (indent) {
                    return "number";
                }
            }
        ])),
    bool: {
        read (s) {
            let r = s.buffer.readUInt8(s.scan++);
            if (r != 0 && r != 1) {
                throw new Error("1 or 0 expected boolean value");
            }
            return r != 0;
        },
        write (s, v) {
            if (typeof v != "boolean") {
                throw new Error("boolean expected");
            }
            s.buffer.writeUInt8(+v, s.scan++);
        },
        getJsonSchema () {
            return {
                type: "boolean"
            };
        },
        getTypescriptType (indent) {
            return "boolean";
        }
    },
    string: stringParser([]),
    paddedstring: stringParser([
        0
    ])
};
const parserFunctions = {
    ref: referenceValueParser,
    accum: intAccumolatorParser,
    opt: optParser,
    chunkedarray: chunkedArrayParser,
    bytesleft: bytesRemainingParser,
    buffer: bufferParser,
    nullarray: arrayNullTerminatedParser,
    array: arrayParser,
    struct: structParserFactory(false),
    ministruct: structParserFactory(true),
    tuple: tupleParserFactory(false),
    typedtuple: tupleParserFactory(true),
    typed: typedParser,
    ...hardcodes,
    ...parserPrimitives
};


/***/ },

/***/ "comment-json"
/*!********************************************!*\
  !*** external {"commonjs":"comment-json"} ***!
  \********************************************/
(module) {

"use strict";
module.exports = require("comment-json");

/***/ },

/***/ "fs"
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
(module) {

"use strict";
module.exports = require("fs");

/***/ },

/***/ "path"
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
(module) {

"use strict";
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
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
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
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!*******************************!*\
  !*** ./src/buildfiletypes.ts ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fs */ "fs");
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! path */ "path");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _parser_opcode_reader__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parser/opcode_reader */ "./src/parser/opcode_reader.ts");
/* harmony import */ var comment_json__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! comment-json */ "comment-json");
/* harmony import */ var comment_json__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(comment_json__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _parser_jsonschemas__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./parser/jsonschemas */ "./src/parser/jsonschemas.ts");





async function buildFileTypes() {
    function compilefolder(subdir) {
        //generate config file metas
        let files = fs__WEBPACK_IMPORTED_MODULE_0__.readdirSync(path__WEBPACK_IMPORTED_MODULE_1__.resolve(basedir, subdir), {
            withFileTypes: true
        });
        if (files.some((f)=>f.isFile() && !path__WEBPACK_IMPORTED_MODULE_1__.basename(f.name).match(/\.jsonc?$/))) {
            console.error("non-json files matched, is path wrong?");
        }
        let outsubdir = path__WEBPACK_IMPORTED_MODULE_1__.resolve(outdir, subdir);
        fs__WEBPACK_IMPORTED_MODULE_0__.mkdirSync(outsubdir, {
            recursive: true
        });
        const typedef = comment_json__WEBPACK_IMPORTED_MODULE_3__.parse(fs__WEBPACK_IMPORTED_MODULE_0__.readFileSync(path__WEBPACK_IMPORTED_MODULE_1__.resolve(basedir, "typedef.jsonc"), "utf-8"), undefined, true);
        for (let file of files){
            if (file.isDirectory()) {
                compilefolder(path__WEBPACK_IMPORTED_MODULE_1__.join(subdir, file.name));
                continue;
            }
            if (file.isFile()) {
                let srcfile = path__WEBPACK_IMPORTED_MODULE_1__.resolve(basedir, subdir, file.name);
                let objname = path__WEBPACK_IMPORTED_MODULE_1__.parse(srcfile).name;
                let jsontext = fs__WEBPACK_IMPORTED_MODULE_0__.readFileSync(srcfile, "utf8");
                const opcodes = comment_json__WEBPACK_IMPORTED_MODULE_3__.parse(jsontext, undefined, true);
                var typesfile = "// GENERATED DO NOT EDIT\n" + "// This source data is located at '" + path__WEBPACK_IMPORTED_MODULE_1__.relative(outsubdir, srcfile) + "'\n" + "// run `npm run filetypes` to rebuild\n\n";
                typesfile += "export type " + objname + " = ";
                try {
                    typesfile += _parser_opcode_reader__WEBPACK_IMPORTED_MODULE_2__.buildParser(null, opcodes, typedef).getTypescriptType("") + ";\n";
                } catch (e) {
                    //console.error(e);
                    typesfile += "any;\n";
                    typesfile += "// " + e.toString().replace(/\n/g, "\n//");
                }
                //I'm sorry, git made me do this
                // typesfile = typesfile.replace(/(?<!\r)\n/g, "\r\n");
                let outfile = path__WEBPACK_IMPORTED_MODULE_1__.resolve(outsubdir, objname + ".d.ts");
                fs__WEBPACK_IMPORTED_MODULE_0__.writeFileSync(outfile, typesfile);
            // console.log("would write ", outfile);
            }
        }
    }
    let basedir = path__WEBPACK_IMPORTED_MODULE_1__.resolve("./src/opcodes");
    let outdir = path__WEBPACK_IMPORTED_MODULE_1__.resolve("./generated");
    compilefolder("");
    //other one off files
    fs__WEBPACK_IMPORTED_MODULE_0__.writeFileSync(path__WEBPACK_IMPORTED_MODULE_1__.resolve(outdir, "maprenderconfig.schema.json"), JSON.stringify(_parser_jsonschemas__WEBPACK_IMPORTED_MODULE_4__.maprenderConfigSchema, undefined, "\t"));
}
buildFileTypes();

})();

const __webpack_export_target__ = exports;
for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;