import { Mesh, Vector3 } from '@babylonjs/core';
import { CreateBoxWithActionMangerFactory } from './create-box-with-action-manger.factory';
import { CreateTubeWithActionMangerFactory } from './create-tube-with-action-manger.factory';
import { Scene2d } from './scene-2d';

export class TrainObjectManager {
  createBoxWithActionManager: (position: Vector3) => Mesh;
  createTubeWithActionManager: (points: Vector3[]) => Mesh;

  constructor(private scene: Scene2d) {
    this.createBoxWithActionManager = CreateBoxWithActionMangerFactory(scene)
    this.createTubeWithActionManager = CreateTubeWithActionMangerFactory(scene);
  }
}
