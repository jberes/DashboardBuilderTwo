import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ISimpleComboSelectionChangingEventArgs } from '@infragistics/igniteui-angular';
import { Subject, take, takeUntil } from 'rxjs';
import { VisualizationNames } from '../models/reveal-dom/visualization-names';
import { FileData } from '../models/reveal-dom/file-data';
import { RevealDomService } from '../services/reveal-dom.service';
import { RdashDocument, Theme } from '@revealbi/dom';
import { RevealSdkSettings, RevealViewOptions, SavedEvent } from '@revealbi/ui';
import { environment } from 'src/environments/environment';

declare let $: any;

interface VizInfo {
  id: string;
  dashboardId: string;
  name?: string;
  dashboardName: string;
  selected?: boolean;
}

@Component({
  selector: 'app-view1',
  templateUrl: './view1.component.html',
  styleUrls: ['./view1.component.scss']
})

export class View1Component implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();

   _singleViz?: string;
  _singleVizDocument?: string;

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

  options: RevealViewOptions = {
    canEdit: true,
    canSaveAs: true,   
    startInEditMode: true, 
    dataSourceDialog:
    {
      showExistingDataSources: true,
    },
    header: {
      menu: {
        exportToExcel: false,
        exportToImage: false,
        exportToPdf: false,
        exportToPowerPoint: false,
        refresh: false,
        items: [        
            { title: "Clear / New", click: () => this.resetDashboard(), icon: "https://users.infragistics.com/Reveal/Images/download.png" },
          ]
        }
      }
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

  resetDashboard() {
    this.vizCollection = [];
    this.dashboardDocument = null;
  }


  public onSaving(e: SavedEvent) {
    console.log("in the save event");
    console.log(e);
  
  //   if (e.saveAs) {
  //     const newName = prompt("Please enter the dashboard name");
  //     fetch(RevealSdkSettings.serverUrl + "/DashboardFile/" + newName)
  //     .then(response => {
  //         if (response.status === 200) { //dashboard already exists
  //             if (!window.confirm("A dashboard with name: " + newName + " already exists. Do you want to override it?")) {
  //                 return;
  //             }
  //         }          
  //           e.dashboardId = e.name = newName!;
  //           console.log("newName = " + newName);
  //           console.log("e.dashboardId = " + e.dashboardId);
  //           console.log("e.name) = " + e.name);
  //           e.saveFinished();          
  //     });
  // } else {
  //     e.saveFinished();
  // }   


    // if (args.saveAs) {
    //   var newName = prompt("Please enter the dashboard name");
    //   this.isDuplicateName(newName).then(isDuplicate => {
  
    //     if (newName !== null) {
    //       args.serializeWithNewName(newName, bytes => {
    //         this.saveDashboard(newName, bytes, true).then(() => {
    //           args.saveFinished();
    //         });
    //       }, error => {
    //       });
    //     } 
    //   });
    // }
    // else {
    //   args.serialize(bytes => {
    //     this.saveDashboard(args.name, bytes).then(() => {
    //         args.saveFinished();
    //     });
    //   }, () => {   });
    // }
  }

  private isDuplicateName(name: any) {
    return fetch(`${environment.BASE_URL}/isduplicatename/${name}`).then(resp => resp.text());
  }

  private saveDashboard(name: string | null, bytes: any, isSaveAs = false) {
      let url = `${environment.BASE_URL}/dashboards/${name}`;
      let params = {
          body: bytes,
          method: "PUT"
      }
      if (isSaveAs) {
          params.method = "POST"
      }
      return fetch(url, params);
  }

  private handleItemClick(item: VisualizationNames): void {
    this.dashboardVisualizations = item;
    this.visualizationId = item.id;
    this.visualizationName = item.name;
    this.visualizationTitle = item.title;

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
  
  ngOnDestroy() {
    this.destroy$.next();
    this.revealDomVisualizationNames$.complete();
    this.destroy$.complete();
  }

  public singleSelectComboSelectionChanging(event: ISimpleComboSelectionChangingEventArgs) {
    this.dashboardName = event.newSelection.name as string;
  }

  public listItemClick(item: VisualizationNames): void {
    this.handleItemClick(item);
  }

  public iconItemClick(item: VisualizationNames): void {
    this.handleItemClick(item);
    if (this.selectedViz) {
      this.vizCollection.push(this.selectedViz);
      this.generateDashboard();
    } else {
      console.error('Selected visualization is undefined');
    }
  }
  
  private loadDashboardById(dashboardName: string, visualizationId: string) {
     $.ig.RVDashboard.loadDashboard(dashboardName, (dashboard: any) => {


      // this._singleVizDocument = dashboard;
      // this._singleViz = dashboard.visualizations.getById(visualizationId);

      const _revealDashboard = new $.ig.RevealView(this.revealDashboard.nativeElement);
      _revealDashboard.singleVisualizationMode=true;
      _revealDashboard.showMenu=false;
      _revealDashboard.dashboard = dashboard;
      _revealDashboard.maximizedVisualization = dashboard.visualizations.getById(visualizationId);
    });
  }

  private async generateDashboard(): Promise<void> {
    console.log("Add Generated Dashboard");
    const document = new RdashDocument("Generated Dashboard");
    for (const viz of this.vizCollection) {
      let sourceDoc = this.sourceDocs.get(viz.dashboardId);      
      if (!sourceDoc) {
        try {
          sourceDoc = await RdashDocument.load(viz.dashboardId);
          this.sourceDocs.set(viz.dashboardId, sourceDoc);
        } catch (error) {
          console.error(`Failed to load document: ${viz.dashboardId}`, error);
          continue;
        }
      }
      if (sourceDoc) {
        document.import(sourceDoc, viz.id);
        console.log(`Viz Id Added: ${viz.id}`);
      }
    }
    this.dashboardDocument = document;
  }
}