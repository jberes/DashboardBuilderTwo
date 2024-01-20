import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ISimpleComboSelectionChangingEventArgs } from '@infragistics/igniteui-angular';
import { Subject, take, takeUntil } from 'rxjs';
import { VisualizationNames } from '../models/reveal-dom/visualization-names';
import { FileData } from '../models/reveal-dom/file-data';
import { RevealDomService } from '../services/reveal-dom.service';
import { RdashDocument, Theme } from '@revealbi/dom';
import { RevealViewOptions, SavedEvent } from '@revealbi/ui';

declare let $: any;

interface VizInfo {
  id: string;
  dashboardId: string;
  name?: string;
  dashboardName: string; // New field to store the dashboard name
  selected?: boolean;
}

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
  public revealDomFileData: FileData[] = [];
  public revealDomVisualizationNames: VisualizationNames[] = [];
  public revealDomVisualizationNames$: Subject<void> = new Subject<void>();
  
  public visualizationId?: string;
  public visualizationName?: string;
  public visualizationTitle?: string;

  dashboardDocument: RdashDocument | string | null = "";
  availableViz: VizInfo[] = [];
  vizCollection: VizInfo[] = [];
  selectedViz?: VizInfo;

  sourceDocs: Map<string, RdashDocument> = new Map();

  @ViewChild('revealDashboard')
  public revealDashboard!: ElementRef;

  @ViewChild('revealDashboard1')
  public revealDashboard1!: ElementRef;


  options: RevealViewOptions = {
    canSave: true,
    canSaveAs: true,
    saveOnServer: false
  }

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
    //this.setRevealTheme();
    $.ig.RevealSdkSettings.setBaseUrl("http://localhost:5111");
  }

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
    this.dashboardName = event.newSelection.name as string;
  }

  public listItemClick(item: VisualizationNames) {
    this.dashboardVisualizations = item as VisualizationNames;
    this.visualizationId = item.id as string;
    this.visualizationName = item.name as string;
    this.visualizationTitle = item.title as string;

    if (this.dashboardName && this.visualizationName) {
      this.loadDashboardById(this.dashboardName, this.visualizationId);
      this.selectedViz = {
        id: this.visualizationId,
        dashboardId: this.dashboardName,
        name: this.visualizationName,
        dashboardName: this.dashboardName
      };
      console.log("Viz Info Selected:", this.selectedViz);
    } 
  }

  private loadDashboardById(dashboardName: string, visualizationId: string) {
    $.ig.RVDashboard.loadDashboard(dashboardName, (dashboard: any) => {
      const _revealDashboard = new $.ig.RevealView(this.revealDashboard.nativeElement);
      _revealDashboard.singleVisualizationMode=true;
      _revealDashboard.showMenu=false;
      _revealDashboard.dashboard = dashboard;
      _revealDashboard.maximizedVisualization = dashboard.visualizations.getById(visualizationId);
    });   
  }

  async generateDashboard() {
    const document = new RdashDocument("Generated Dashboard");

    for (const viz of this.vizCollection) {
      let sourceDoc = this.sourceDocs.get(viz.dashboardId);      
      
      if (!sourceDoc) {
        sourceDoc = await RdashDocument.load(viz.dashboardId);
        this.sourceDocs.set(viz.dashboardId, sourceDoc);
      }

      if (sourceDoc) {
        document.import(sourceDoc, viz.id);
        console.log("Viz Id Added: " + viz.id);
      }
    }
    this.dashboardDocument = document;
  }

  iconItemClick(item: VisualizationNames) {
    this.dashboardVisualizations = item as VisualizationNames;
    this.visualizationId = item.id as string;
    this.visualizationName = item.name as string;
    this.visualizationTitle = item.title as string;

    if (this.dashboardName && this.visualizationName) {
      this.selectedViz = {
        id: this.visualizationId,
        dashboardId: this.dashboardName,
        name: this.visualizationName,
        dashboardName: this.dashboardName
      };
      this.vizCollection.push(this.selectedViz);
      this.generateDashboard();
    } 

  }

  onSaved(args: SavedEvent) {
    console.log(args);
    console.log("handleSaved");
    args.saveFinished();
    }

}
