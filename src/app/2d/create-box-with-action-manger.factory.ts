import {
  ActionManager, Color3,
  ExecuteCodeAction,
  Mesh,
  MeshBuilder,
  Observer,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { TrackWithTrains } from './track-with-trains';
import { Scene2d } from './scene-2d';

export function CreateBoxWithActionMangerFactory(scene: Scene2d): (position: Vector3) => any {
  const boxActionmanager = new ActionManager(scene);

  let moveObservable: Observer<any> | null;
  let startParent: TrackWithTrains | undefined;
  let startPosition: number;

  boxActionmanager.registerAction(new ExecuteCodeAction(ActionManager.OnPickDownTrigger, (event) => {
    const mesh  = event.meshUnderPointer! as Mesh;
    startParent = event.meshUnderPointer!.parent as TrackWithTrains;
    startPosition = startParent.getTrainPosition(mesh);

    let delta = scene.deltaTime;

    let oldPos = mesh.position.clone();
    moveObservable = scene.onBeforeRenderObservable.add(() => {
      mesh.setAbsolutePosition(scene.pick(scene.pointerX, scene.pointerY).pickedPoint!);
      mesh.position.y = 1.1;

      delta += scene.deltaTime
      const positionDelta = mesh.position.subtract(oldPos).length();
      if(delta > 100 && positionDelta > 0.5) {
      delta = 0;
      oldPos = mesh.position.clone();
        const meshBelow = scene.meshes.filter(({name}) => name.startsWith('box')).find(toTest => toTest.intersectsMesh(mesh)) as Mesh;
        const newTrackMesh = scene.meshes.filter(({name}) => name.startsWith('tube')).find(toTest => toTest.intersectsMesh(mesh))

        if (!newTrackMesh) {
          return;
        }
        const newParent = newTrackMesh.parent as TrackWithTrains;

        // TODO CHECK IF MESH CENTER IS LEFT OR RIGHT OF CURRENT MESH
        // -> left or right insert
        newParent.addTrain(mesh, newParent.getTrainPosition(meshBelow), true);
      }
    });


    scene.pointerUpObservable.addOnce(() => {
      scene.onBeforeRenderObservable.remove(moveObservable);

      const mesh = event.source as Mesh;
      const meshParent = mesh.parent as TrackWithTrains;
      const insertAfterMesh = scene.meshes.filter(({name}) => name.startsWith('box')).find(toTest => toTest.intersectsMesh(mesh)) as Mesh;
      const newTrackMesh = scene.meshes.filter(({name}) => name.startsWith('tube')).find(toTest => toTest.intersectsMesh(mesh))
      if (!newTrackMesh) {
        startParent?.addTrain(mesh, startPosition);
        return;
      }
      const newParent = newTrackMesh.parent as TrackWithTrains;
      const track = newParent.getMatchingTrack(newTrackMesh as Mesh);
      if (!track) {
        return;
      }

      // substring by convention
      const trackOrigin = meshParent.name.slice(0, -3);
      newParent.addTrain(mesh, newParent.getTrainPosition(insertAfterMesh));


      //notifications
      scene.trackSwitch$$.next({trackOrigin, trackName: newParent.name.slice(0, -3), trainName: mesh.name})
    })

  }));


  boxActionmanager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, (event) => {
    scene.clicked$$.next(event.source as Mesh);
  }))

  const name = 'box';
  let postfix = 1;

  return (postion: Vector3): Mesh => {
    const options = {depth: 1, height: 1, width: 1};
    const box = MeshBuilder.CreateBox(`${name}${postfix++}`, options)

    const material = new StandardMaterial(`${box.name}_mat`, scene);
    box.material = material;
    material.diffuseColor = new Color3(Math.random(),Math.random(),Math.random())

    box.actionManager = boxActionmanager;
    box.position = postion.clone();
    box.position.y = 1;
    return box;
  };
}
