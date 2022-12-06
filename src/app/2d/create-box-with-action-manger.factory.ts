import { ActionManager, ExecuteCodeAction, Mesh, MeshBuilder, Observer, Vector3 } from '@babylonjs/core';
import { TrackWithTrains } from './track-with-trains';
import { Scene2d } from './scene-2d';

export function CreateBoxWithActionMangerFactory(scene: Scene2d): (position: Vector3) => any {
  const boxActionmanager = new ActionManager(scene);

  let moveObservable: Observer<any> | null;
  let startPosition: Vector3 | undefined;

  boxActionmanager.registerAction(new ExecuteCodeAction(ActionManager.OnPickDownTrigger, (event) => {
    startPosition = event.meshUnderPointer!.position.clone();
    moveObservable = scene.onBeforeRenderObservable.add(() => {
      const mesh = event.meshUnderPointer!;
      mesh.setAbsolutePosition(scene.pick(scene.pointerX, scene.pointerY).pickedPoint!);
      mesh.position.y = 1;
    });
  }));

  boxActionmanager.registerAction(new ExecuteCodeAction(ActionManager.OnPickUpTrigger, (event) => {
    scene.onBeforeRenderObservable.remove(moveObservable);

    const mesh = event.source as Mesh;
    const intersectionMesh = scene.meshes.filter(({name}) => name.startsWith('tube')).find(toTest => toTest.intersectsMesh(mesh))
    console.log(intersectionMesh, mesh, startPosition);
    if (!intersectionMesh) {
      if (mesh && startPosition) {
        mesh.position = startPosition;
      }
      return;
    }
    const parent = intersectionMesh.parent as TrackWithTrains;
    const track = parent.getMatchingTrack(intersectionMesh as Mesh);
    console.log(track?.mesh?.name, {track})
    if (!track) {
      return;
    }
    const end = track.path[track.path.length - 1].clone();

    parent.addTrain(mesh);
    mesh.position = end.multiply(new Vector3(0.5, 0.5, 0.5));
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
