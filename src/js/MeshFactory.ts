import {Mesh, MeshBuilder} from "@babylonjs/core/Meshes";
import {BoxBuilder} from "@babylonjs/core/Meshes/Builders";
import getId from "./IdGenerator";

export interface MeshOptions {
    shadows?: boolean;
}

function applyMeshOptions(mesh: Mesh, meshOptions: MeshOptions): Mesh {
    if (meshOptions) {
        (mesh as any).meshOptions = meshOptions;
    }

    return mesh;
}

function getBox(width: number, height: number, depth: number, meshOptions?: MeshOptions): Mesh {
    const mesh = BoxBuilder.CreateBox(getId(), {
        width: width,
        height: height,
        depth: depth,
        wrap: true
    });

    return applyMeshOptions(mesh, meshOptions);
}

function getCylinder(diameter: number, height: number, meshOptions?: MeshOptions): Mesh {
    const mesh = MeshBuilder.CreateCylinder(getId(), {
        diameter: diameter,
        height: height
    });

    return applyMeshOptions(mesh, meshOptions);
}

function getSphere(diameter: number, meshOptions?: MeshOptions): Mesh {
    const mesh = MeshBuilder.CreateSphere(getId(), {
        diameter: diameter
    });

    return applyMeshOptions(mesh, meshOptions);
}

function getTorus(diameter: number, thickness: number, meshOptions?: MeshOptions): Mesh {
    const mesh = MeshBuilder.CreateTorus(getId(), {
        diameter: diameter,
        thickness: thickness,
        tessellation: 32
    });

    return applyMeshOptions(mesh, meshOptions);
}

export default {
    getBox: getBox,
    getCylinder: getCylinder,
    getSphere: getSphere,
    getTorus: getTorus
}