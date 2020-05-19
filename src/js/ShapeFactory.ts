// Factory functions to return p2 shapes with a single, centered Babylon mesh 

import MeshFactory, {MeshOptions} from "./MeshFactory";
import {Matrix, Vector3} from "@babylonjs/core/Maths";
import {Material} from "@babylonjs/core/Materials";
import * as p2 from "p2";

function getBox(options: p2.BoxOptions, depth: number, zPosition: number, collisionOptions: CollisionOptions, material: Material, meshOptions?: MeshOptions): p2.Box {
    const box = new p2.Box(options);

    if (collisionOptions) {
        box.collisionGroup = collisionOptions.collisionGroup;
        box.collisionMask = collisionOptions.collisionMask;
    }

    if (material) {
        const mesh = MeshFactory.getBox(options.width, options.height, depth, meshOptions);
        mesh.translate(new Vector3(0, 0, 1), zPosition);
        mesh.material = material;
        (box as any).meshes = [mesh];
    }

    return box;
}

function getBoxAsUprightCylinder(options: p2.BoxOptions, zPosition: number, collisionOptions: CollisionOptions, material: Material, meshOptions?: MeshOptions): p2.Box {
    const box = new p2.Box(options);

    if (collisionOptions) {
        box.collisionGroup = collisionOptions.collisionGroup;
        box.collisionMask = collisionOptions.collisionMask;
    }

    if (material) {
        const mesh = MeshFactory.getCylinder(options.width, options.height, meshOptions);
        mesh.translate(new Vector3(0, 0, 1), zPosition);
        mesh.material = material;
        (box as any).meshes = [mesh];
    }

    return box;
}

function getCircleAsSphere(options: p2.CircleOptions, zPosition: number, collisionOptions: CollisionOptions, material: Material, meshOptions?: MeshOptions): p2.Circle {
    const circle = new p2.Circle(options);

    if (collisionOptions) {
        circle.collisionGroup = collisionOptions.collisionGroup;
        circle.collisionMask = collisionOptions.collisionMask;
    }

    if (material) {
        const mesh = MeshFactory.getSphere(options.radius * 2, meshOptions);
        mesh.translate(new Vector3(0, 0, 1), zPosition);
        mesh.material = material;
        (circle as any).meshes = [mesh];
    }

    return circle;
}

function getCircleAsFrontalCylinder(options: p2.CircleOptions, depth: number, zPosition: number, collisionOptions: CollisionOptions, material: Material, meshOptions?: MeshOptions): p2.Circle {
    const circle = new p2.Circle(options);

    if (collisionOptions) {
        circle.collisionGroup = collisionOptions.collisionGroup;
        circle.collisionMask = collisionOptions.collisionMask;
    }

    if (material) {
        const mesh = MeshFactory.getCylinder(options.radius * 2, depth, meshOptions);
        mesh.bakeTransformIntoVertices(Matrix.RotationX(-Math.PI / 2));
        mesh.bakeTransformIntoVertices(Matrix.Translation(0, 0, zPosition));
        mesh.material = material;
        (circle as any).meshes = [mesh];
    }

    return circle;
}

export default {
    getBox: getBox,
    getBoxAsUprightCylinder: getBoxAsUprightCylinder,
    getCircleAsSphere: getCircleAsSphere,
    getCircleAsFrontalCylinder: getCircleAsFrontalCylinder,
}

export interface CollisionOptions {
    collisionGroup: number;
    collisionMask: number;
}