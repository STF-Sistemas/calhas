import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal(false);
  activeColor = signal('orange');

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    const savedColor = localStorage.getItem('app-color') || 'orange';
    const savedTheme = localStorage.getItem('app-theme') === 'dark';

    this.setColor(savedColor);

    if (localStorage.getItem('app-theme')) {
      this.setDarkMode(savedTheme);
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.setDarkMode(mediaQuery.matches);
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('app-theme')) {
          this.setDarkMode(e.matches);
        }
      });
    }
  }

  /** Re-aplica o tema salvo ao documentElement. Chamar no OnInit de cada componente raiz. */
  applyTheme() {
    const savedColor = localStorage.getItem('app-color') || 'orange';
    const savedTheme = localStorage.getItem('app-theme') === 'dark';

    // Limpa todas as classes de tema e reaplicar
    document.documentElement.classList.forEach(cls => {
      if (cls.startsWith('theme-')) {
        document.documentElement.classList.remove(cls);
      }
    });
    document.documentElement.classList.add(`theme-${savedColor}`);

    if (savedTheme) {
      document.documentElement.classList.add('app-dark');
    } else {
      document.documentElement.classList.remove('app-dark');
    }

    this.activeColor.set(savedColor);
    this.isDarkMode.set(savedTheme);
  }

  setDarkMode(isDark: boolean) {
    this.isDarkMode.set(isDark);
    localStorage.setItem('app-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('app-dark');
    } else {
      document.documentElement.classList.remove('app-dark');
    }
  }

  setColor(color: string) {
    document.documentElement.classList.remove(`theme-${this.activeColor()}`);
    this.activeColor.set(color);
    localStorage.setItem('app-color', color);
    document.documentElement.classList.add(`theme-${color}`);
    this.updateFavicon(color);
  }

  private updateFavicon(color: string) {
    const colorMap: Record<string, string> = {
      orange: '#f97316',
      blue: '#3b82f6',
      emerald: '#10b981',
      indigo: '#6366f1'
    };
    const fill = colorMap[color] || '#f97316';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none'><rect width='32' height='32' rx='7' fill='${fill}'/><path d='M5 12 L5 18 Q5 27 16 27 Q27 27 27 18 L27 12' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' fill='none'/><line x1='5' y1='12' x2='5' y2='10' stroke='white' stroke-width='3' stroke-linecap='round'/><line x1='27' y1='12' x2='27' y2='10' stroke='white' stroke-width='3' stroke-linecap='round'/><circle cx='12' cy='5.5' r='1.3' fill='white' opacity='0.75'/><circle cx='16' cy='4' r='1.4' fill='white'/><circle cx='20' cy='5.5' r='1.3' fill='white' opacity='0.75'/></svg>`;
    const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]').forEach(link => {
      link.href = dataUri;
    });
  }

  toggleTheme() {
    this.setDarkMode(!this.isDarkMode());
  }
}
