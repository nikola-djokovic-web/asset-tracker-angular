import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetListComponent } from './asset-list';

describe('AssetListComponent', () => {
  let component: AssetListComponent;
  let fixture: ComponentFixture<AssetListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
