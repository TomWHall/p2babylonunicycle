import {MeshOptions} from "./MeshFactory";
import TerrainBodyFactory from "./TerrainBodyFactory";
import {HemisphericLight, ShadowGenerator, SpotLight} from "@babylonjs/core/Lights";
import {Scene} from "@babylonjs/core/scene";
import {Color3, Vector3} from "@babylonjs/core/Maths";
import getId from "./IdGenerator";
import * as p2 from "p2";

export default class Terrain {

    scene: Scene;
    spotLight: SpotLight;

    constructor(world: p2.World, scene: Scene) {
        this.scene = scene;
        
        // Top platform
        world.addBody(TerrainBodyFactory.getPlatform([7, 15], 18, 0, scene));

        // Seesaw
        const seesawPosition = [-3, 13.5];
        const seesaw = TerrainBodyFactory.getSeesaw(seesawPosition, 4, 50, scene);
        const seesawAnchor = TerrainBodyFactory.getAnchor(seesawPosition);
        const seesawConstraint = TerrainBodyFactory.getSeesawConstraint(seesaw, seesawAnchor);
        world.addBody(seesaw);
        world.addBody(seesawAnchor);
        world.addConstraint(seesawConstraint);
        
        // Middle platform
        world.addBody(TerrainBodyFactory.getPlatform([0, 11.5], 4, 0, scene));

        // Motor seesaw
        const motorSeesawPosition = [4.025, 11.5];
        const motorSeesaw = TerrainBodyFactory.getSeesaw(motorSeesawPosition, 4, 50, scene);
        const motorSeesawAnchor = TerrainBodyFactory.getAnchor(motorSeesawPosition);
        const motorSeesawConstraint = TerrainBodyFactory.getMotorSeesawConstraint(motorSeesaw, motorSeesawAnchor);
        world.addBody(motorSeesaw);
        world.addBody(motorSeesawAnchor);
        world.addConstraint(motorSeesawConstraint);

        // Bottom platform
        world.addBody(TerrainBodyFactory.getPlatform([6.5, 9], 3, 0, scene));

        // Step 1
        world.addBody(TerrainBodyFactory.getPlatform([9.25, 8], 1, 0, scene));

        // Step 2
        world.addBody(TerrainBodyFactory.getPlatform([11, 7], 1, 0, scene));
        
        // Target
        world.addBody(TerrainBodyFactory.getTarget([14.25, 6], scene));

        // Ambient light
        const hemisphericLight = new HemisphericLight(getId(), new Vector3(0, 3, -6), scene);
        hemisphericLight.intensity = 0.3;

        // Tracking spotlight
        const spotLight = this.spotLight = new SpotLight(getId(), new Vector3(-6, 20, 3), Vector3.Zero(), Math.PI / 8, 2, scene);
        spotLight.diffuse = new Color3(1, 1, 0.9);
        spotLight.intensity = 5;
    }

    handlePreWorldStart(): void {
        // Setup shadows
        const shadowGenerator = new ShadowGenerator(1024, this.spotLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.depthScale = 8192;
        shadowGenerator.useKernelBlur = true;
        shadowGenerator.blurKernel = 8;

        this.scene.meshes.forEach(m => {
            const meshOptions = (m as any).meshOptions as MeshOptions;
            
            if (!(meshOptions?.shadows === false)) {
                shadowGenerator.getShadowMap().renderList.push(m);
                m.receiveShadows = true;
            }
        });
    }

    handlePostWorldStep(timeMultiplier: number, playerPositionHistory: number[][]): void {
        const spotLightPosition = playerPositionHistory[0];
        this.spotLight.setDirectionToTarget(new Vector3(spotLightPosition[0], spotLightPosition[1] + 0.7, 0));
    }
}