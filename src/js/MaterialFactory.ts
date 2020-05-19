import Logger from "./Logger";
import {AssetsManager} from "@babylonjs/core/Misc";
import {Scene} from "@babylonjs/core/scene";
import {StandardMaterial} from "@babylonjs/core/Materials";
import {Texture} from "@babylonjs/core/Materials/Textures";
import getId from "./IdGenerator";

const imageNames: any = {
    LeatherBlack: 'leather-black.jpg',
    LeatherRed: 'leather-red.jpg',
    MetalChrome: 'metal-chrome.jpg',
    CheckRedWhite: 'check-red-white.jpg',
    VelvetGreen: 'velvet-green.jpg',
    Wood: 'wood.jpg',
    FabricRed: 'fabric-red.jpg',
    Tyre: 'tyre.jpg',
    Skin: 'skin.jpg',
    TilesRed: 'tiles-red.jpg'
};

async function loadImages(scene: Scene): Promise<void> {
    const assetsManager = new AssetsManager(scene);

    Object.keys(imageNames).forEach(key => {
        const imageName = imageNames[key];
        const url = `img/${imageName}`;

        const textureTask = assetsManager.addTextureTask(`TextureTask-${key}`, url);

        textureTask.onSuccess = function (task) {
            Textures[key] = task.texture;
        }
    });

    return new Promise<void>((resolve, reject) => {
        Logger.log('Loading assets');
        const startTime = performance.now();

        assetsManager.onFinish = tasks => {
            const duration = performance.now() - startTime;
            Logger.log(`Loaded assets in ${duration}ms`);

            resolve();
        };

        assetsManager.onTaskError = task => {
            reject(task.errorObject);
        };

        assetsManager.load();
    });
}

function getMaterial(texture: Texture, width: number, height: number, scaleFactor: number, scene: Scene): StandardMaterial {
    const material = new StandardMaterial(getId(), scene);

    const textureClone = texture.clone();
    
    if (width > height) {
        textureClone.uScale = (width / height) * scaleFactor;
        textureClone.vScale = height * scaleFactor;
    } else if (height > width) {
        textureClone.uScale = width * scaleFactor;
        textureClone.vScale = (height / width) * scaleFactor;
    } else {
        textureClone.uScale = scaleFactor;
        textureClone.vScale = scaleFactor;
    }

    material.diffuseTexture = textureClone;

    return material;
}

export default {
    loadAssets: loadImages,
    getMaterial: getMaterial
}

interface TextureMap {
    [name: string]: Texture;

    LeatherBlack: Texture;
    LeatherRed: Texture;
    MetalChrome: Texture;
    CheckRedWhite: Texture;
    VelvetGreen: Texture;
    Wood: Texture;
    FabricRed: Texture;
    Tyre: Texture;
    Skin: Texture;
    TilesRed: Texture;
}

export const Textures = {} as TextureMap;