import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import {
  DragDropListComponent,
  Requirement,
} from './drag-drop-list/drag-drop-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, DragDropListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  semesters: {
    [key: string]: Requirement[];
  } = {
    fall1: [],
    spring1: [],
  };

  constructor() {}

  draggableFrom = '';
  draggableItem: Requirement | undefined;
  title = 'deg-plan';

  onListDrop(data: { to: string }) {
    if (data.to == this.draggableFrom) {
      return;
    }

    const index = this.semesters[this.draggableFrom].findIndex((v) => {
      if (this.draggableItem) {
        return v.label === this.draggableItem.label;
      } else {
        return false;
      }
    });

    //Remove from Array, and add to new array.
    if (index != -1) {
      this.semesters[this.draggableFrom].splice(index, 1);
      this.semesters[data.to].push(
        this.draggableItem || { label: 'd', isChecked: false }
      );
    }
  }

  onDragStart(data: { r: Requirement; from: string }) {
    this.draggableFrom = data.from;
    this.draggableItem = data.r;
  }
}
