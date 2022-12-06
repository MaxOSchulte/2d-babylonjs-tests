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
    const newTrackMesh = scene.meshes.filter(({name}) => name.startsWith('tube')).find(toTest => toTest.intersectsMesh(mesh))
    console.log(newTrackMesh, mesh, startPosition);
    if (!newTrackMesh) {
      if (mesh && startPosition) {
        mesh.position = startPosition;
      }
      return;
    }
    const newParent = newTrackMesh.parent as TrackWithTrains;
    const track = newParent.getMatchingTrack(newTrackMesh as Mesh);
    console.log(track?.mesh?.name, {track})
    if (!track) {
      return;
    }
    const end = track.path[track.path.length - 1].clone();

    // substring by convention
    const trackOrigin = (mesh.parent as TrackWithTrains).name.slice(0, -3);

    newParent.addTrain(mesh);
    mesh.position = end.multiply(new Vector3(0.5, 0.5, 0.5));

    //notifications
    scene.trackSwitch$$.next({trackOrigin, trackName: newParent.name.slice(0, -3), trainName: mesh.name})
  }));

  boxActionmanager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, (event) => {
    scene.clicked$$.next(event.source as Mesh);
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
