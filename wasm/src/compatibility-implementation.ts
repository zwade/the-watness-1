declare function assert<T>(arg: T, msg?: string): T;
declare function unreachable(): never;
declare function parseI32(x: string): i32;
declare function changetype<T>(x: any): T;
declare function load<T>(x: T): T;

declare module memory {
	function copy(a: any, b: any, c: any): void;
}

declare module NativeMath {
	function seedRandom(seed: i32): void;
}

interface ArrayBuffer {
	data: string;
}

interface SharedArrayBuffer {
	data: string;
}

interface String {
	fromUTF8(a: any, b: any): string;
	toUTF8(): any;
	lengthUTF8: number;
}

interface StringConstructor {
	fromUTF8(a: any, b: any): string;
}

interface console {
	logS(...args: any[]): void;
	logI(...args: any[]): void;
}

declare module NodeJS {
	interface Global {
		assert<T>(arg: T, msg?: string): T;
		unreachable(): never;
		parseI32(x: string): i32;
		changetype<T>(x: any): T;
		load<T>(x: T): T;

		memory: {
			copy(a: any, b: any, c: any): void;
		}

		NativeMath: {
			seedRandom(seed: i32): void;
		}
	}
}


global.assert = (x) => x;
global.unreachable = () => { throw new Error("Unreachable") };
global.parseI32 = parseInt;
global.changetype = (x) => x;
global.load = (x) => x;
global.memory = { copy: () => undefined }
global.NativeMath = { seedRandom: () => undefined }

let Module = require('module');
let originalRequire = Module.prototype.require;

Module.prototype.require = function(script){
  //do your thing here
	if (script === "allocator/arena") {
		return {};
	} else if (script === "../../node_modules/assemblyscript-json/assembly/decoder") {
		class JSONDecoder {}
		class JSONHandler {}
		return {
			JSONDecoder,
			JSONHandler,
		}
	} else if (script === "../../node_modules/assemblyscript-json/assembly/encoder") {
		class JSONEncoder {}
		return {
			JSONEncoder,
		}
	} else {
		return originalRequire.apply(this, arguments);
	}
};

(console as any).logS = console.log.bind(console);
(console as any).logI = console.log.bind(console);