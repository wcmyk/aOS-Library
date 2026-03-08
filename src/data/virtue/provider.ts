import { virtueCatalog } from './catalog';
import type { VirtueApp, VirtueCatalog, VirtueCategory } from '../../types/virtue';

export function getVirtueCatalog(): VirtueCatalog {
  return virtueCatalog;
}

export function getVirtueApps(): VirtueApp[] {
  return virtueCatalog.apps;
}

export function getVirtueCategories(): VirtueCategory[] {
  return virtueCatalog.categories;
}

export function getVirtueAppById(appId: string): VirtueApp | undefined {
  return virtueCatalog.apps.find((app) => app.id === appId);
}
