import CollisionCategories from "./CollisionCategories";
import MaterialFactory, {Textures} from "./MaterialFactory";
import MeshFactory from "./MeshFactory";
import ShapeFactory, {CollisionOptions} from "./ShapeFactory";
import {P2Materials} from "./p2Materials";
import {Scene} from "@babylonjs/core/scene";
import {StandardMaterial} from "@babylonjs/core/Materials";
import {Matrix, Color3, Vector3} from "@babylonjs/core/Maths";
import {Mesh, TransformNode} from "@babylonjs/core/Meshes";
import getId from "./IdGenerator";
import * as p2 from "p2";

const half = (x: number) => x / 2;
const double = (x: number) => x * 2;

const wheelRadius = 0.36;
const tyreThickness = 0.08;

const shaftHeight = 0.7;
const seatHeight = 0.05;
const seatWidth = 0.3;
const seatDepth = 0.2;
const pelvisWidth = 0.2;

const torsoWidth = 0.25;
const torsoHeight = 0.5;
const torsoDepth = 0.5;

const legWidth = 0.15;
const legSegmentLength = 0.4;

const armWidth = 0.125;
const armSegmentLength = 0.25;

const headRadius = half(torsoWidth);
const neckHeight = headRadius * 0.5;
const neckWidth = headRadius;

const hatBrimRadius = headRadius * 1.2;
const hatBrimHeight = 0.01;
const hatTopRadius = headRadius * 0.8;
const hatTopHeight = headRadius;

const playerMass = 0.1;
const unicycleMass = 0.4;

// Player body weight proportions
const torsoWeightProp = 0.5;
const legTopWeightProp = 0.07;
const legBottomWeightProp = 0.09;
const armTopWeightProp = 0.025;
const armBottomWeightProp = 0.025;
const headWeightProp = 0.07;
const hatWeightProp = 0.01;

const collisionOptions: CollisionOptions = {
    collisionGroup: CollisionCategories.Player,
    collisionMask: CollisionCategories.Terrain
};

function getShape(shape: p2.Shape, material: p2.Material = P2Materials.Player): p2.Shape {
    shape.material = material;
    shape.collisionGroup = collisionOptions.collisionGroup;
    shape.collisionMask = collisionOptions.collisionMask;

    (shape as any).meshes = [];

    return shape;
}

function bakeTranslationIntoMesh(mesh: Mesh, translationVector: Vector3, distance: number, scene: Scene): void {
    const transformNode = new TransformNode('TempNode', scene);
    transformNode.translate(translationVector, distance);
    const position = transformNode.position;

    mesh.bakeTransformIntoVertices(Matrix.Translation(position.x, position.y, position.z));
}

const getBlackLeatherMaterial = (scene: Scene) => MaterialFactory.getMaterial(Textures.LeatherBlack, 2, 2, 0.25, scene);
const getRedLeatherMaterial = (scene: Scene) => MaterialFactory.getMaterial(Textures.LeatherRed, 1, 1, 0.25, scene);
const getTrouserMaterial = (scene: Scene) => MaterialFactory.getMaterial(Textures.CheckRedWhite, 1, 1, 0.5, scene);
const getShirtMaterial = (scene: Scene) => MaterialFactory.getMaterial(Textures.FabricRed, 1, 1, 0.375, scene);
const getSkinMaterial = (scene: Scene) => MaterialFactory.getMaterial(Textures.Skin, 1, 1, 1, scene);
const getTyreMaterial = (scene: Scene) => MaterialFactory.getMaterial(Textures.Tyre, 8, 1, 2, scene);
const getHatMaterial = (scene: Scene) => MaterialFactory.getMaterial(Textures.VelvetGreen, 1, 1, 0.25, scene);

const getChromeMaterial = (scene: Scene) => {
    const material = MaterialFactory.getMaterial(Textures.MetalChrome, 1, 1, 1, scene);
    material.specularPower = 256;
    return material;
}

