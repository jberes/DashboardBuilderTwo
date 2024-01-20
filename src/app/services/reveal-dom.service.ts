import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FileData } from '../models/reveal-dom/file-data';
import { VisualizationNames } from '../models/reveal-dom/visualization-names';

//const API_ENDPOINT = 'http://localhost:5111';
const API_ENDPOINT = 'https://reveal-api.azurewebsites.net/';


@Injectable({
  providedIn: 'root'
})
export class RevealDomService {
  constructor(
    private http: HttpClient
  ) { }

  public getFileDataList(): Observable<FileData[]> {
    return this.http.get<FileData[]>(`${API_ENDPOINT}/dashboardnames`);
  }

  public getVisualizationNamesList(name: string): Observable<VisualizationNames[]> {
    return this.http.get<VisualizationNames[]>(`${API_ENDPOINT}/dashboards/${name}/visualizations`);
  }
}
