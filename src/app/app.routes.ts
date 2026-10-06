import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { AssetListComponent } from './pages/asset-list/asset-list';
import { authGuard } from './guards/auth.guard';
import { AssetDetailComponent } from './pages/asset-detail/asset-detail';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'assets', component: AssetListComponent, canActivate: [authGuard] },
  { path: 'assets/:id', component: AssetDetailComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'assets', pathMatch: 'full' },
  { path: '**', redirectTo: 'assets' }
];
