import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-dialog-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule
  ],
  templateUrl: './dialog-wrapper.component.html',
  styleUrls: ['./dialog-wrapper.component.scss']
})
export class DialogWrapperComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() isLoadingData = false;
  @Input() isSaving = false;
  @Input() hasFooter = true;
  @Input() width = '500px';
  @Input() height = '';
  @Input() maxHeight = '95vh';
  @Input() position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright' = 'center';
  @Input() saveLabel = 'Salvar';
  @Input() cancelLabel = 'Cancelar';
  @Input() saveDisabled = false;
  @Input() fullscreenMobile = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() show = new EventEmitter<void>();

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancel.emit();
  }
}
