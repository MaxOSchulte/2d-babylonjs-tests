import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Engine, Mesh } from '@babylonjs/core';
import { Scene2d } from './2d/scene-2d';

import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvas', {static: true}) private canvasRef?: ElementRef<HTMLCanvasElement>;
  title = 'poc-babylonjs-lines';
  name = ''
  position = '';

  clicked$?: Observable<Mesh>;
  private scene?: Scene2d;

  constructor(private readonly ngZone: NgZone) {
  }

  async ngAfterViewInit(): Promise<void> {
    const engine = new Engine(this.canvasRef!.nativeElement);
    this.scene = new Scene2d(engine);
    this.clicked$ = this.scene.clicked$$.asObservable();
    this.scene.init();
    this.ngZone.runOutsideAngular(() => engine.runRenderLoop(() => this.scene!.render()));

    await this.scene.debugLayer.show({
      overlay: true,
    });

    this.scene.trackSwitch$$.subscribe(info => alert(JSON.stringify(info)));
  }

  search(term: string): void {
    this.scene!.searchByTrackAndTrain(term, true);
  }

  clearHighlights(): void {
    this.scene!.removeAllHighlights();
  }
}
