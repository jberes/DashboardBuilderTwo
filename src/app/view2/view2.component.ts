import { Component, OnDestroy, OnInit, } from '@angular/core';
import { ISimpleComboSelectionChangingEventArgs } from '@infragistics/igniteui-angular';
import { Subject, switchMap, take, takeUntil } from 'rxjs';
import { VisualizationDetails } from '../models/reveal-dom/visualization-names';
import { FileData } from '../models/reveal-dom/file-data';
import { RevealDomService } from '../services/reveal-dom.service';
import { RdashDocument } from '@revealbi/dom';
import { environment } from 'src/environments/environment';
import { RevealViewOptions, SavedEventArgs } from '@revealbi/ui';

interface VizInfo {
  vizId: string;
  dashboardTitle: string;
  vizName?: string;
  dashboardName: string;
  selected?: boolean;
}

@Component({
  selector: 'app-view2',
  templateUrl: './view2.component.html',
  styleUrls: ['./view2.component.scss']
})
export class View2Component  implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();
  _singleViz?: string;
  _singleVizDocument?: string;

  private _dashboardName?: string;
  public _singleVizDocumentLoaded: boolean = false;

  public get dashboardName(): string | undefined {
    return this._dashboardName;
  }

  public set dashboardName(value: string | undefined) {
    this._dashboardName = value;
    this.revealDomVisualizationDetails$.next();
  }

  public dashboardVisualizations?: VisualizationDetails;
  public revealDomFileData: FileData[] = [];
  public revealDomVisualizationDetails: VisualizationDetails[] = [];
  public revealDomVisualizationDetails$: Subject<void> = new Subject<void>();

  public visualizationId?: string;
  public visualizationName?: string;
  public visualizationTitle?: string;

  dashboardDocument: RdashDocument | string | null = "";
  availableViz: VizInfo[] = [];
  vizCollection: VizInfo[] = [];
  selectedViz?: VizInfo;
  private initialSelectionDone = false; 

  sourceDocs: Map<string, RdashDocument> = new Map();

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
  ) { }

  ngOnInit() {   
    this.revealDomService.getVisualizationsList().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.revealDomVisualizationDetails = data;
        if (!this.initialSelectionDone && this.revealDomVisualizationDetails && this.revealDomVisualizationDetails.length > 0) {
          this.handleItemClick(this.revealDomVisualizationDetails[0]);
          this.initialSelectionDone = true; 
        }
      },
      error: (_err: any) => this.revealDomVisualizationDetails = []
    });

    this.revealDomVisualizationDetails$.pipe(takeUntil(this.destroy$)).subscribe(() => { 
      this.revealDomService.getVisualizationsList().pipe(take(1)).subscribe({
        next: (data) => {
          this.revealDomVisualizationDetails = data;
        },
        error: (_err: any) => this.revealDomVisualizationDetails = []
      });
    });


  }



  

  resetDashboard() {
    this.vizCollection = [];
    this.dashboardDocument = null;
  }

  public onSaving(e: SavedEventArgs) {
    const isInvalidName = (name: string) => {
        return name === "Generated Dashboard" || name === "New Dashboard" || name === "";
    };

    console.log("Dashboard Name: " + e.name);
    console.log("Dashboard Id: " + e.dashboardId)

    if (e.saveAs || isInvalidName(e.name)) {
      let newName: string | null;

        do {
            newName = prompt("Please enter a valid dashboard name");
            if (newName === null) {
                return; // Exit if the user cancels the prompt.
            }
        } while (isInvalidName(newName)); // Keep asking while the new name is invalid.

        this.isDuplicateName(newName).then(isDuplicate => {
            if (isDuplicate === 'true') {
                if (!window.confirm("A dashboard with name: " + newName + " already exists. Do you want to override it?")) {
                    return; // Exit if the user does not want to override.
                }
            }
            e.dashboardId = e.name = newName!;
            e.saveFinished();
        });
    } else {
        e.saveFinished(); // Save without prompting if the initial name is valid and not a duplicate.
    }
}

  private isDuplicateName(name: string): Promise<string> {
    return fetch(`${environment.BASE_URL}/isduplicatename/${name}`).then(resp => resp.text());
  }

  private prevSelected: any;

  private handleItemClick(item: VisualizationDetails): void {
    if (this.prevSelected) {
      this.prevSelected.selected = false;
    }
    item.selected = true;
    this.prevSelected = item;

    // Correctly extracting properties from the item
    const { vizId, dashboardFileName, vizTitle, vizChartType } = item;
    this.dashboardVisualizations = item;
    this.visualizationId = vizId;
    this.visualizationName = vizTitle;
    this.visualizationTitle = vizTitle; // Assuming you meant vizTitle for both name and title
    this.dashboardName = dashboardFileName;
  
    // Assuming you need to update selectedViz correctly
    if (this.dashboardName && vizId) {
      this.loadDashboardById(this.dashboardName, vizId);
      this.selectedViz = { 
        vizId: vizId, 
        dashboardTitle: this.dashboardName, 
        vizName: vizTitle, 
        dashboardName: dashboardFileName,
        selected: true
      };
      console.log("Viz Info Selected:", this.selectedViz);
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.revealDomVisualizationDetails$.complete();
  }

  public listItemClick(item: VisualizationDetails): void {
    this.handleItemClick(item);
  }

  public iconItemClick(item: VisualizationDetails): void {
    this.handleItemClick(item);
    if (this.selectedViz) {
      this.vizCollection.push(this.selectedViz);
      this.generateDashboard();
    } else {
      console.error('Selected visualization is undefined');
    }
  }

  private loadDashboardById(dashboardName: string, visualizationId: string) {
    this._singleVizDocument = dashboardName;
    this._singleViz = visualizationId;
  }

  private async generateDashboard(): Promise<void> {
    console.log("Add Generated Dashboard");
    const document = new RdashDocument("Generated Dashboard");
    for (const viz of this.vizCollection) {
      let sourceDoc = this.sourceDocs.get(viz.vizId);
      if (!sourceDoc) {
        try {
          sourceDoc = await RdashDocument.load(viz.dashboardName);
          this.sourceDocs.set(viz.dashboardName, sourceDoc);
        } catch (error) {
          console.error(`Failed to load document: ${viz.dashboardName}`, error);
          continue; 
        }
      }
      if (sourceDoc) {
        document.import(sourceDoc, viz.vizId);
        console.log(`Viz Id Added: ${viz.vizId}`);
      }
    }
    this.dashboardDocument = document;
  }
}
