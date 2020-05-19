import Direction from "./Direction";
import PlayerBodyFactory from "./PlayerBodyFactory";
import {Scene} from "@babylonjs/core/scene";
import {P2Materials} from "./p2Materials";
import * as p2 from "p2";

const maximumSpeed = 8; // Absolute maximum speed of the wheel motor, in p2 speed units
const speedIncrementFactor = 0.0375; // Rate of acceleration

const maxSafeAngle = Math.PI / 32; // Basically upright, no need for correction
const maxCorrectableAngle = Math.PI / 8; // A bit tilted, but correctable
const collapsedAngle = Math.PI / 2; // Totally collapsed

const correctionAngularForce = 4; // Force to correct wobble
const hoistAngularForce = 30; // Force to hoist up from collapsed state
const torsoPushForceX = 0.05; // Force to push torso in direction of movement, to create lean

export default class Player {

    world: p2.World;
    scene: Scene;

    direction: Direction = null;
    lastActiveTime: number = 0;

    wheelOnTerrain: boolean = false;
    torsoOnTerrain: boolean = false;
    
    wheel: p2.Body;
    shaft: p2.Body;
    torso: p2.Body;
    shaftWheelConstraint: p2.RevoluteConstraint;
    shaftTorsoConstraint: p2.RevoluteConstraint;

    positionHistory: number[][] = [];

    constructor(world: p2.World, scene: Scene, position: number[]) {
        this.world = world;
        this.scene = scene;

        for (let i = 1; i <= 30; i++) {
            this.positionHistory.push([position[0], position[1]]);
        }

        const wheel = this.wheel = PlayerBodyFactory.getWheel(position, scene);
        const shaft = this.shaft = PlayerBodyFactory.getShaft(position, scene);
        const torso = this.torso = PlayerBodyFactory.getTorso(position, scene);
        this.shaftWheelConstraint = PlayerBodyFactory.getShaftWheelConstraint(shaft, wheel);
        this.shaftTorsoConstraint = PlayerBodyFactory.getShaftTorsoConstraint(shaft, torso);

        world.addBody(wheel);
        world.addBody(shaft);
        world.addBody(torso);
        world.addConstraint(this.shaftWheelConstraint);
        world.addConstraint(this.shaftTorsoConstraint);

        const addLeg = (isFront: boolean): void => {
            const legTop = PlayerBodyFactory.getLegTop(position, scene, isFront);
            const legBottom = PlayerBodyFactory.getLegBottom(position, scene, isFront);

            world.addBody(legTop);
            world.addBody(legBottom);
            world.addConstraint(PlayerBodyFactory.getLegSectionsConstraint(legTop, legBottom));
            world.addConstraint(PlayerBodyFactory.getLegTopShaftConstraint(legTop, shaft));
            world.addConstraint(PlayerBodyFactory.getLegBottomWheelConstraint(legBottom, wheel, isFront));
        };

        addLeg(true);
        addLeg(false);

        const addArm = (isFront: boolean): void => {
            const armTop = PlayerBodyFactory.getArmTop(position, scene, isFront);
            const armBottom = PlayerBodyFactory.getArmBottom(position, scene, isFront);

            world.addBody(armTop);
            world.addBody(armBottom);
            world.addConstraint(PlayerBodyFactory.getArmSectionsConstraint(armBottom, armTop));
            world.addConstraint(PlayerBodyFactory.getTorsoArmTopConstraint(torso, armTop));
        };

        addArm(true);
        addArm(false);

        const head = PlayerBodyFactory.getHead(position, scene);
        const hat = PlayerBodyFactory.getHat(position, scene);

        world.addBody(head);
        world.addBody(hat);
        world.addConstraint(PlayerBodyFactory.getHeadTorsoConstraint(torso, head));
        world.addConstraint(PlayerBodyFactory.getHeadHatConstraint(head, hat));

        this.addWorldHandlers();
    }

    private addWorldHandlers(): void {
        this.world.on('beginContact', (contactEvent: any) => {
            if (Player.isBodyTerrainContact(this.wheel, contactEvent)) {
                this.wheelOnTerrain = true;
            } else if (Player.isBodyTerrainContact(this.torso, contactEvent)) {
                this.torsoOnTerrain = true;
            }
        });

        this.world.on('endContact', (contactEvent: any) => {
            if (Player.isBodyTerrainContact(this.wheel, contactEvent)) {
                this.wheelOnTerrain = false;
            } else if (Player.isBodyTerrainContact(this.torso, contactEvent)) {
                this.torsoOnTerrain = false;
            }
        });
    }

    private static isBodyTerrainContact(body: p2.Body, contactEvent: any): boolean {
        const bodyA = contactEvent.bodyA;
        const bodyAMaterial = bodyA.shapes[0].material;

        const bodyB = contactEvent.bodyB;
        const bodyBMaterial = bodyB.shapes[0].material;

        return (bodyA === body && bodyBMaterial === P2Materials.Terrain) ||
            (bodyB === body && bodyAMaterial === P2Materials.Terrain);
    }
    
    handlePostWorldStep(timeMultiplier: number): void {
        const direction = this.direction;

        // Normalize the p2 shaft angle
        let shaftAngle = this.shaft.angle % (Math.PI * 2);
        if (shaftAngle < -Math.PI) {
            shaftAngle = (Math.PI * 2) + shaftAngle;
        } else if (shaftAngle > Math.PI) {
            shaftAngle = -((Math.PI * 2) - shaftAngle);
        }

        const speedIncrement = speedIncrementFactor * timeMultiplier;

        const isUpright = Math.abs(shaftAngle) < maxSafeAngle;
        const isUprightable = Math.abs(shaftAngle) < maxCorrectableAngle;
        const isCollapsed = Math.abs(shaftAngle) > collapsedAngle && Math.abs(shaftAngle) < Math.PI * 0.75;

        const now = performance.now();
        if (direction !== null) {
            this.lastActiveTime = now;
        }
        const timeSinceActive = now - this.lastActiveTime;

        if (this.wheelOnTerrain) {
            if (!isCollapsed) {
                // Set wheel speed
                const currentSpeed = this.shaftWheelConstraint.getMotorSpeed();
                let newSpeed = 0;
                if (direction === Direction.Left) {
                    newSpeed = Math.max(currentSpeed - speedIncrement, -maximumSpeed);
                } else if (direction === Direction.Right) {
                    newSpeed = Math.min(currentSpeed + speedIncrement, maximumSpeed);
                } else {
                    newSpeed = 0;
                }

                this.shaftWheelConstraint.setMotorSpeed(newSpeed);
            }

            if (isUpright) {
                // If moving, push the torso in the direction of movement
                if (direction !== null) {
                    this.torso.applyForce([torsoPushForceX * (direction === Direction.Left ? -1 : 1), 0], this.torso.position);
                }
            } else {
                if (isCollapsed) {
                    // If torso is on terrain and trying to move, try to hoist the player up
                    if (this.torsoOnTerrain && direction !== null) {
                        this.shaft.angularForce = hoistAngularForce * (shaftAngle > 0 ? -1 : 1);
                    }
                } else if (isUprightable && timeSinceActive < 1000) {
                    // Twist the shaft to try to get it upright
                    this.shaft.angularForce = (correctionAngularForce * (shaftAngle > 0 ? -1 : 1));
                }
            }
        }

        // Retain a short duration of position history, for the tracking spotlight
        if (this.positionHistory.length > 30) {
            this.positionHistory.splice(0, 1)
        }
        this.positionHistory.push([this.wheel.position[0], this.wheel.position[1]]);
    }
}