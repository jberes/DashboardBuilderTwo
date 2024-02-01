import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FileData } from '../models/reveal-dom/file-data';
import { VisualizationDetails, VisualizationNames } from '../models/reveal-dom/visualization-names';
import { environment } from 'src/environments/environment';
import { RevealSdkSettings } from '@revealbi/ui';

RevealSdkSettings.serverUrl = `${environment.BASE_URL}`;

@Injectable({
  providedIn: 'root'
})
export class RevealDomService {
  constructor(
    private http: HttpClient
  ) { }

  public getFileDataList(): Observable<FileData[]> {
    return this.http.get<FileData[]>(`${environment.BASE_URL}/dashboards?mode=1`);
  }

  public getVisualizationNamesList(name: string): Observable<VisualizationNames[]> {
    if (!name) {
      return of([]);
    }
    return this.http.get<VisualizationNames[]>(`${environment.BASE_URL}/dashboards/${name}/visualizations`);
  }

  public getVisualizationsList(): Observable<VisualizationDetails[]> {
    return this.http.get<VisualizationDetails[]>(`${environment.BASE_URL}/dashboards/visualizations/all`);
  }

}
