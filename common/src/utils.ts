export namespace Utils {
	//Stolen from http://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately shamelessly
	export function HSVtoRGB(h: number, s: number, v: number): number;
	export function HSVtoRGB(hsv: {h: number, s: number, v: number}): number;
	export function HSVtoRGB(...args: any): number {
		let r: number, g: number, b: number, i: number, f: number, p: number, q: number, t: number, h: number, s: number, v: number;
		if (args.length === 1) {
			h = args.h;
			s = args.s;
			v = args.v;
		} else {
			[ h, s, v ] = args;
		}
		i = Math.floor(h * 6);
		f = h * 6 - i;
		p = v * (1 - s);
		q = v * (1 - f * s);
		t = v * (1 - (1 - f) * s);
		switch (i % 6) {
			case 0: r = v, g = t, b = p; break;
			case 1: r = q, g = v, b = p; break;
			case 2: r = p, g = v, b = t; break;
			case 3: r = p, g = q, b = v; break;
			case 4: r = t, g = p, b = v; break;
			case 5: r = v, g = p, b = q; break;
			default:
				throw new Error("unreachable");
		}
		return 	Math.round(r * 255) << 16 | 
			Math.round(g * 255) << 8  |
			Math.round(b * 255)
	}

	//Stolen from http://stackoverflow.com/questions/8022885/rgb-to-hsv-color-in-javascript just as shamelessly
	//Modified to accept hex colors
	export function RGBtoHSV (c: number) {
		let r = c >> 16 & 0xFF
		let g = c >> 8  & 0xFF
		let b = c       & 0xFF
		let rr, gg, bb,
			h, s,
			v = Math.max(r, g, b),
			diff = v - Math.min(r, g, b),
			diffc = function(c: number){
				return (v - c) / 6 / diff + 1 / 2;
			};

		if (diff == 0) {
			h = s = 0;
		} else {
			s = diff / v;
			rr = diffc(r);
			gg = diffc(g);
			bb = diffc(b);

			if (r === v) {
				h = bb - gg;
			} else if (g === v) {
				h = (1 / 3) + rr - bb;
			} else if (b === v) {
				h = (2 / 3) + gg - rr;
			} else {
				throw new Error("Unreachable");
			}

			if (h < 0) {
				h += 1;
			}else if (h > 1) {
				h -= 1;
			}
		}
		return {
			h: h,
			s: s,
			v: v/256
		};
	}

	export let genShuff = function(s: number) {
		let shuffle = <number[]>[]
		for (let i = 0; i < s; i++) {
			shuffle[i] = i
		}
		for (let i = 0; i < s; i++) {
			let l = Math.floor(Math.random() * (s - i))
			let tmp = shuffle[l + i]
			shuffle[l + i] = shuffle[i]
			shuffle[i] = tmp
		}
		return shuffle
	}

	let typeToColorClosure = () => {
		let colors = [
			0x26C6DA,
			0xef5350,
			0x8D6E63,
			0x00796B,
			0x283593,
			0xF9A825,
			0xFFEB3B,
			0x8BC34A,
			0xE040FB,
		]
		let shuff = genShuff(colors.length);

		return function(t: number) {
			if (t < colors.length) {
				return colors[shuff[t]]
			}
			return HSVtoRGB( ((70 * (t + 1)) % 359) / 360, 1, 0.9 )
		}
	}

	export let typeToColor = typeToColorClosure();

	export function gaussian () {
		let n = 100
		let sum = 0
		for (let i = 0; i < n; i++) {
			sum += Math.random()
		}
		sum = sum - n * 0.5
		sum = sum / (Math.sqrt(n * 1/12))

		return sum
	}

	export let copyPath = function<T extends {}>(path: T[]): T[] {
		return path.map(x => ({ ...x }));
	}
}
