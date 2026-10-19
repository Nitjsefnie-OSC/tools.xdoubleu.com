// Full-page navigations, behind functions so tests can stub them (jsdom's
// window.location can't be redefined).

/** Leaves the app for `url` (e.g. an OAuth client's redirect_uri). */
export function leaveTo(url: string): void {
  window.location.assign(url)
}

export function reloadPage(): void {
  window.location.reload()
}
