import Terrain from "./Terrain";
import Direction from "./Direction";
import Player from "./Player";
import MaterialFactory from "./MaterialFactory";
import RenderUtil from "./RenderUtil";
import {tyreTerrainContactMaterial} from "./p2Materials";
import LoadingScreen from "./LoadingScreen";
import {UniversalCamera} from "@babylonjs/core/Cameras";
import {Color4} from "@babylonjs/core/Maths";
import {Engine} from "@babylonjs/core/Engines/engine";
import {Scene} from "@babylonjs/core/scene";
import {Vector3} from "@babylonjs/core/Maths/math";
import {KeyboardEventTypes, PointerEventTypes} from "@babylonjs/core/Events";
import getId from "./IdGenerator";
import * as p2 from "p2";

export default class App {

    world: p2.World;
    scene: Scene;

    canvas: HTMLCanvasElement;

    player: Player;
    terrain: Terrain;

    camera: UniversalCamera;

    lastAnimateTime: number = performance.now();
    obliqueView: boolean = true;
    active: boolean = true;
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.setCanvasSize();

        this.world = new p2.World();
        this.world.addContactMaterial(tyreTerrainContactMaterial);

        const engine = new Engine(canvas);
        engine.loadingScreen = new LoadingScreen();
        engine.displayLoadingUI();

        const scene = this.scene = new Scene(engine);
        scene.clearColor = new Color4(0, 0, 0, 1);

        this.camera = new UniversalCamera(getId(), Vector3.Zero(), scene);

        MaterialFactory.loadImages(scene)
            .then(() => {
                this.addInputHandlers();

                engine.loadingScreen.hideLoadingUI();
                this.start();
            });
    }

    private start(): void {
        this.terrain = new Terrain(this.world, this.scene);
        this.player = new Player(this.world, this.scene, [0, 15.37]);

        this.terrain.handlePreWorldStart();

        this.canvas.focus();

        this.lastAnimateTime = performance.now();
        this.animate(performance.now());
    }

    private animate(time: number): void {
        requestAnimationFrame(this.animate.bind(this));

        if (this.active) {
            let deltaTime = time - (this.lastAnimateTime || time);
            if (deltaTime > 500) deltaTime = 0;

            this.lastAnimateTime = time;

            this.world.step(1 / 60, deltaTime / 1000, 10);

            // Update player and terrain objects
            const timeMultiplier = deltaTime / (1000 / 60);
            this.player.handlePostWorldStep(timeMultiplier);
            this.terrain.handlePostWorldStep(timeMultiplier, this.player.positionHistory);

            // Update mesh positions and rotations
            RenderUtil.updateMeshes(this.world);
        }

        // Track the player
        const camera = this.camera;
        const position = this.player.wheel.position;

        if (this.obliqueView) {
            camera.position.x = position[0] - 4;
            camera.position.y = position[1] + 2;
            camera.position.z = -4;
        } else {
            camera.position.x = position[0];
            camera.position.y = position[1];
            camera.position.z = -8;
        }

        camera.setTarget(new Vector3(position[0], position[1], 0));
        
        this.scene.render();
    }

    private setCanvasSize(): void {
        const canvasElement = this.canvas;
        canvasElement.style.width = window.innerWidth + 'px';
        canvasElement.style.height = window.innerHeight + 'px';
    }

    private addInputHandlers(): void {
        this.scene.onKeyboardObservable.add((keyboardInfo) => {
            switch (keyboardInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    switch (keyboardInfo.event.key) {
                        case 'ArrowLeft':
                            this.player.direction = Direction.Left;
                            break;

                        case 'ArrowRight':
                            this.player.direction = Direction.Right;
                            break;
                    }
                    break;

                case KeyboardEventTypes.KEYUP:
                    switch (keyboardInfo.event.key) {
                        case 'ArrowLeft':
                        case 'ArrowRight':
                            this.player.direction = null;
                            break;
                    }
                    break;
            }
        });

        this.scene.onPointerObservable.add(pointerInfo => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    const offsetX = pointerInfo.event.offsetX;
                    if (offsetX <= this.canvas.width / 2) {
                        this.player.direction = Direction.Left;
                    } else {
                        this.player.direction = Direction.Right;
                    }
                    break;
                case PointerEventTypes.POINTERUP:
                    this.player.direction = null;
                    break;
            }
        });

        document.getElementById('info-open-button').addEventListener('click', (e: Event) => this.handleOpenInfo(e));
        document.getElementById('info-close-button').addEventListener('click', (e: Event) => this.handleCloseInfo(e));

        document.getElementById('view-mode-oblique').addEventListener('change', (e: Event) => this.handleViewModeChange((e.target as HTMLInputElement).checked));
        document.getElementById('view-mode-side').addEventListener('change', (e: Event) => this.handleViewModeChange(!(e.target as HTMLInputElement).checked));
    }

    private handleOpenInfo(e: Event): void {
        e.preventDefault();
        
        document.getElementById('info-panel').style.display = 'block';
        document.getElementById('info-open-button').style.display = 'none';
        
        this.active = false;
    }

    private handleCloseInfo(e: Event): void {
        e.preventDefault();
        
        document.getElementById('info-open-button').style.display = 'flex';
        document.getElementById('info-panel').style.display = 'none';

        window.setTimeout(() => {
            this.active = true;    
        }, 500);
    }

    private handleViewModeChange(isObliqueView: boolean): void {
        this.obliqueView = isObliqueView;
    }
}