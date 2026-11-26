import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, TToastTipo } from '../../services/toast.service';

const ICONES: Record<TToastTipo, string> = {
  success: 'pi pi-check-circle',
  error: 'pi pi-times-circle',
  info: 'pi pi-info-circle',
  warn: 'pi pi-exclamation-triangle',
};

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  protected readonly toast = inject(ToastService);
  protected readonly icones = ICONES;
}
