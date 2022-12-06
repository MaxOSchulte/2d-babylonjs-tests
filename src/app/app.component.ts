import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Engine, Mesh, Scene } from '@babylonjs/core';
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

  constructor(private readonly ngZone: NgZone) {
  }

  async ngAfterViewInit(): Promise<void> {
    const engine = new Engine(this.canvasRef!.nativeElement);
    const scene = new Scene2d(engine);
    this.clicked$ = scene.clicked$$.asObservable();
    scene.init();
    this.ngZone.runOutsideAngular(() => engine.runRenderLoop(() => scene.render()));

    await scene.debugLayer.show({
      overlay: true
    });

    scene.trackSwitch$$.subscribe(info => alert(JSON.stringify(info)));
  }
}
