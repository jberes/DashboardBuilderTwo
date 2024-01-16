import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ISimpleComboSelectionChangingEventArgs } from '@infragistics/igniteui-angular';
import { Subject, take, takeUntil } from 'rxjs';
import { VisualizationNames } from '../models/reveal-dom/visualization-names';
import { FileData } from '../models/reveal-dom/file-data';
import { RevealDomService } from '../services/reveal-dom.service';

declare let $: any;

@Component({
  selector: 'app-view1',
  templateUrl: './view1.component.html',
  styleUrls: ['./view1.component.scss']
})
export class View1Component implements OnInit, OnDestroy, AfterViewInit {
  private destroy$: Subject<void> = new Subject<void>();

  private _dashboardName?: string;
  public get dashboardName(): string | undefined {
    return this._dashboardName;
  }
  public set dashboardName(value: string | undefined) {
    this._dashboardName = value;
    this.revealDomVisualizationNames$.next();
  }
  public dashboardVisualizations?: VisualizationNames;
  public visualizationId?: string;
  public revealDomFileData: FileData[] = [];
  public revealDomVisualizationNames: VisualizationNames[] = [];
  public revealDomVisualizationNames$: Subject<void> = new Subject<void>();

  @ViewChild('revealDashBoard')
  public revealDashBoard!: ElementRef;

  constructor(
    private revealDomService: RevealDomService,
  ) {}

  ngOnInit() {
    this.revealDomService.getFileDataList().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.revealDomFileData = data,
      error: (_err: any) => this.revealDomFileData = []
    });
    this.revealDomService.getVisualizationNamesList(this.dashboardName as any).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.revealDomVisualizationNames = data,
      error: (_err: any) => this.revealDomVisualizationNames = []
    });
    this.revealDomVisualizationNames$.pipe(takeUntil(this.destroy$)).subscribe(
      () => { this.revealDomService.getVisualizationNamesList(this.dashboardName as any).pipe(take(1)).subscribe({
        next: (data) => this.revealDomVisualizationNames = data,
        error: (_err: any) => this.revealDomVisualizationNames = []
    })});
  }

  public ngAfterViewInit() {
    this.setRevealTheme();
    $.ig.RevealSdkSettings.ensureFontsLoaded()
      .then(() => {
        $.ig.RevealSdkSettings.setBaseUrl("http://localhost:5111");

        $.ig.RVDashboard.loadDashboard("Analysis", (dashboard: any) => {
          const _revealDashBoard = new $.ig.RevealView(this.revealDashBoard.nativeElement);
          _revealDashBoard.dashboard = dashboard;
        });
      })
      .catch((err: any) => {
        console.warn('An error occurred during Reveal setup.', err);
      })
;  }

  private setRevealTheme() {
    const style = window.getComputedStyle(document.body);
    const theme = new $.ig.RevealTheme();
    theme.regularFont = style.getPropertyValue('--ig-font-family').replace(/\s/g, '+') ?? 'sans-serif';
    theme.mediumFont = theme.regularFont;
    theme.boldFont = theme.regularFont;

    theme.fontColor = style.getPropertyValue('--ig-surface-500-contrast');
    theme.isDark = theme.fontColor !== 'black';
    theme.dashboardBackgroundColor = `hsl(${style.getPropertyValue('--ig-gray-100')})`;
    theme.visualizationBackgroundColor = `hsl(${style.getPropertyValue('--ig-surface-500')})`;

    $.ig.RevealSdkSettings.theme = theme;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.revealDomVisualizationNames$.complete();
    this.destroy$.complete();
  }

  public singleSelectComboSelectionChanging(event: ISimpleComboSelectionChangingEventArgs) {
    this.dashboardName = event.newSelection as string;
  }

  public listItemClick(item: VisualizationNames) {
    this.dashboardVisualizations = item as VisualizationNames;
  }
}
