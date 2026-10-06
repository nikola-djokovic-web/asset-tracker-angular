import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Asset, Assignment } from '../../models/asset.model';
import { AssetService } from '../../services/asset';
import { AssetModalComponent } from '../asset-list/asset-modal';
import { AssignmentModalComponent } from '../asset-list/assignment-modal';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, AssetModalComponent, AssignmentModalComponent],
  templateUrl: './asset-detail.html'
})
export class AssetDetailComponent implements OnInit {
  asset = signal<Asset | null>(null);
  history = signal<Assignment[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  isEditOpen = signal(false);
  assignmentMode = signal<'checkout' | 'checkin' | null>(null);

  constructor(private route: ActivatedRoute, private router: Router, private assetService: AssetService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.errorMessage.set('Nije naveden identifikator opreme.'); this.isLoading.set(false); return; }
    this.isLoading.set(true);
    this.assetService.getAsset(id).subscribe({
      next: response => {
        const asset = 'data' in response ? response.data : response;
        this.asset.set(asset);
        this.isLoading.set(false);
        this.assetService.getAssignmentHistory(id).subscribe({ next: result => this.history.set(result.data ?? []) });
      },
      error: error => { this.errorMessage.set(error.error?.message ?? 'Oprema nije pronađena ili nemate pristup.'); this.isLoading.set(false); }
    });
  }

  statusClasses(status: Asset['status']): string {
    const styles: Record<Asset['status'], string> = {
      active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
      assigned: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
      maintenance: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
      retired: 'border-slate-600/40 bg-slate-700/30 text-slate-400',
      inactive: 'border-slate-600/40 bg-slate-700/30 text-slate-400'
    };
    return styles[status] ?? styles.inactive;
  }

  statusLabel(status: Asset['status']): string {
    return ({ active: 'Aktivna', assigned: 'Zadužena', maintenance: 'Servis', retired: 'Otpisana', inactive: 'Neaktivna' })[status];
  }

  saved(): void {
    this.isEditOpen.set(false);
    this.assignmentMode.set(null);
    this.load();
  }

  goBack(): void { this.router.navigate(['/assets']); }
}
