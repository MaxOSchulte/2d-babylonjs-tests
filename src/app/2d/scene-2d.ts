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
  Nullable,
  Observable,
  Observer,
  Scene,
  UniversalCamera,
  Vector3,
} from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';
import { TrainObjectManager } from './train-object-manager';
import { TrackWithTrains } from './track-with-trains';
import { Subject } from 'rxjs';


export class Scene2d extends Scene {
  public pressedKey?: string;
  public pressedModifier = false;

  clicked$$ = new Subject<Mesh>();

  trackSwitch$$ = new Subject<{ trainName: string, trackOrigin: string, trackName: string }>();

  trainObjectManager = new TrainObjectManager(this);

  pointerUpObservable = new Observable();


  init(): void {
    new HemisphericLight('hemi-light', new Vector3(-1, 1, 0), this);
    this.setupCamera();
    this.createGroundPlane();
    this.clearColor = new Color4(.9, .9, .9, 1);
    this.addSceneObservables();
  }

  searchByTrackAndTrain(term: string, clearOnUpdate = false): void {
    const trackWithTrains = this.transformNodes
      .filter(tf => tf instanceof TrackWithTrains)
      .filter(({name}) => name.includes(term)) as TrackWithTrains[];

    if (clearOnUpdate) {
      this.removeAllHighlights();
    }

    trackWithTrains.forEach(tf => {
      tf.allTrackNames.forEach(name => this.highlight(name));
    })

  }


  highlight(part: string): void {
    console.log(part)
    const m = this.getMeshByName(part);
    if (!m) {
      return;
    }
    m.outlineColor = new Color3(0.4, 0.4, 1);
    m.outlineWidth = 0.3;
    m.renderOutline = true;
  }


  removeAllHighlights(): void {
    this.meshes.forEach(mesh => mesh.renderOutline = false);
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


    this.actionManager = new ActionManager(this);
    this.onPointerUp = (event) => this.pointerUpObservable.notifyObservers(event);
  }

  private createGroundPlane() {
    const ground = MeshBuilder.CreatePlane('ground', {size: 2000, sideOrientation: Mesh.DOUBLESIDE});
    ground.rotation.x = Math.PI / 2;
    const gridMat = new GridMaterial('ground', this);
    gridMat.lineColor = new Color3(.85, .85, .85);
    gridMat.mainColor = new Color3(.5, .5, .5);
    gridMat.opacity = 0.97;
    ground.material = gridMat;

    const groundActionManager = new ActionManager(this);
    ground.actionManager = groundActionManager;

    groundActionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickDownTrigger, (event: ActionEvent) => {
      const startPoint = this.pick(this.pointerX, this.pointerY)?.pickedPoint;

      let trackToBe: Mesh;
      let moveObservable: Nullable<Observer<any>>;
      if (!startPoint) {
        return;
      }

      trackToBe = MeshBuilder.CreateTube(`trackToBe`, {
        path: [startPoint, startPoint],
        radius: 0.1,
        updatable: true,
      }, this)


      moveObservable = this.onBeforeRenderObservable.add(() => {
        const nextPos = this.pick(this.pointerX, this.pointerY)?.pickedPoint;
        if (!startPoint || !nextPos) {
          return;
        }
        MeshBuilder.CreateTube(`tmp_tube`, {instance: trackToBe, path: [startPoint, nextPos]})
      });


      this.pointerUpObservable.addOnce(() => {
        this.onBeforeRenderObservable.remove(moveObservable);
        const endPoint = this.pick(this.pointerX, this.pointerY)?.pickedPoint;
        if (endPoint && startPoint.subtract(endPoint).length() > 1) {
          this.trainObjectManager.createTubeWithActionManager([startPoint, endPoint]);
        }

        trackToBe.dispose();

      })
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
