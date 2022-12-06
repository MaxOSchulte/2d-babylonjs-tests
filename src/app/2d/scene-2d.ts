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
  Observer,
  Scene,
  TransformNode,
  UniversalCamera,
  Vector3,
} from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';
import { Subject } from 'rxjs';


export class TrackWithTrains extends TransformNode {
  private readonly tracks: Mesh[] = [];
  private readonly trains: Mesh[] = [];


  addTrack(mesh: Mesh): void {
    mesh.parent = this;
    this.tracks.push(mesh);
  }

  addTrain(mesh: Mesh): void {
    mesh.setParent(this);
    this.trains.push(mesh);
  }

}

export function CreateBoxWithActionMangerFactory(scene: Scene2d): (position: Vector3) => any {
  const boxActionmanager = new ActionManager(scene);

  let moveObservable: Observer<any> | null;

  boxActionmanager.registerAction(new ExecuteCodeAction(ActionManager.OnPickDownTrigger, (event) => {
    moveObservable = scene.onBeforeRenderObservable.add(() => {
      const mesh = event.meshUnderPointer!;
      mesh.setAbsolutePosition(scene.pick(scene.pointerX, scene.pointerY).pickedPoint!);
      mesh.position.y = 1;
    });
  }));

  boxActionmanager.registerAction(new ExecuteCodeAction(ActionManager.OnPickUpTrigger, (event) => {
    scene.onBeforeRenderObservable.remove(moveObservable);
  }));

  boxActionmanager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, (event) => {
    scene.clicked.next(event.source as Mesh);
  }))

  const name = 'box';
  let postfix = 1;

  return (postion: Vector3): Mesh => {
    const box = MeshBuilder.CreateBox(`${name}${postfix++}`, {size: 1})
    box.actionManager = boxActionmanager;
    box.position = postion.clone();
    box.position.y = 1;
    return box;
  };
}


export function CreateTubeWithActionMangerFactory(scene: Scene2d): (points: Vector3[]) => any {
  const tubeActionManager = new ActionManager(scene);

  // TODO edit tube endings or position
  tubeActionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickDownTrigger, (event) => {
    // moveMesh = event.meshUnderPointer! as Mesh;
  }));
  tubeActionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickUpTrigger, (event) => {
    // moveMesh = undefined;
  }));

  // TODO show meta infos
  tubeActionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, (event) => {
    // scene.clicked.next(event.source as Mesh);
  }))

  tubeActionManager.registerAction(new ExecuteCodeAction(ActionManager.OnDoublePickTrigger, (event: ActionEvent) => {
    if (!scene.pressedModifier) {
      return;
    }
    let hit = scene.pick(scene.pointerX, scene.pointerY)?.pickedPoint;
    if (!hit) {
      return;
    }
    const trackWithTrains = ((event.source as Mesh).parent as TrackWithTrains);
    const box = scene.trainObjectManager.createBoxWithActionManager(hit);
    trackWithTrains.addTrain(box);
  }));

  const name = 'tube';
  let postfix = 1;

  return (points: Vector3[]): Mesh => {
    const trackWithTrains = new TrackWithTrains(`${name}${postfix}_tn`, scene);
    trackWithTrains.position = points[0];
    const tube = MeshBuilder.CreateTube(`${name}${postfix++}`, {
      path: points.map(points => points.subtract(trackWithTrains.position)).map(({
                                                                                   x,
                                                                                   y,
                                                                                   z,
                                                                                 }) => new Vector3(Math.round(x), 1, Math.round(z))),
      radius: 0.1,
    }, scene)
    tube.actionManager = tubeActionManager;
    trackWithTrains.addTrack(tube);
    return tube;
  };
}


export class TrainObjectManager {
  createBoxWithActionManager: (position: Vector3) => Mesh;
  createTubeWithActionManager: (points: Vector3[]) => Mesh;

  constructor(private scene: Scene2d) {
    this.createBoxWithActionManager = CreateBoxWithActionMangerFactory(scene)
    this.createTubeWithActionManager = CreateTubeWithActionMangerFactory(scene);
  }
}


export class Scene2d extends Scene {
  public pressedKey?: string;
  public pressedModifier = false;


  clicked = new Subject<Mesh>();

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
