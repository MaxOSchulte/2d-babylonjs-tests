import {
  ActionEvent,
  ActionManager,
  Camera,
  Color3,
  Color4,
  ExecuteCodeAction,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Scene,
  UniversalCamera,
  Vector3,
} from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';
import { Subject } from 'rxjs';
import { TrainObjectManager } from './train-object-manager';


export class Scene2d extends Scene {
  public pressedKey?: string;
  public pressedModifier = false;


  clicked$$ = new Subject<Mesh>();

  trackSwitch$$ = new Subject<{trainName: string, trackOrigin: string, trackName: string}>();


  trainObjectManager = new TrainObjectManager(this);


  init(): void {
    new HemisphericLight('hemi-light', new Vector3(-1, -1, 0), this);
    this.setupCamera();
    this.createGroundPlane();
    this.clearColor = new Color4(.9, .9, .9, 1);
    this.addSceneObservables();
  }

  private addSceneObservables() {
    this.onKeyboardObservable.add(event => {
      if (event.type === 1) {

        this.pressedKey = event.event.key;
        this.pressedModifier = event.event.ctrlKey;
      }

      if (event.type === 2) {
        this.pressedKey = undefined;
        this.pressedModifier = false;
      }
    });
  }

  private createGroundPlane() {
    const ground = MeshBuilder.CreatePlane('ground', {size: 2000, sideOrientation: Mesh.DOUBLESIDE});
    ground.rotation.x = Math.PI / 2;
    const gridMat = new GridMaterial('ground', this);
    gridMat.lineColor = new Color3(.85, .85, .85);
    gridMat.mainColor = new Color3(.5, .5, .5);
    gridMat.opacity = 0.97;
    ground.material = gridMat;


    const points: Vector3[] = [];

    const groundActionManager = new ActionManager(this);
    ground.actionManager = groundActionManager;

    groundActionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, (event: ActionEvent) => {
      if (this.pressedModifier) {
        return;
      }

      const hit = this.pick(this.pointerX, this.pointerY)?.pickedPoint;
      if (hit) {
        points.push(hit)
      }

      if (points.length === 2) {
        this.trainObjectManager.createTubeWithActionManager(points);
        points.length = 0;
      }
    }))
    return ground;
  }

  private setupCamera() {
    const camera = new UniversalCamera('camera', new Vector3(0, 4, 0), this);
    camera.attachControl();
    camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    camera.orthoRight = 30;
    camera.orthoTop = 30 * 2 / 4;
    camera.orthoLeft = -30;
    camera.orthoBottom = -30 * 2 / 4;
    camera.lockedTarget = Vector3.Zero();
  }
}
