import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Asset, Category } from '../../models/asset.model';
import { AssetService } from '../../services/asset';

@Component({
  selector: 'app-asset-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asset-modal.html'
})
export class AssetModalComponent implements OnInit {
  @Input() asset: Asset | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  categories = signal<Category[]>([]);
  isLoadingCategories = signal(true);
  isSaving = signal(false);
  errorMessage = signal('');
  fieldErrors = signal<Record<string, string>>({});
  type: 'hardware' | 'license' = 'hardware';
  form = {
    name: '', asset_tag: '', category_id: '', status: 'active' as Asset['status'],
    serial_number: '', license_key: '', seats: 1, expires_at: ''
  };

  constructor(private assetService: AssetService) {}

  get isEditMode(): boolean { return !!this.asset; }

  ngOnInit(): void {
    if (this.asset) {
      const details = this.asset.details;
      this.type = details?.license_key !== undefined ? 'license' : 'hardware';
      this.form = {
        name: this.asset.name,
        asset_tag: this.asset.asset_tag,
        category_id: String(this.asset.category_id ?? this.asset.category?.id ?? ''),
        status: this.asset.status,
        serial_number: details?.serial_number ?? '',
        license_key: details?.license_key ?? '',
        seats: details?.seats ?? 1,
        expires_at: details?.expires_at?.slice(0, 10) ?? ''
      };
    }
    this.assetService.getCategories().subscribe({
      next: response => {
        const categories = response.data ?? [];
        this.categories.set(categories);
        if (!this.form.category_id && categories.length) this.form.category_id = String(categories[0].id);
        this.isLoadingCategories.set(false);
      },
      error: () => {
        this.errorMessage.set('Kategorije nisu mogle da se učitaju. Pokušajte ponovo.');
        this.isLoadingCategories.set(false);
      }
    });
  }

  submit(): void {
    this.errorMessage.set('');
    this.fieldErrors.set({});
    this.isSaving.set(true);
    const payload: Record<string, unknown> = {
      name: this.form.name.trim(),
      asset_tag: this.form.asset_tag.trim(),
      category_id: this.form.category_id,
      status: this.form.status,
      type: this.type,
      details: this.type === 'hardware'
        ? { serial_number: this.form.serial_number || null }
        : {
            license_key: this.form.license_key || null,
            seats: Number(this.form.seats),
            expires_at: this.form.expires_at || null
          }
    };
    const request = this.asset
      ? this.assetService.updateAsset(this.asset.id, payload)
      : this.assetService.createAsset(payload);
    request.subscribe({
      next: () => { this.isSaving.set(false); this.saved.emit(); },
      error: (error: HttpErrorResponse) => {
        this.isSaving.set(false);
        if (error.status === 422 && error.error?.errors) {
          const errors = error.error.errors as Record<string, string[]>;
          this.fieldErrors.set(Object.fromEntries(Object.entries(errors).map(([key, messages]) => [key, messages[0]])));
          this.errorMessage.set('Proverite označena polja i pokušajte ponovo.');
        } else {
          this.errorMessage.set(error.error?.message ?? 'Čuvanje opreme nije uspelo.');
        }
      }
    });
  }
}