function getWheel(position: number[], scene: Scene): p2.Body {
    const wheelBody = new p2.Body({mass: unicycleMass * 0.5, position: [position[0], position[1]]});
    
    const wheelCircle = getShape(new p2.Circle({radius: wheelRadius}), P2Materials.PlayerTyre);

    const rubberMaterial = getTyreMaterial(scene);
    const chromeMaterial = getChromeMaterial(scene);

    const meshes: Mesh[] = [];


    // Tyre, rim, hub, axle

    const tyreMesh = MeshFactory.getTorus(double(wheelRadius) - tyreThickness, tyreThickness);
    tyreMesh.bakeTransformIntoVertices(Matrix.RotationX(half(Math.PI)));
    tyreMesh.material = rubberMaterial;
    meshes.push(tyreMesh);

    const rimMesh = MeshFactory.getTorus(double(wheelRadius * 0.95) - tyreThickness, (tyreThickness * 0.8));
    rimMesh.bakeTransformIntoVertices(Matrix.RotationX(half(Math.PI)));
    rimMesh.material = chromeMaterial;
    meshes.push(rimMesh);

    const hubMesh = MeshFactory.getCylinder(double(wheelRadius * 0.2), 0.04);
    hubMesh.bakeTransformIntoVertices(Matrix.RotationX(-half(Math.PI)));
    hubMesh.material = chromeMaterial;
    meshes.push(hubMesh);

    const axleMesh = MeshFactory.getCylinder(double(wheelRadius * 0.05), 0.24, {shadows: false});
    axleMesh.bakeTransformIntoVertices(Matrix.RotationX(-half(Math.PI)));
    axleMesh.material = chromeMaterial;
    meshes.push(axleMesh);


    // Spokes

    const numSpokes = 8;
    for (let i = 1; i <= numSpokes; i++) {
        const spokeMesh = MeshFactory.getCylinder(0.02, double(wheelRadius * 0.9), {shadows: false});

        const axis = new Vector3(0, 0, 1);
        const angle = (Math.PI / numSpokes) * (i - 1);
        spokeMesh.bakeTransformIntoVertices(Matrix.RotationZ(angle));
        spokeMesh.material = chromeMaterial;

        meshes.push(spokeMesh);
    }


    // Pedal cranks

    const crankWidth = 0.13;
    const crankHeight = 0.02;
    const crankDepth = 0.01;

    const pedalCrankFrontMesh = MeshFactory.getBox(crankWidth, crankHeight, crankDepth, {shadows: false});
    pedalCrankFrontMesh.bakeTransformIntoVertices(Matrix.Translation(-half(crankWidth) + 0.005, 0, -0.1 - half(crankDepth)));
    pedalCrankFrontMesh.material = chromeMaterial;
    meshes.push(pedalCrankFrontMesh);

    const pedalCrankBackMesh = MeshFactory.getBox(crankWidth, crankHeight, crankDepth, {shadows: false});
    pedalCrankBackMesh.bakeTransformIntoVertices(Matrix.Translation(half(crankWidth) - 0.005, 0, 0.1 + half(crankDepth)));
    pedalCrankBackMesh.material = chromeMaterial;
    meshes.push(pedalCrankBackMesh);


    (wheelCircle as any).meshes = meshes;

    wheelBody.addShape(wheelCircle);

    return wheelBody;
}

