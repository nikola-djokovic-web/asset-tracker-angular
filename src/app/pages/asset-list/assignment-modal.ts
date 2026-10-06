import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Asset, AssetUser } from '../../models/asset.model';
import { AssetService } from '../../services/asset';

@Component({
  selector: 'app-assignment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assignment-modal.html'
})
export class AssignmentModalComponent implements OnInit {
  @Input({ required: true }) asset!: Asset;
  @Input() mode: 'checkout' | 'checkin' = 'checkout';
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  users = signal<AssetUser[]>([]);
  isLoadingUsers = signal(false);
  isSaving = signal(false);
  errorMessage = signal('');
  userId = '';
  condition = 'good';
  notes = '';

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    if (this.mode === 'checkout') {
      this.isLoadingUsers.set(true);
      this.assetService.getUsers().subscribe({
        next: response => { this.users.set(response.data ?? []); this.isLoadingUsers.set(false); },
        error: error => { this.errorMessage.set(error.error?.message ?? 'Korisnici nisu mogli da se učitaju.'); this.isLoadingUsers.set(false); }
      });
    }
  }

  submit(): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    const payload = this.mode === 'checkout'
      ? { assigned_to_user_id: this.userId, condition_on_checkout: this.condition, notes: this.notes || undefined }
      : { condition_on_checkin: this.condition, notes: this.notes || undefined };
    const request = this.mode === 'checkout'
      ? this.assetService.checkoutAsset(this.asset.id, payload)
      : this.assetService.checkinAsset(this.asset.id, payload);
    request.subscribe({
      next: () => { this.isSaving.set(false); this.saved.emit(); },
      error: (error: HttpErrorResponse) => { this.isSaving.set(false); this.errorMessage.set(error.error?.message ?? 'Akcija nije uspela. Proverite podatke i pokušajte ponovo.'); }
    });
  }
}
