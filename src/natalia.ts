import {GameObject} from "./gameobject";

export type NataliaStatus = "move" | "escape";

export interface NataliaParameterObject {
	movingFrameSprite: g.FrameSprite;
	escapeSprite: g.Sprite;
	targetPlaceSprite: g.FrameSprite;
	status?: NataliaStatus;
}

const NORMAL_SPEED = 4.5;

export class Natalia implements GameObject {
	movingFrameSprite: g.FrameSprite;
	escapeSprite: g.Sprite;
	currentSprite: g.Sprite;
	speed: number;
	targetPlaceSprite: g.FrameSprite;
	status: NataliaStatus;

	constructor(params: NataliaParameterObject) {
		this.movingFrameSprite = params.movingFrameSprite;
		this.escapeSprite = params.escapeSprite;
		this.speed = NORMAL_SPEED;
		this.targetPlaceSprite = params.targetPlaceSprite;
		this.status = params.status || "move";
		this.speed = NORMAL_SPEED;
	}

	getCommonArea(): g.CommonArea {
		return {
			x: this.currentSprite.x,
			y: this.currentSprite.y,
			width: this.currentSprite.width,
			height: this.currentSprite.height
		};
	}

	register(scene: g.Scene): void {
		this.setCurrentSprite();
		scene.append(this.movingFrameSprite);
		scene.append(this.escapeSprite);
		this.targetPlaceSprite.start();
		scene.append(this.targetPlaceSprite);
	}

	setStatus(status: NataliaStatus): void {
		this.status = status;
		this.setCurrentSprite();
	}

	setTargetPlace(targetX: number, targetY: number): void {
		this.targetPlaceSprite.x = targetX;
		this.targetPlaceSprite.y = targetY;
		this.targetPlaceSprite.show();
		this.targetPlaceSprite.modified();
	}

	isMoving(): boolean {
		return this.targetPlaceSprite.visible() || this.status === "escape";
	}

	move(): void {
		if (!this.targetPlaceSprite.visible()) {
			return;
		}
		const currentX: number = this.currentSprite.x;
		const currentY: number = this.currentSprite.y;
		const radian = Math.atan2(this.targetPlaceSprite.y - currentY, this.targetPlaceSprite.x - currentX);
		const dx = Math.cos(radian);
		const dy = Math.sin(radian);
		this.currentSprite.x += dx * this.speed;
		this.currentSprite.y += dy * this.speed;
		this.currentSprite.modified();
		if (g.Collision.intersect(
			this.currentSprite.x,
			this.currentSprite.y,
			this.currentSprite.width,
			this.currentSprite.height,
			this.targetPlaceSprite.x,
			this.targetPlaceSprite.y,
			this.targetPlaceSprite.width,
			this.targetPlaceSprite.height)) {
			this.targetPlaceSprite.hide();
		}
	}

	private setCurrentSprite(): void {
		if (this.status === "escape") {
			this.movingFrameSprite.stop();
			this.movingFrameSprite.hide();
			this.escapeSprite.x = this.movingFrameSprite.x;
			this.escapeSprite.y = this.movingFrameSprite.y;
			this.escapeSprite.show();
			this.escapeSprite.modified();
			this.currentSprite = this.escapeSprite;
		} else {
			this.escapeSprite.hide();
			this.movingFrameSprite.x = this.escapeSprite.x;
			this.movingFrameSprite.y = this.escapeSprite.y;
			this.movingFrameSprite.show();
			this.movingFrameSprite.start();
			this.movingFrameSprite.modified();
			this.currentSprite = this.movingFrameSprite;
		}
	}
}