function getShaft(position: number[], scene: Scene): p2.Body {
    const shaftBody = new p2.Body({mass: unicycleMass * 0.5, position: [position[0], position[1] + 0.35], angle: 0});

    const chromeMaterial = getChromeMaterial(scene);
    chromeMaterial.diffuseColor = new Color3(0.125, 0.125, 1);
    
    const forkRadius = 0.02;
    const forkHeight = 0.4;
    const forkZOffset = 0.08;

    const shaftBox = getShape(new p2.Box({width: double(forkRadius), height: shaftHeight}));


    // Forks

    const addFork = (isFront: boolean): void => {
        const z = forkZOffset * (isFront ? -1 : 1);

        const forkCylinderMesh = MeshFactory.getCylinder(double(forkRadius), forkHeight);
        forkCylinderMesh.bakeTransformIntoVertices(Matrix.Translation(0, -half(shaftHeight) + half(forkHeight), z));
        forkCylinderMesh.material = chromeMaterial;
        (shaftBox as any).meshes.push(forkCylinderMesh);

        const axleHousingMesh = MeshFactory.getCylinder(forkRadius * 4, forkRadius, {shadows: false});
        axleHousingMesh.bakeTransformIntoVertices(Matrix.RotationX(-half(Math.PI)));
        axleHousingMesh.bakeTransformIntoVertices(Matrix.Translation(0, -half(shaftHeight), z));
        axleHousingMesh.material = chromeMaterial;
        (shaftBox as any).meshes.push(axleHousingMesh);
    };
    addFork(true);
    addFork(false);

    shaftBody.addShape(shaftBox);


    // Cross-bar

    const crossBarY = -half(shaftHeight) + forkHeight;

    const crossBarMesh = MeshFactory.getCylinder(double(forkRadius), double(forkZOffset));
    crossBarMesh.bakeTransformIntoVertices(Matrix.RotationX(-half(Math.PI)));
    crossBarMesh.bakeTransformIntoVertices(Matrix.Translation(0, crossBarY, 0));
    crossBarMesh.material = chromeMaterial;
    (shaftBox as any).meshes.push(crossBarMesh);

    const addCrossBarSphere = (isFront: boolean): void => {
        const z = forkZOffset * (isFront ? -1 : 1);

        const crossBarSphereMesh = MeshFactory.getSphere(double(forkRadius));
        crossBarSphereMesh.bakeTransformIntoVertices(Matrix.Translation(0, crossBarY, z));
        crossBarSphereMesh.material = chromeMaterial;
        (shaftBox as any).meshes.push(crossBarSphereMesh);
    };
    addCrossBarSphere(true);
    addCrossBarSphere(false);


    // Column

    const columnHeight = shaftHeight - forkHeight;

    const columnMesh = MeshFactory.getCylinder(double(forkRadius), columnHeight);
    columnMesh.bakeTransformIntoVertices(Matrix.Translation(0, half(shaftHeight) - half(columnHeight), 0));
    columnMesh.material = chromeMaterial;
    (shaftBox as any).meshes.push(columnMesh);


    // Seat

    const seatBox = getShape(new p2.Box({width: seatWidth, height: seatHeight}));
    
    const seatMesh = MeshFactory.getSphere(seatWidth, {shadows: false});
    seatMesh.scaling = new Vector3(1, seatHeight / seatWidth, seatDepth / seatWidth);
    seatMesh.material = getBlackLeatherMaterial(scene);
    (seatBox as any).meshes.push(seatMesh);

    shaftBody.addShape(seatBox, [0, half(shaftHeight) + half(seatHeight)], 0);


    // Pelvis

    const trouserMaterial = getTrouserMaterial(scene);

    const pelvisCircle = getShape(new p2.Circle({radius: half(pelvisWidth)}));

    const pelvisCylinderMesh = MeshFactory.getCylinder(pelvisWidth, torsoDepth - pelvisWidth);
    const axis = new Vector3(1, 0, 0);
    pelvisCylinderMesh.bakeTransformIntoVertices(Matrix.RotationX(half(Math.PI)));
    pelvisCylinderMesh.material = trouserMaterial;
    (pelvisCircle as any).meshes.push(pelvisCylinderMesh);

    const addPelvisSphereMesh = (isFront: boolean): void => {
        const pelvisSphereMesh = MeshFactory.getSphere(pelvisWidth);
        pelvisSphereMesh.bakeTransformIntoVertices(Matrix.Translation(0, 0, (half(torsoDepth) - half(pelvisWidth)) * (isFront ? -1 : 1)));
        pelvisSphereMesh.material = trouserMaterial;
        (pelvisCircle as any).meshes.push(pelvisSphereMesh);
    };
    addPelvisSphereMesh(true);
    addPelvisSphereMesh(false);

    shaftBody.addShape(pelvisCircle, [0, half(shaftHeight) + seatHeight + half(pelvisWidth)], 0);


    return shaftBody;
}

