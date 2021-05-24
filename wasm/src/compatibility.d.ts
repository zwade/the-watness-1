declare type i8  = number;
declare type i16 = number;
declare type i32 = number;
declare type i64 = number;
declare type f32 = number;
declare type f64 = number;
declare type usize = number;
declare type bool = boolean;

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
