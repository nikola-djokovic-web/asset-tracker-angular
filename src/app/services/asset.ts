import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { ApiResponse, Asset, Assignment, AssetUser, Category } from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private apiUrl = `${environment.apiUrl}/assets`;

  constructor(private http: HttpClient) {}

  getAssets(params?: Record<string, string | number | undefined>): Observable<ApiResponse<Asset[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<ApiResponse<Asset[]>>(this.apiUrl, { params: httpParams });
  }

  deleteAsset(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAsset(id: string | number): Observable<{ data: Asset } | Asset> {
    return this.http.get<{ data: Asset } | Asset>(`${this.apiUrl}/${id}`);
  }

  createAsset(payload: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.apiUrl}`, payload);
  }

  updateAsset(id: string | number, payload: Record<string, unknown>): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${environment.apiUrl}/categories`, {
      params: { per_page: 100 }
    });
  }

  getUsers(): Observable<ApiResponse<AssetUser[]>> {
    return this.http.get<ApiResponse<AssetUser[]>>(`${environment.apiUrl}/users`, {
      params: { per_page: 100 }
    });
  }

  checkoutAsset(id: string | number, payload: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/${id}/checkout`, payload);
  }

  checkinAsset(id: string | number, payload: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/${id}/checkin`, payload);
  }

  getAssignmentHistory(id: string | number): Observable<ApiResponse<Assignment[]>> {
    return this.http.get<ApiResponse<Assignment[]>>(`${this.apiUrl}/${id}/assignments`);
  }
}
