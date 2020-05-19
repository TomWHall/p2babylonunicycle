import {Quaternion, Vector3} from "@babylonjs/core/Maths";
import {Mesh} from "@babylonjs/core/Meshes";
import * as p2 from "p2";

/*
Sets the position and rotation of the Babylon meshes stored against the p2 shapes 
 */
function updateMeshes(world: p2.World): void {
    const bodies = world.bodies;

    for (let b = 0; b < bodies.length; b++) {
        const body = bodies[b];
        const shapes = body.shapes;

        for (let s = 0; s < shapes.length; s++) {
            const shape = shapes[s];
            const meshes = (shape as any).meshes as Mesh[];

            if (meshes) {
                // Add the world-relative body angle to the body-relative shape position
                const withBodyAngle = p2.vec2.create();
                p2.vec2.rotate(withBodyAngle, shape.position, body.angle);

                // Add the world-relative body position
                const withBodyPosition = p2.vec2.create();
                p2.vec2.add(withBodyPosition, body.position, withBodyAngle);

                for (let m = 0; m < meshes.length; m++) {
                    const mesh = meshes[m];

                    mesh.position.x = withBodyPosition[0];
                    mesh.position.y = withBodyPosition[1];

                    const axis = new Vector3(0, 0, 1);
                    mesh.rotationQuaternion = Quaternion.RotationAxis(axis, body.angle + shape.angle);
                }
            }
        }
    }
}

export default {
    updateMeshes: updateMeshes
}