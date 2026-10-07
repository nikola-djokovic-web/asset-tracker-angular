import { Injectable, NgZone } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { Observable, Subject } from 'rxjs';
import { environment } from '../environment';

interface AssetChangedEvent {
  asset_id: string;
  action: 'created' | 'updated' | 'deleted' | 'checked_out' | 'checked_in' | string;
}

(window as Window & { Pusher?: typeof Pusher }).Pusher = Pusher;

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private echo: Echo<'reverb'> | null = null;
  private channelName: string | null = null;
  private readonly assetChangedSubject = new Subject<AssetChangedEvent>();

  constructor(private readonly zone: NgZone) {}

  connectToTenant(tenantId: number | string): void {
    const channel = `tenants.${tenantId}.assets`;
    if (this.channelName === channel && this.echo) return;

    this.disconnect();
    this.echo = this.createEcho();
    this.channelName = channel;
    this.echo.connector.pusher.connection.bind('state_change', (state: { current: string; previous: string }) => {
      console.info(`[Reverb] WebSocket ${state.previous} → ${state.current}`);
    });
    console.info(`[Reverb] Pretplaćujem se na privatni kanal: ${channel}`);
    this.echo.private(channel)
      .subscribed(() => console.info(`[Reverb] Privatni kanal je autorizovan: ${channel}`))
      .error((error: unknown) => console.error(`[Reverb] Pretplata na privatni kanal ${channel} nije uspela.`, error))
      .listen('.asset.changed', (event: AssetChangedEvent) => {
        this.zone.run(() => {
          console.info('[Reverb] Primljena promena imovine:', event.action, event.asset_id);
          this.assetChangedSubject.next(event);
        });
    });
  }

  onAssetChanged(): Observable<AssetChangedEvent> {
    return this.assetChangedSubject.asObservable();
  }

  disconnect(): void {
    if (this.echo) {
      if (this.channelName) this.echo.leave(this.channelName);
      this.echo.disconnect();
    }
    this.channelName = null;
    this.echo = null;
  }

  private createEcho(): Echo<'reverb'> {
    const backendUrl = new URL(environment.apiUrl);
    const backendOrigin = backendUrl.origin;

    return new Echo({
      broadcaster: 'reverb',
      key: environment.reverbAppKey,
      wsHost: environment.reverbHost,
      wsPort: environment.reverbPort,
      wssPort: environment.reverbPort,
      forceTLS: environment.reverbScheme === 'https',
      enabledTransports: ['ws', 'wss'],
      channelAuthorization: {
        transport: 'ajax',
        endpoint: `${backendOrigin}/broadcasting/auth`,
        customHandler: ({ socketId, channelName }, callback) => {
          const xsrfToken = this.readCookie('XSRF-TOKEN');
          const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          };
          if (xsrfToken) headers['X-XSRF-TOKEN'] = xsrfToken;

          fetch(`${backendOrigin}/broadcasting/auth`, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: new URLSearchParams({ socket_id: socketId, channel_name: channelName })
          }).then(async response => {
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data?.message ?? `Kanal nije autorizovan (${response.status}).`);
            }
            return data;
          }).then(data => callback(null, data))
            .catch(error => {
              const authError = error instanceof Error ? error : new Error('Greška pri autorizaciji kanala.');
              console.error('[Reverb] Autorizacija privatnog kanala nije uspela:', authError.message);
              callback(authError, null);
            });
        }
      }
    });
  }

  private readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const entry = document.cookie.split('; ').find(cookie => cookie.startsWith(`${name}=`));
    return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
  }
}
