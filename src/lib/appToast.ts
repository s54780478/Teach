export type AppToastDetail = { message: string; variant?: 'info' | 'success' | 'error' };

export const APP_TOAST_EVENT = 'idaltu-toast';

export function showAppToast(
  message: string,
  variant: AppToastDetail['variant'] = 'info'
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AppToastDetail>(APP_TOAST_EVENT, {
      detail: { message, variant },
    })
  );
}
