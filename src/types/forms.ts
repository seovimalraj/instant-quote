export type Field = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'hidden';
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  help?: string;
  defaultValue?: any;
  required?: boolean;
};