function getLegTop(position: number[], scene: Scene, isFront: boolean): p2.Body {
    const legTopBody = new p2.Body({mass: playerMass * legTopWeightProp, position: [position[0] - 0.2, position[1] + 0.2]});

    const zPosition = (half(seatDepth) + half(legWidth)) * (isFront ? -1 : 1);

    const trouserMaterial = getTrouserMaterial(scene);

    legTopBody.addShape(ShapeFactory.getBoxAsUprightCylinder({
        width: legWidth,
        height: legSegmentLength
    }, zPosition, collisionOptions, trouserMaterial));
    legTopBody.addShape(ShapeFactory.getCircleAsSphere({
        radius: half(legWidth)
    }, zPosition, collisionOptions, trouserMaterial), [0, -0.2], 0);

    return legTopBody;
}

function getLegBottom(position: number[], scene: Scene, isFront: boolean): p2.Body {
    const legBottomBody = new p2.Body({mass: playerMass * legBottomWeightProp, position: [position[0] - 0.2, position[1] - 0.2]});

    const zPosition = (half(seatDepth) + half(legWidth)) * (isFront ? -1 : 1);

    const trouserMaterial = getTrouserMaterial(scene);
    const redLeatherMaterial = getRedLeatherMaterial(scene);
    const chromeMaterial = getChromeMaterial(scene);

    // Leg
    legBottomBody.addShape(ShapeFactory.getBoxAsUprightCylinder({
        width: legWidth,
        height: legSegmentLength
    }, zPosition, collisionOptions, trouserMaterial));

    // Shoe
    legBottomBody.addShape(ShapeFactory.getBox({
        width: 0.3,
        height: 0.1
    }, 0.1, zPosition, collisionOptions, redLeatherMaterial), [-0.075, -0.205]);
    legBottomBody.addShape(ShapeFactory.getCircleAsFrontalCylinder({radius: 0.1}, 0.1, zPosition, collisionOptions, redLeatherMaterial), [-0.225, -0.155]);

    // Pedal
    legBottomBody.addShape(ShapeFactory.getBox({
        width: 0.1,
        height: 0.05
    }, 0.1, zPosition, collisionOptions, chromeMaterial, {shadows: false}), [-0.175, -0.28]);

    return legBottomBody;
}

function getTorso(position: number[], scene: Scene): p2.Body {
    const torsoBody = new p2.Body({mass: playerMass * torsoWeightProp, position: [position[0], position[1] + 0.9]});

    const shirtMaterial = getShirtMaterial(scene);


    // Belly

    const bellyBox = ShapeFactory.getBox({
        width: torsoWidth,
        height: torsoHeight - half(torsoWidth)
    }, torsoDepth, 0, collisionOptions, shirtMaterial);
    torsoBody.addShape(bellyBox, [0, -(torsoWidth / 4)]);


    // Chest / shoulders

    const chestCircle = getShape(new p2.Circle({radius: half(torsoWidth)}));

    const chestCylinderMesh = MeshFactory.getCylinder(torsoWidth, torsoDepth);
    chestCylinderMesh.bakeTransformIntoVertices(Matrix.RotationX(half(Math.PI)));
    chestCylinderMesh.material = shirtMaterial;

    const shouldersCylinderMesh = MeshFactory.getCylinder(armWidth, torsoDepth + armWidth);
    shouldersCylinderMesh.bakeTransformIntoVertices(Matrix.RotationX(half(Math.PI)));
    shouldersCylinderMesh.bakeTransformIntoVertices(Matrix.Translation(0, half(torsoWidth) - half(armWidth), 0));
    shouldersCylinderMesh.material = shirtMaterial;

    const getShoulderSphereMesh = (isFront: boolean) => {
        const shoulderSphereMesh = MeshFactory.getSphere(armWidth);
        shoulderSphereMesh.bakeTransformIntoVertices(Matrix.Translation(0, half(torsoWidth) - half(armWidth), 0));
        shoulderSphereMesh.bakeTransformIntoVertices(Matrix.Translation(0, 0, (half(torsoDepth) + half(armWidth)) * (isFront ? -1 : 1)));
        shoulderSphereMesh.material = shirtMaterial;

        return shoulderSphereMesh;
    };

    (chestCircle as any).meshes = [
        chestCylinderMesh, shouldersCylinderMesh,
        getShoulderSphereMesh(true),
        getShoulderSphereMesh(false)
    ];

    torsoBody.addShape(chestCircle, [0, half(torsoHeight) - half(torsoWidth)]);

    return torsoBody;
}

