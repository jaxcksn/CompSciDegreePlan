import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DragListItemComponent } from './drag-list-item.component';

describe('DragListItemComponent', () => {
  let component: DragListItemComponent;
  let fixture: ComponentFixture<DragListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DragListItemComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DragListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
