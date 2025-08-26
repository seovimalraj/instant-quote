export interface Overlay {
  id: string;
  type: 'thin_wall' | 'overhang' | 'hole_ratio' | 'draft' | 'tolerance';
  message: string;
  severity: 'info' | 'warning' | 'error';
}