function getArmTop(position: number[], scene: Scene, isFront: boolean): p2.Body {
    const armTopBody = new p2.Body({mass: playerMass * armTopWeightProp, position: [position[0], position[1] + 0.5]});

    const zPosition = (half(torsoDepth) + half(armWidth)) * (isFront ? -1 : 1);

    const shirtMaterial = getShirtMaterial(scene);

    armTopBody.addShape(ShapeFactory.getBoxAsUprightCylinder({
        width: armWidth,
        height: armSegmentLength
    }, zPosition, collisionOptions, shirtMaterial));

    return armTopBody;
}

function getArmBottom(position: number[], scene: Scene, isFront: boolean): p2.Body {
    const armBottomBody = new p2.Body({mass: playerMass * armBottomWeightProp, position: [position[0], position[1] + 0.5]});

    const zPosition = (half(torsoDepth) + half(armWidth)) * (isFront ? -1 : 1);

    const shirtMaterial = getShirtMaterial(scene);
    const skinMaterial = getSkinMaterial(scene);

    armBottomBody.addShape(ShapeFactory.getCircleAsSphere({radius: half(armWidth)}, zPosition, collisionOptions, shirtMaterial), [0, half(armSegmentLength)]);
    armBottomBody.addShape(ShapeFactory.getCircleAsSphere({radius: half(armWidth * 0.9)}, zPosition, collisionOptions, skinMaterial), [0, -half(armSegmentLength * 1.2)]);
    armBottomBody.addShape(ShapeFactory.getBoxAsUprightCylinder({
        width: armWidth,
        height: armSegmentLength
    }, zPosition, collisionOptions, shirtMaterial));

    return armBottomBody;
}

function getHead(position: number[], scene: Scene): p2.Body {
    const headBody = new p2.Body({mass: playerMass * headWeightProp, position: [position[0], position[1]]});

    const skinMaterial = getSkinMaterial(scene);
    const redLeatherMaterial = getRedLeatherMaterial(scene);
    
    const redShinyMaterial = new StandardMaterial(getId(), scene);
    redShinyMaterial.diffuseColor = new Color3(1, 0, 0);
    redShinyMaterial.specularPower = 128;

    const blackMaterial = new StandardMaterial(getId(), scene);
    blackMaterial.diffuseColor = new Color3(0, 0, 0);

    const headCircle = getShape(new p2.Circle({radius: headRadius}));

    // Head
    const headMesh = MeshFactory.getSphere(double(headRadius));
    headMesh.material = skinMaterial;
    (headCircle as any).meshes.push(headMesh);

    // Nose
    const noseRadius = headRadius * 0.375;
    const noseMesh = MeshFactory.getSphere(double(noseRadius), {shadows: false});
    noseMesh.material = redShinyMaterial;
    noseMesh.bakeTransformIntoVertices(Matrix.Translation(-(headRadius + half(noseRadius)), 0, 0));
    (headCircle as any).meshes.push(noseMesh);

    // Eyes
    const addEye = (isFront: boolean) => {
        // Axis radiating out from center of head, either left or right
        const translationVector = new Vector3(-1, 0.6, 0.6 * (isFront ? -1 : 1)).normalize();

        // Ring around eye
        const eyeRingMesh = MeshFactory.getSphere(headRadius, {shadows: false});
        bakeTranslationIntoMesh(eyeRingMesh, translationVector, headRadius * 0.55, scene);
        eyeRingMesh.material = redLeatherMaterial;
        (headCircle as any).meshes.push(eyeRingMesh);

        // White of eye
        const eyeWhiteMesh = MeshFactory.getSphere(half(headRadius), {shadows: false});
        bakeTranslationIntoMesh(eyeWhiteMesh, translationVector, headRadius * 0.85, scene);
        eyeWhiteMesh.material = skinMaterial;
        (headCircle as any).meshes.push(eyeWhiteMesh);

        // Iris / pupil
        const eyeCenterMesh = MeshFactory.getSphere(headRadius * 0.25, {shadows: false});
        bakeTranslationIntoMesh(eyeCenterMesh, translationVector, headRadius, scene);
        eyeCenterMesh.material = blackMaterial;
        (headCircle as any).meshes.push(eyeCenterMesh);
    };
    addEye(true);
    addEye(false);

    // Mouth
    const mouthMesh = MeshFactory.getTorus(headRadius, 0.075, {shadows: false});
    bakeTranslationIntoMesh(mouthMesh, new Vector3(-1, 0.6, 0).normalize(), headRadius * 0.3, scene);
    mouthMesh.bakeTransformIntoVertices(Matrix.RotationZ(Math.PI * 0.25));
    mouthMesh.material = getRedLeatherMaterial(scene);
    (headCircle as any).meshes.push(mouthMesh);

    // Ears
    const addEar = (isFront: boolean) => {
        const earRadius = headRadius * 0.4;
        const earMesh = MeshFactory.getCylinder(double(earRadius), double(earRadius), {shadows: false});
        earMesh.material = skinMaterial;
        earMesh.bakeTransformIntoVertices(Matrix.RotationZ(half(Math.PI)));
        earMesh.bakeTransformIntoVertices(Matrix.RotationY(Math.PI * 0.125 * (isFront ? -1 : 1)));
        earMesh.bakeTransformIntoVertices(Matrix.Translation(0, 0, headRadius * 0.6 * (isFront ? -1 : 1)));

        (headCircle as any).meshes.push(earMesh);
    };
    addEar(true);
    addEar(false);

    headBody.addShape(headCircle);

    // Neck
    const neckHeightWithBuffer = neckHeight * 2;
    const neckBox = ShapeFactory.getBoxAsUprightCylinder({
        width: neckWidth,
        height: neckHeightWithBuffer
    }, 0, collisionOptions, skinMaterial);
    headBody.addShape(neckBox, [0, -(headRadius + half(neckHeight))]);

    return headBody;
}

