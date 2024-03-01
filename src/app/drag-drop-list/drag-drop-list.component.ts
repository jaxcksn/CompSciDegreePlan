import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DragListItemComponent } from '../drag-list-item/drag-list-item.component';

export type Requirement = {
  label: string;
  isChecked: boolean;
};

@Component({
  selector: 'drag-drop-list',
  standalone: true,
  imports: [CommonModule, DragListItemComponent],
  templateUrl: './drag-drop-list.component.html',
  styleUrl: './drag-drop-list.component.scss',
})
export class DragDropListComponent {
  @Input() title: string = 'list';
  @Input() items: Requirement[] = [];

  @Output() itemDrop = new EventEmitter<{
    to: string;
  }>();
  @Output() startDrag = new EventEmitter<{
    r: Requirement;
    from: string;
  }>();

  draggingItem: Requirement | undefined;
  //Used to prevent flickering and other weirdness.
  dragOverCounter = 0;
  isDraggedOver: boolean = false;
  dropOrigin = '';

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDragEnter(event: DragEvent) {
    this.dragOverCounter++; // Increment on enter
    this.isDraggedOver = true;
  }

  onDragLeave(event: DragEvent) {
    this.dragOverCounter--; // Decrement on leave
    if (this.dragOverCounter === 0) {
      this.isDraggedOver = false;
    }
  }

  onDrop(event: DragEvent, on: string) {
    event.preventDefault();
    this.dragOverCounter = 0; // Reset counter on drop
    this.isDraggedOver = false;
    this.itemDrop.emit({ to: on });
  }

  onDragStart(data: [DragEvent, Requirement]) {
    this.dropOrigin = this.title;
    this.startDrag.emit({
      r: data[1],
      from: this.title,
    });
  }

  onDragEnd() {
    this.isDraggedOver = false;
  }
}
