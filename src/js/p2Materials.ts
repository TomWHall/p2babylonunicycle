import * as p2 from "p2";

const playerMaterial = new p2.Material();
const playerTyreMaterial = new p2.Material();
const terrainMaterial = new p2.Material();

export const P2Materials: any = {
    Player: playerMaterial,
    PlayerTyre: playerTyreMaterial,
    Terrain: terrainMaterial
};

export const tyreTerrainContactMaterial = new p2.ContactMaterial(playerTyreMaterial, terrainMaterial, {
    restitution: 0.4,
    stiffness: Number.MAX_VALUE,
    friction: 1.25
});