function getHat(position: number[], scene: Scene): p2.Body {
    const hatBody = new p2.Body({mass: playerMass * hatWeightProp, position: [position[0], position[1]]});

    const hatMaterial = getHatMaterial(scene);

    const hatTopBox = ShapeFactory.getBoxAsUprightCylinder({
        width: double(hatTopRadius),
        height: hatTopHeight
    }, 0, collisionOptions, hatMaterial);
    hatBody.addShape(hatTopBox);

    const hatRimBox = ShapeFactory.getBoxAsUprightCylinder({
        width: double(hatBrimRadius),
        height: hatBrimHeight
    }, 0, collisionOptions, hatMaterial);
    hatBody.addShape(hatRimBox, [0, -(half(hatTopHeight) + half(hatBrimHeight))]);

    return hatBody;
}

function getShaftTorsoConstraint(shaft: p2.Body, torso: p2.Body): p2.RevoluteConstraint {
    const revoluteConstraint = new p2.RevoluteConstraint(shaft, torso, {
        localPivotA: [0, half(shaftHeight) + seatHeight + half(pelvisWidth)],
        localPivotB: [0, -half(torsoHeight) + (torsoHeight / 8)]
    });
    revoluteConstraint.upperLimitEnabled = true;
    revoluteConstraint.upperLimit = Math.PI * 0.05;
    revoluteConstraint.lowerLimitEnabled = true;
    revoluteConstraint.lowerLimit = Math.PI * -0.05;

    return revoluteConstraint;
}

function getShaftWheelConstraint(shaft: p2.Body, wheel: p2.Body): p2.RevoluteConstraint {
    const revoluteConstraint = new p2.RevoluteConstraint(shaft, wheel, {
        localPivotA: [0, -half(shaftHeight)],
        localPivotB: [0, 0]
    });
    revoluteConstraint.enableMotor();
    revoluteConstraint.setMotorSpeed(0);

    return revoluteConstraint;
}

