import {Direction} from "./direction";
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
const NORMAL_SPEED = 3.7;
const HIGH_SPEED = 5;
const DEFAULT_CHIP_SIZE = 48;
const DISTANCE_TO_MOVE = 250;
const COLLISION_DISTANCE = 3;
const SEARCH_LENGTH = 250;
const SEARCH_WIDTH = DEFAULT_CHIP_SIZE * 1.75;

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
		this.sprite.start();
		scene.append(this.sprite);
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
		let target, reach;
		switch (directions[index]) {
			case "right":
				target = this.sprite.x + DISTANCE_TO_MOVE;
				reach = target > (g.game.width - this.sprite.width) ? (g.game.width - this.sprite.width) : target;
				this.searchPlace = {x: reach, y: this.sprite.y};
				this.searchRect.x = this.sprite.x + this.sprite.width;
				this.searchRect.y = this.sprite.y;
				this.searchRect.width = SEARCH_LENGTH;
				this.searchRect.height = SEARCH_WIDTH;
				this.searchRect.modified();
				break;
			case "left":
				target = this.sprite.x - DISTANCE_TO_MOVE;
				reach = target < 0 ? 0 : target;
				this.searchPlace = {x: reach, y: this.sprite.y};
				this.searchRect.x = this.sprite.x - DISTANCE_TO_MOVE;
				this.searchRect.y = this.sprite.y;
				this.searchRect.width = SEARCH_LENGTH;
				this.searchRect.height = SEARCH_WIDTH;
				this.searchRect.modified();
				break;
			case "up":
				target = this.sprite.y - DISTANCE_TO_MOVE;
				reach = target < 0 ? 0 : target;
				this.searchPlace = {x: this.sprite.x, y: reach};
				this.searchRect.x = this.sprite.x - (SEARCH_WIDTH - this.sprite.width) / 2;
				this.searchRect.y = this.sprite.y - DISTANCE_TO_MOVE;
				this.searchRect.width = SEARCH_WIDTH;
				this.searchRect.height = SEARCH_LENGTH;
				this.searchRect.modified();
				break;
			case "down":
				target = this.sprite.y + DISTANCE_TO_MOVE;
				reach = target > (g.game.height - this.sprite.height) ? (g.game.height - this.sprite.height) : target;
				this.searchPlace = {x: this.sprite.x, y: reach};
				this.searchRect.x = this.sprite.x - (SEARCH_WIDTH - this.sprite.width) / 2;
				this.searchRect.y = this.sprite.y + this.sprite.height;
				this.searchRect.width = SEARCH_WIDTH;
				this.searchRect.height = SEARCH_LENGTH;
				this.searchRect.modified();
				break;
			default:
				this.searchPlace = {x: this.sprite.x, y: this.sprite.y};
				break;
		}
		this.searchRect.modified();
	}

	moveToSearch(): void {
		this.search();
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
		console.log(dx, dy);
		let frames: number[] = this.sprite.frames;

		if (dy < 0) {
			frames = MOVING_UP;
		} else {
			if (dx > 0.1) {
				frames = MOVING_RIGHT;
			} else if (dx < -0.1) {
				frames = MOVING_LEFT;
			} else {
				frames = MOVING_DOWN;
			}
		}
		if (this.sprite.frames !== frames) {
			this.sprite.frames = frames;
		}
		this.sprite.x += dx * this.speed;
		this.sprite.y += dy * this.speed;
		this.searchRect.x += dx * this.speed;
		this.searchRect.y += dy * this.speed;
		this.bikkuriSprite.x += dx * this.speed;
		this.bikkuriSprite.y += dy * this.speed;
		this.sprite.modified();
		this.searchRect.modified();
		this.bikkuriSprite.modified();
	}
}

export class OgreFactory {
	static create(scene: g.Scene, x: number, y: number): Ogre {
		const sprite = new g.FrameSprite({
			scene,
			src: scene.assets["ogre_dot"] as g.ImageAsset,
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
