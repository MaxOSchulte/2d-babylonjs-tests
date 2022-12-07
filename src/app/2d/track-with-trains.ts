import { Mesh, TransformNode, Vector3 } from '@babylonjs/core';

export class TrackWithTrains extends TransformNode {
  private readonly tracks: { mesh: Mesh, path: Vector3[] }[] = [];
  private readonly trains: Mesh[] = [];

  get head(): Vector3 {
    return this.tracks[0].path[0];
  }

  get tail(): Vector3 {
    return this.tracks[this.tracks.length - 1].path[1];
  }


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

  getTrainBefore(train: Mesh): Mesh {
    const index = this.trains.findIndex(neighbour => train === neighbour);
    return this.trains[index >= 1 ? index - 1 : 0];
  }

  getTrainPosition(train: Mesh): number {
    return this.trains.findIndex(neighbour => train === neighbour);
  }

  removeTrain(mesh: Mesh): void {
    const foundIndexForTrain = this.trains.findIndex(train => train === mesh);
    this.trains.splice(foundIndexForTrain, 1);
    this.rearrange();
  }

  addTrain(mesh: Mesh, position?: number, skipMeshInRearrage? : boolean): void {
    mesh.setParent(this);
    if (position) {
      this.trains.splice(position, 0, mesh);
    } else {
      this.trains.push(mesh);
    }

    this.rearrange(skipMeshInRearrage ? mesh : undefined);
  }

  rearrange(skipMesh?: Mesh): void {
    this.trains.filter(train => !skipMesh || train !== skipMesh).forEach(mesh => {
      const meshIndex = this.trains.findIndex(m => m === mesh);
      const nextDistance = this.trains.slice(0, meshIndex).reduce((distance, train) => {
        const bi = train.getBoundingInfo();
        const max = bi.maximum

        return distance + max.length() +  max.length() / 2;
      }, 0)
      mesh.position = this.tail.clone().normalize().multiply(new Vector3(nextDistance, 1, nextDistance));
    })
  }

}