function getLegSectionsConstraint(legTop: p2.Body, legBottom: p2.Body): p2.RevoluteConstraint {
    const revoluteConstraint = new p2.RevoluteConstraint(legTop, legBottom, {
        localPivotA: [0, -half(legSegmentLength)],
        localPivotB: [0, half(legSegmentLength)]
    });
    revoluteConstraint.lowerLimitEnabled = true;
    revoluteConstraint.lowerLimit = Math.PI * 0.2;

    return revoluteConstraint;
}

function getLegTopShaftConstraint(legTop: p2.Body, shaft: p2.Body): p2.RevoluteConstraint {
    return new p2.RevoluteConstraint(legTop, shaft, {
        localPivotA: [0, half(legSegmentLength)],
        localPivotB: [0, half(shaftHeight) + seatHeight + half(pelvisWidth)]
    });
}

function getLegBottomWheelConstraint(legBottom: p2.Body, wheel: p2.Body, isFront: boolean): p2.RevoluteConstraint {
    return new p2.RevoluteConstraint(legBottom, wheel, {
        localPivotA: [-0.175, -0.28],
        localPivotB: [0.12 * (isFront ? -1 : 1), 0]
    });
}

function getArmSectionsConstraint(armBottom: p2.Body, armTop: p2.Body): p2.RevoluteConstraint {
    const revoluteConstraint = new p2.RevoluteConstraint(armBottom, armTop, {
        localPivotA: [0, half(armSegmentLength)],
        localPivotB: [0, -half(armSegmentLength)]
    });
    revoluteConstraint.upperLimitEnabled = true;
    revoluteConstraint.upperLimit = Math.PI * 0.7;
    revoluteConstraint.lowerLimitEnabled = true;
    revoluteConstraint.lowerLimit = Math.PI * 0.12;

    return revoluteConstraint;
}

function getTorsoArmTopConstraint(torso: p2.Body, armTop: p2.Body): p2.RevoluteConstraint {
    const revoluteConstraint = new p2.RevoluteConstraint(torso, armTop, {
        localPivotA: [0, half(torsoHeight) - half(armWidth)],
        localPivotB: [0, half(armSegmentLength)]
    });
    revoluteConstraint.upperLimitEnabled = true;
    revoluteConstraint.upperLimit = Math.PI * 0.2;
    revoluteConstraint.lowerLimitEnabled = true;
    revoluteConstraint.lowerLimit = Math.PI * -0.3;

    return revoluteConstraint;
}

function getHeadTorsoConstraint(torso: p2.Body, head: p2.Body): p2.RevoluteConstraint {
    const revoluteConstraint = new p2.RevoluteConstraint(torso, head, {
        localPivotA: [0, half(torsoHeight) - half(armWidth)],
        localPivotB: [0, -(headRadius + neckHeight)]
    });
    revoluteConstraint.upperLimitEnabled = true;
    revoluteConstraint.upperLimit = Math.PI * 0.05;
    revoluteConstraint.lowerLimitEnabled = true;
    revoluteConstraint.lowerLimit = Math.PI * -0.05;

    return revoluteConstraint;
}

function getHeadHatConstraint(head: p2.Body, hat: p2.Body): p2.LockConstraint {
    return new p2.LockConstraint(head, hat, {
        localOffsetB: [0, (headRadius * 0.75) + (half(hatTopHeight) + hatBrimHeight)]
    });
}

export default {
    getWheel: getWheel,
    getShaft: getShaft,
    getLegTop: getLegTop,
    getLegBottom: getLegBottom,
    getTorso: getTorso,
    getArmTop: getArmTop,
    getArmBottom: getArmBottom,
    getHead: getHead,
    getHat: getHat,

    getShaftTorsoConstraint: getShaftTorsoConstraint,
    getShaftWheelConstraint: getShaftWheelConstraint,
    getLegSectionsConstraint: getLegSectionsConstraint,
    getLegTopShaftConstraint: getLegTopShaftConstraint,
    getLegBottomWheelConstraint: getLegBottomWheelConstraint,
    getArmSectionsConstraint: getArmSectionsConstraint,
    getTorsoArmTopConstraint: getTorsoArmTopConstraint,
    getHeadTorsoConstraint: getHeadTorsoConstraint,
    getHeadHatConstraint: getHeadHatConstraint
}