import {GameObject} from "./gameobject";

export type SushiType = "toro" | "salmon" | "ebi";

export interface SushiParameterObject {
	sprite: g.Sprite;
	score: number;
}

const DEFAULT_CHIP_SIZE = 48;

export class Sushi implements GameObject {
	private sprite: g.Sprite;
	private score: number;

	constructor(params: SushiParameterObject) {
		this.sprite = params.sprite;
		this.score = params.score;
	}

	getCommonArea(): g.CommonArea {
		return {
			x: this.sprite.x,
			y: this.sprite.y,
			width: this.sprite.width,
			height: this.sprite.height
		};
	}

	register(scene: g.Scene): void {
		scene.append(this.sprite);
	}

	unregister(scene: g.Scene): void {
		scene.remove(this.sprite);
	}

	getScore(): number {
		return this.score;
	}
}

export class SushiFactory {
	static create(scene: g.Scene, sushiType: SushiType, x: number, y: number): Sushi {
		let assetId;
		let score;
		switch (sushiType) {
			case "toro":
				assetId = "sushi_toro";
				score = 2500;
				break;
			case "salmon":
				assetId = "sushi_salmon";
				score = 500;
				break;
			default:
				assetId = "sushi_ebi";
				score = 100;
				break;
		}
		return new Sushi({
			sprite: new g.Sprite({
				scene: scene,
				src: scene.assets[assetId] as g.ImageAsset,
				width: DEFAULT_CHIP_SIZE * 5 / 7,
				height: DEFAULT_CHIP_SIZE,
				srcWidth: 100,
				srcHeight: 140,
				x,
				y
			}),
			score
		});
	}

	static getRandomSushiType(): SushiType {
		const num = g.game.random.get(0, 99);
		if (num < 6) {
			return "toro";
		} else if (num < 30) {
			return "salmon";
		} else {
			return "ebi";
		}
	}
}
