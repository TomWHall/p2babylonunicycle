import CollisionCategories from "./CollisionCategories";
import {P2Materials} from "./p2Materials";
import MaterialFactory, {Textures} from "./MaterialFactory";
import ShapeFactory, {CollisionOptions} from "./ShapeFactory";
import {Scene} from "@babylonjs/core/scene";
import MeshFactory from "./MeshFactory";
import {Matrix} from "@babylonjs/core/Maths";
import * as p2 from "p2";

const platformHeight = 0.2;
const platformDepth = 1;
const platformSurfaceThickness = platformHeight * 0.15;

const collisionOptions: CollisionOptions = {
    collisionGroup: CollisionCategories.Terrain,
    collisionMask: CollisionCategories.Player | CollisionCategories.Terrain
};

function getShape(shape: p2.Shape, material: p2.Material = P2Materials.Terrain): p2.Shape {
    shape.material = material;
    shape.collisionGroup = collisionOptions.collisionGroup;
    shape.collisionMask = collisionOptions.collisionMask;

    (shape as any).meshes = [];

    return shape;
}

const getWoodMaterial = (width: number, scene: Scene) => MaterialFactory.getMaterial(Textures.Wood, width, platformDepth, 0.25, scene);
const getTilesMaterial = (width: number, depth: number, scene: Scene) => MaterialFactory.getMaterial(Textures.TilesRed, width, depth, 4, scene);

const getChromeMaterial = (scene: Scene) => {
    const material = MaterialFactory.getMaterial(Textures.MetalChrome, 1, 1, 1, scene);
    material.specularPower = 256;
    return material;
}

function getTarget(position: number[], scene: Scene): p2.Body {
    const target = new p2.Body({position: [position[0], position[1]]});

    const width = 4;
    const depth = 4;

    const box = getShape(new p2.Box({width: width, height: platformHeight}));
    
    const boxMesh = MeshFactory.getBox(width, platformHeight, depth);
    boxMesh.material = getTilesMaterial(width, depth, scene);
    (box as any).meshes.push(boxMesh);

    target.addShape(box);

    return target;
}

function getPlatform(position: number[], width: number, mass: number, scene: Scene): p2.Body {
    const platform = new p2.Body({position: [position[0], position[1]], mass: mass});

    const box = getShape(new p2.Box({width: width, height: platformHeight}));

    const woodMaterial = getWoodMaterial(width, scene);

    const surfaceYOffset = (platformHeight / 2) - (platformSurfaceThickness / 2);

    const addSurfacePlanks = (isTop: boolean) => {
        const planksMesh = MeshFactory.getBox(width, platformSurfaceThickness, platformDepth);
        planksMesh.material = woodMaterial;
        planksMesh.bakeTransformIntoVertices(Matrix.Translation(0, surfaceYOffset * (isTop ? 1 : -1), 0));
        (box as any).meshes.push(planksMesh);
    };
    addSurfacePlanks(true);
    addSurfacePlanks(false);

    const middlePlanksMesh = MeshFactory.getBox(width - (platformSurfaceThickness * 2), platformHeight - (platformSurfaceThickness * 2), platformDepth - (platformSurfaceThickness * 2));
    middlePlanksMesh.material = woodMaterial;
    (box as any).meshes.push(middlePlanksMesh);

    platform.addShape(box);

    return platform;
}

function getSeesaw(position: number[], width: number, mass: number, scene: Scene): p2.Body {
    const spinner = getPlatform(position, width, mass, scene);

    const axleMesh = MeshFactory.getCylinder(platformHeight * 0.5, platformDepth * 1.5, {shadows: false});
    axleMesh.bakeTransformIntoVertices(Matrix.RotationX(Math.PI * 0.5));
    axleMesh.material = getChromeMaterial(scene);
    (spinner.shapes[0] as any).meshes.push(axleMesh);

    return spinner;
}

function getAnchor(position: number[]): p2.Body {
    const anchor = new p2.Body({position: [position[0], position[1]]});

    const circle = new p2.Circle({radius: 0.1});
    circle.sensor = true;
    anchor.addShape(circle);

    return anchor;
}

function getSeesawConstraint(seesaw: p2.Body, anchor: p2.Body): p2.RevoluteConstraint {
    const constraint = new p2.RevoluteConstraint(seesaw, anchor, {localPivotA: [0, 0], localPivotB: [0, 0]});
    constraint.collideConnected = false;

    return constraint;
}

function getMotorSeesawConstraint(seesaw: p2.Body, anchor: p2.Body): p2.RevoluteConstraint {
    const constraint = getSeesawConstraint(seesaw, anchor);
    constraint.enableMotor();
    constraint.setMotorSpeed(-0.5);

    return constraint;
}

export default {
    getPlatform: getPlatform,
    getSeesaw: getSeesaw,
    getAnchor: getAnchor,
    getSeesawConstraint: getSeesawConstraint,
    getMotorSeesawConstraint: getMotorSeesawConstraint,
    getTarget: getTarget
}