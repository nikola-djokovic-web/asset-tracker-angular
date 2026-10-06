import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../services/asset';
import { AuthService } from '../../services/auth';
import { Asset } from '../../models/asset.model';
import { Router } from '@angular/router';
import { AssetModalComponent } from './asset-modal';
import { AssignmentModalComponent } from './assignment-modal';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AssetModalComponent, AssignmentModalComponent],
  templateUrl: './asset-list.html',
  styleUrl: './asset-list.css'
})
export class AssetListComponent implements OnInit {
  assets = signal<Asset[]>([]);
  totalAssets = signal(0);
  currentPage = signal(1);
  lastPage = signal(1);
  isLoading = signal<boolean>(true);
  searchQuery = '';
  activeCount = computed(() => this.assets().filter(asset => asset.status === 'active').length);
  assignedCount = computed(() => this.assets().filter(asset => asset.status === 'assigned').length);
  editingAsset = signal<Asset | null>(null);
  isAssetModalOpen = signal(false);
  assignmentAsset = signal<Asset | null>(null);
  assignmentMode = signal<'checkout' | 'checkin'>('checkout');
  assetPendingDelete = signal<Asset | null>(null);
  isDeleting = signal(false);
  deleteError = signal('');

  constructor(
    private assetService: AssetService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAssets();
  }

  loadAssets(page = 1): void {
    this.isLoading.set(true);
    this.assetService.getAssets({ search: this.searchQuery, page, per_page: 15 }).subscribe({
      next: (res:any) => {
        this.assets.set(res.data);
        this.totalAssets.set(res.meta?.total ?? res.data.length);
        this.currentPage.set(res.meta?.current_page ?? page);
        this.lastPage.set(res.meta?.last_page ?? 1);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSearch(): void {
    this.loadAssets();
  }

  openCreate(): void {
    this.editingAsset.set(null);
    this.isAssetModalOpen.set(true);
  }

  openEdit(asset: Asset): void {
    this.editingAsset.set(asset);
    this.isAssetModalOpen.set(true);
  }

  openAssignment(asset: Asset, mode: 'checkout' | 'checkin'): void {
    this.assignmentAsset.set(asset);
    this.assignmentMode.set(mode);
  }

  viewAsset(asset: Asset): void {
    this.router.navigate(['/assets', asset.id]);
  }

  handleSaved(): void {
    this.isAssetModalOpen.set(false);
    this.assignmentAsset.set(null);
    this.loadAssets(this.currentPage());
  }

  statusLabel(status: Asset['status']): string {
    const labels: Record<Asset['status'], string> = {
      active: 'Aktivna',
      assigned: 'Zadužena',
      maintenance: 'Servis',
      retired: 'Otpisana',
      inactive: 'Neaktivna'
    };
    return labels[status] ?? status;
  }

  statusClasses(status: Asset['status']): string {
    const classes: Record<Asset['status'], string> = {
      active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
      assigned: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
      maintenance: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
      retired: 'border-slate-600/40 bg-slate-700/30 text-slate-400',
      inactive: 'border-slate-600/40 bg-slate-700/30 text-slate-400'
    };
    return classes[status] ?? 'border-slate-600/40 bg-slate-700/30 text-slate-400';
  }

  deleteAsset(asset: Asset): void {
    this.deleteError.set('');
    this.assetPendingDelete.set(asset);
  }

  confirmDelete(): void {
    const asset = this.assetPendingDelete();
    if (!asset) return;
    this.isDeleting.set(true);
    this.assetService.deleteAsset(asset.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.assetPendingDelete.set(null);
        const targetPage = this.assets().length === 1 && this.currentPage() > 1
          ? this.currentPage() - 1
          : this.currentPage();
        this.loadAssets(targetPage);
      },
      error: error => {
        this.isDeleting.set(false);
        this.deleteError.set(error.error?.message ?? 'Brisanje nije uspelo. Pokušajte ponovo.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
