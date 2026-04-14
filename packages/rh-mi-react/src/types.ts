import type { SVGProps } from 'react';

export type IconStyle = 'rounded' | 'outlined' | 'sharp';
export type FillVariant = 0 | 1;

export interface IconContextDefaults {
  iconStyle?: IconStyle;
  fill?: FillVariant;
  size?: number | string;
  color?: string;
  weight?: number;
  grade?: number;
  opticalSize?: number;
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'style' | 'color' | 'fill'> {
  iconStyle?: IconStyle;
  fill?: FillVariant;
  size?: number | string;
  color?: string;
  weight?: number;
  grade?: number;
  opticalSize?: number;
  style?: SVGProps<SVGSVGElement>['style'];
}

export interface SvgIconProps extends IconProps {
  pathData: string;
  iconName: string;
}
