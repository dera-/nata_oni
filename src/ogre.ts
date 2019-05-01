import {Direction} from "./direction";
import Collision = g.Collision;
import {GameObject} from "./gameobject";

export interface OgreParameterObject {
	sprite: g.FrameSprite;
	bikkuriSprite: g.Sprite;
	searchRect: g.FilledRect;
}

const MOVING_DOWN = [0, 1, 2, 3];
const MOVING_LEFT = [4, 5, 6, 7];
const MOVING_RIGHT = [8, 9, 10, 11];
const MOVING_UP = [12, 13, 14, 15];
const NORMAL_SPEED = 20;
const HIGH_SPEED = 40;
const DEFAULT_CHIP_SIZE = 48;
const DISTANCE_TO_MOVE = 150;
const COLLISION_DISTANCE = 5;

export class Ogre implements GameObject {
	private sprite: g.FrameSprite;
	private bikkuriSprite: g.Sprite;
	private searchRect: g.FilledRect;
	private speed: number;
	private findFlag: boolean;
	private searchPlace: g.CommonOffset;

	constructor(params: OgreParameterObject) {
		this.sprite = params.sprite;
		this.bikkuriSprite = params.bikkuriSprite;
		this.searchRect = params.searchRect;
		this.speed = NORMAL_SPEED;
		this.findFlag = false;
	}

	getCommonArea(): g.CommonArea {
		return {
			x: this.sprite.x,
			y: this.sprite.y,
			width: this.sprite.width,
			height: this.sprite.height
		};
	}

	getSearchArea(): g.CommonArea {
		return {
			x: this.searchRect.x,
			y: this.searchRect.y,
			width: this.searchRect.width,
			height: this.searchRect.height
		};
	}

	register(scene: g.Scene): void {
		scene.apeend(this.sprite);
		scene.append(this.bikkuriSprite);
		scene.append(this.searchRect);
	}

	find(): void {
		this.speed = HIGH_SPEED;
		this.findFlag = true;
		this.searchRect.hide();
		this.bikkuriSprite.show();
	}

	lost(): void {
		this.speed = NORMAL_SPEED;
		this.findFlag = false;
		this.bikkuriSprite.hide();
		this.searchRect.show();
		this.search(true);
	}

	isFound(): boolean {
		return this.findFlag;
	}

	search(force: boolean = false): void {
		if (!force
			&& this.searchPlace
			&& !g.Collision.within(this.sprite.x, this.sprite.y, this.searchPlace.x, this.searchPlace.y, COLLISION_DISTANCE)) {
			return;
		}
		const directions: Direction[] = ["right", "left", "up", "down"];
		const index = g.game.random.get(0, directions.length - 1);
		switch (directions[index]) {
			case "right":
				const limit = g.game.width - this.sprite.width;
				const target = this.sprite.x + DISTANCE_TO_MOVE;
				const reach = target > limit ? limit : target;
				this.searchPlace = {x: reach, y: this.sprite.y};
				this.searchRect.x = this.sprite.x + this.sprite.width;
				this.searchRect.y = this.sprite.y;
				this.searchRect.width = DISTANCE_TO_MOVE;
				this.searchRect.height = this.sprite.height;
				break;
			case "left":
				const target = this.sprite.x - DISTANCE_TO_MOVE;
				const reach = target < 0 ? 0 : target;
				this.searchPlace = {x: reach, y: this.sprite.y};
				this.searchRect.x = this.sprite.x - DISTANCE_TO_MOVE;
				this.searchRect.y = this.sprite.y;
				this.searchRect.width = DISTANCE_TO_MOVE;
				this.searchRect.height = this.sprite.height;
				break;
			case "up":
				const target = this.sprite.y - DISTANCE_TO_MOVE;
				const reach = target < 0 ? 0 : target;
				this.searchPlace = {x: this.sprite.x, y: reach};
				this.searchRect.x = this.sprite.x;
				this.searchRect.y = this.sprite.y - DISTANCE_TO_MOVE;
				this.searchRect.width = this.sprite.width;
				this.searchRect.height = DISTANCE_TO_MOVE;
				break;
			case "down":
				const limit = g.game.height - this.sprite.height;
				const target = this.sprite.y + DISTANCE_TO_MOVE;
				const reach = target > limit ? limit : target;
				this.searchPlace = {x: this.sprite.x, y: reach};
				this.searchRect.x = this.sprite.x;
				this.searchRect.y = this.sprite.y + this.sprite.height;
				this.searchRect.width = this.sprite.width;
				this.searchRect.height = DISTANCE_TO_MOVE;
				break;
			default:
				this.searchPlace = {x: this.sprite.x, y: this.sprite.y};
				break;
		}
		this.searchRect.modified();
	}

	moveToSearch(): void {
		this.move(this.searchPlace.x, this.searchPlace.y);
	}

	moveToTarget(targetPlace: g.CommonOffset): void {
		this.move(targetPlace.x, targetPlace.y);
	}

	private move(targetX: number, targetY: number): void {
		const currentX: number = this.sprite.x;
		const currentY: number = this.sprite.y;
		const radian = Math.atan2(targetY - currentY, targetX - currentX);
		const dx = Math.cos(radian);
		const dy = Math.sin(radian);
		let frames: number[] = this.sprite.frames;

		if (dy < 0) {
			frames = MOVING_UP;
		} else {
			if (dx > 0) {
				frames = MOVING_RIGHT;
			} else if (dx < 0) {
				frames = MOVING_LEFT;
			} else {
				frames = MOVING_DOWN;
			}
		}
		if (this.sprite.frames !== frames) {
			this.sprite.frames = frames;
		}
		this.sprite.x = dx * this.speed;
		this.sprite.y = dy * this.speed;
		this.searchRect.x = dx * this.speed;
		this.searchRect.y = dy * this.speed;
		this.bikkuriSprite.x = dx * this.speed;
		this.bikkuriSprite.y = dy * this.speed;
	}
}

export class OgreFactory {
	static create(scene: g.Scene, x: number, y: number): Ogre {
		const sprite = new g.FrameSprite({
			scene,
			src: scene.assets["ogre"] as g.ImageAsset,
			width: DEFAULT_CHIP_SIZE,
			height: DEFAULT_CHIP_SIZE * 1.75,
			srcWidth: 64,
			srcHeight: 112,
			frames: MOVING_DOWN,
			x,
			y
		});
		const bikkuriSprite = new g.Sprite({
			scene: scene,
			src: scene.assets["bikkuri"] as g.ImageAsset,
			width: DEFAULT_CHIP_SIZE / 3,
			height: DEFAULT_CHIP_SIZE,
			srcWidth: 120,
			srcHeight: 360,
			hidden: true,
			x: x + 2 * DEFAULT_CHIP_SIZE / 3,
			y
		});
		const searchRect = new g.FilledRect({
			scene: scene,
			cssColor: "red",
			opacity: 0.5,
			width: 0,
			height: 0
		});
		return new Ogre({
			sprite,
			bikkuriSprite,
			searchRect
		});
	}
}