import {ILoadingScreen} from "@babylonjs/core/Loading";

export default class CustomLoadingScreen implements ILoadingScreen {

    loadingUIText: string;
    loadingUIBackgroundColor: string;

    public displayLoadingUI() {
    }

    public hideLoadingUI() {
        document.getElementById('loading').style.display = 'none';
    }
}