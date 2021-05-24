import * as PIXI from "pixi.js";

import { Utils } from "@watness/common/src";

//Constraints

let { genShuff, typeToColor, gaussian, copyPath } = Utils;

export namespace Constraint {
	export type Serialized = { x: number, y: number, name: string, classification: number; };
};

export class Constraint {
	public x: number;
	public y: number;
	public classification: number;
	public name: string;
	public serializedArguments: string;

	constructor (x: number, y: number, classification: number, name: string, serializedArguments: string) {
		this.x = x;
		this.y = y;
		this.classification = classification;
		this.name = name;
		this.serializedArguments = serializedArguments;
	}

	public col (x: number, y: number, r: number, classification: number, name: string): PIXI.Graphics {
		throw new Error("Uncallable");
	}

	public serialize (): Constraint.Serialized {
		let { x, y, classification, name } = this;

		return { x, y, classification, name };
	}
}

export class Constraint1 extends Constraint {
	constructor (x: number, y: number, classification: number, name: string | null, serializedArguments: string) {
		super(x, y, classification, name || "constraint1", serializedArguments);
	}

	public col (x: number, y: number, r: number, classification: number, name: string): PIXI.Graphics {
		let sprite = new PIXI.Graphics()
		let color = typeToColor(classification)
		sprite.beginFill(color)
		sprite.lineStyle(2, 0x000000);
		sprite.drawCircle(x, y, r * 1.5);
		sprite.endFill()
		sprite.cacheAsBitmap = true
		return sprite
	}
}

export class Constraint2 extends Constraint {
	constructor (x: number, y: number, classification: number, name: string | null, serializedArguments: string) {
		super(x, y, classification, name || "constraint2", serializedArguments);
	}

	public col (x: number, y: number, r: number, classification: number, name: string): PIXI.Graphics {
		let sprite = new PIXI.Graphics()
		let color = typeToColor(classification)
		sprite.beginFill(color)

		/*
		//Yay geometry!
		let s = 2 / (2 + Math.sqrt(2)) * r
		let h = r - s

		//On the one hand, I should probably iterate over these
		//On the other hand, that sounds like more work than typing these out
		
		sprite.moveTo(Math.round(x + 0), Math.round(y + r + h))
		sprite.lineTo(Math.round(x + h), Math.round(y + r)) 
		sprite.lineTo(Math.round(x + r), Math.round(y + r))
		sprite.lineTo(Math.round(x + r), Math.round(y + h))
		sprite.lineTo(Math.round(x + r + h), Math.round(y + 0))
		sprite.lineTo(Math.round(x + r), Math.round(y - h))
		sprite.lineTo(Math.round(x + r), Math.round(y - r))
		sprite.lineTo(Math.round(x + h), Math.round(y - r))
		sprite.lineTo(Math.round(x - 0), Math.round(y - r - h))
		sprite.lineTo(Math.round(x - h), Math.round(y - r))
		sprite.lineTo(Math.round(x - r), Math.round(y - r))
		sprite.lineTo(Math.round(x - r), Math.round(y - h))
		sprite.lineTo(Math.round(x - r - h), Math.round(y - 0))
		sprite.lineTo(Math.round(x - r), Math.round(y + h))
		sprite.lineTo(Math.round(x - r), Math.round(y + r))
		sprite.lineTo(Math.round(x - h), Math.round(y + r))
		sprite.lineTo(Math.round(x + 0), Math.round(y + r + h))
		*/

		sprite.lineStyle(2, 0x000000);
		sprite.drawCircle(x-r, y, r * 0.7);
		sprite.drawCircle(x+r, y, r * 0.7);

		sprite.endFill()
		sprite.cacheAsBitmap = true
		return sprite
	}
}

export class Constraint3 extends Constraint {
	private shape: number[][];

	constructor (x: number, y: number, classification: number, name: string | null, serializedArguments: string) {
		super(x, y, classification, name || "constraint3", serializedArguments);
		this.shape = 
			JSON.parse(serializedArguments)
			.map((row: any) => 
				row.map((args: any) => parseInt(args.value)));
	}

	public col (x: number, y: number, r: number, classification: number, name: string): PIXI.Graphics {
		let sprite = new PIXI.Graphics()
		let bh = this.shape.length
		let bw = this.shape[0].length
		let color = 0xFFEB3B
		sprite.beginFill(color)
		sprite.lineStyle(1, 0x000000);

		for (let i = 0; i < bh; i++) {
			for (let j = 0; j < bw; j++) {
				if (this.shape[i][j]) {
					let cx = (bw - 1)/2 - j
					let cy = (bh - 1)/2 - i
					sprite.drawRect(Math.round(x - cx * r*3/4 - r/3), Math.round(y - cy * r*3/4 - r/3), Math.round(r*2/3), Math.round(r*2/3))
				}
			}
		}
		sprite.endFill()
		//let blur = new PIXI.filters.BlurFilter()
		//blur.blur = 0.5;
		//sprite.filters = [blur]
		//sprite.cacheAsBitmap = true
		return sprite
	}
}

export class Constraint4 extends Constraint {
	private value: number;
	constructor (x: number, y: number, classification: number, name: string | null, serializedArguments: string) {
		super(x, y, classification, name || "Constraint4", serializedArguments);
		this.value = parseInt(serializedArguments);
	}

	public col (x: number, y: number, r: number, classification: number, name: string): PIXI.Graphics {
		let sprite = new PIXI.Graphics();
		let color = 0xB2EBF2;
		sprite.beginFill(color);
		sprite.lineStyle(1, 0x000000);

		for (let i = 0; i < this.value; i++) {
			let cx = Math.sin(Math.PI/2 * i);
			let cy = Math.cos(Math.PI/2 * i) 
			sprite.drawRect(Math.round(x - cx * r*3/4 - r/3), Math.round(y - cy * r*3/4 - r/3), Math.round(r*2/3), Math.round(r*2/3))
		}

		sprite.endFill();
		return sprite;
	}
}

export class Constraint5 extends Constraint {
	constructor (x: number, y: number, classification: number, name: string | null, serializedArguments: string) {
		super(x, y, classification, name || "Constraint5", serializedArguments);
	}

	public col (x: number, y: number, r: number, classification: number, name: string): PIXI.Graphics {
		let sprite = new PIXI.Graphics();
		let color = 0x673AB7;
		
		sprite.beginFill(color);
		sprite.lineStyle(2, 0x000000);
		sprite.moveTo(x + 0, y + r);
		sprite.lineTo(x + r, y - r);
		sprite.lineTo(x - r, y - r);
		sprite.lineTo(x + 0, y + r);
		sprite.endFill()
		return sprite;
	}
}

export class Constraint6 extends Constraint {
	constructor (x: number, y: number, classification: number, name: string | null, serializedArguments: string) {
		super(x, y, classification, name || "Constraint6", serializedArguments);
	}

	public col (x: number, y: number, r: number, classification: number, name: string): PIXI.Graphics {
		let sprite = new PIXI.Graphics();
		sprite.beginFill(Utils.typeToColor(classification));
		sprite.lineStyle(2, 0x000000);
		sprite.drawRoundedRect(x - r, y - r * 2 / 3, 2 * r, 4 / 3 * r, r * 1 / 4);
		sprite.endFill()
		return sprite;
	}
}