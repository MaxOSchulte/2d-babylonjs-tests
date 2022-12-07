import {
  ActionEvent,
  ActionManager,
  Color3,
  ExecuteCodeAction,
  Mesh,
  MeshBuilder, Nullable,
  Observer,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { TrackWithTrains } from './track-with-trains';
import { Scene2d } from './scene-2d';

export function CreateTubeWithActionMangerFactory(scene: Scene2d): (points: Vector3[]) => any {
  const tubeActionManager = new ActionManager(scene);

  let trackToBe: Mesh;
  let startPos: Nullable<Vector3>;
  let moveObservable: Nullable<Observer<any>>;

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

  return (globalPath: Vector3[]): Mesh => {
    const trackWithTrains = new TrackWithTrains(`${name}${postfix}_tn`, scene);
    trackWithTrains.position = globalPath[0];
    const localPath = globalPath.map(points => points.subtract(trackWithTrains.position)).map(({
                                                                                                 x,
                                                                                                 y,
                                                                                                 z,
                                                                                               }) => new Vector3(Math.round(x), 1, Math.round(z)));
    const tube = MeshBuilder.CreateTube(`${name}${postfix++}`, {
      path: localPath,
      radius: 0.1,
    }, scene)
    tube.actionManager = tubeActionManager;
    tube.material = new StandardMaterial(`${tube.name}_mat`, scene);
    (tube.material as StandardMaterial).diffuseColor = Color3.Black();
    trackWithTrains.addTrack(tube, localPath);
    return tube;
  };
}
