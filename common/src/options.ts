export namespace Options {
	export type GameOptions = {
		width: number;
		height: number;
		gameHeight: number;

		scale: number;

		tiles: {
			width: number;
			height: number;
		};

		colors: {
			grid: number;
			outline: number;
			background: number;
			backgroundAlpha: number;
			path: number;
			completePath: number;
			cursor: number;
		};

		startingPoints: {x: number, y: number}[];
		endingPoints: {x: number, y: number, d: number }[];

		circleRadius: number;
		pointerRadius: number;
	}

	export let defaultOptions = {
		width : 800,
		height: 650,

		gameHeight: 512,

		scale: 0.5,

		tiles: {
			width: 6,
			height: 6,
		},

		startingPoints: [{x: 0, y: 0}],
		endingPoints: [{y: 3, x: 0, d: 2}],

		circleRadius: 30,
		pointerRadius: 16,

		colors: {
			grid: 0x303F9F,
			outline: 0x9FA8DA,
			background: 0x5C6BC0,
			backgroundAlpha: 1,
			path: 0x9FA8DA,
			completePath: 0xE8EAF6,
			cursor: 0x9E9E9E,
		},
	}

	export const TimeLimit = 6 * 60 * 1000 + 34 * 1000;
}