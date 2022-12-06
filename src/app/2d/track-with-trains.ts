import { Mesh, TransformNode, Vector3 } from '@babylonjs/core';

export class TrackWithTrains extends TransformNode {
  private readonly tracks: { mesh: Mesh, path: Vector3[] }[] = [];
  private readonly trains: Mesh[] = [];


  get allTrackNames(): string[] {
    return this.tracks.map(track => track.mesh.name);
  }

  addTrack(mesh: Mesh, path: Vector3[]): void {
    mesh.parent = this;
    this.tracks.push({mesh, path: [...path]});
  }

  getMatchingTrack(track: Mesh): { mesh: Mesh, path: Vector3[] } | undefined {
    return this.tracks.find(({mesh}) => mesh === track)
  }

  addTrain(mesh: Mesh): void {
    mesh.setParent(this);
    this.trains.push(mesh);
  }

}
