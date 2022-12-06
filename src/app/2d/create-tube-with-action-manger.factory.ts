import { ActionEvent, ActionManager, ExecuteCodeAction, Mesh, MeshBuilder, Vector3 } from '@babylonjs/core';
import { TrackWithTrains } from './track-with-trains';
import { Scene2d } from './scene-2d';

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
    const path = points.map(points => points.subtract(trackWithTrains.position)).map(({
                                                                                        x,
                                                                                        y,
                                                                                        z,
                                                                                      }) => new Vector3(Math.round(x), 1, Math.round(z)));
    const tube = MeshBuilder.CreateTube(`${name}${postfix++}`, {
      path,
      radius: 0.1,
    }, scene)
    tube.actionManager = tubeActionManager;
    trackWithTrains.addTrack(tube, path);
    return tube;
  };
}
