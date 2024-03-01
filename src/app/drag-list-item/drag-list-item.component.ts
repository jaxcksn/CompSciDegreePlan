import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Requirement } from '../drag-drop-list/drag-drop-list.component';

@Component({
  selector: 'drag-item',
  standalone: true,
  imports: [],
  templateUrl: './drag-list-item.component.html',
  styleUrl: './drag-list-item.component.scss',
})
export class DragListItemComponent {
  @Input() origin: string = '?';
  @Input() item: Requirement = { label: '', isChecked: false };
  @Output() dragStartEvent = new EventEmitter<[DragEvent, Requirement]>();

  onDragStart(event: DragEvent) {
    this.dragStartEvent.emit([event, this.item]);
  }
}
