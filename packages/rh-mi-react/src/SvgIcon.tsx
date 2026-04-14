import { useIconDefaults } from './IconContext.js';
import type { CSSProperties } from 'react';
import type { SvgIconProps } from './types.js';

const toCssSize = (value: number | string | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === 'number' ? `${value}px` : value;
};

export const SvgIcon = ({
  pathData,
  iconName,
  iconStyle,
  fill,
  size,
  color,
  weight,
  grade,
  opticalSize,
  style,
  'aria-label': ariaLabel,
  ...rest
}: SvgIconProps) => {
  const defaults = useIconDefaults();
  const resolvedIconStyle = iconStyle ?? defaults.iconStyle ?? 'rounded';
  const resolvedFill = fill ?? defaults.fill ?? 0;
  const resolvedWeight = weight ?? defaults.weight;
  const resolvedGrade = grade ?? defaults.grade;
  const resolvedOpticalSize = opticalSize ?? defaults.opticalSize;
  const resolvedSize = size ?? defaults.size;
  const resolvedColor = color ?? defaults.color;

  const svgStyle: CSSProperties = {
    fontSize: toCssSize(resolvedSize),
    color: resolvedColor,
    ...style,
  };

  const isDecorative = !ariaLabel;

  return (
    <svg
      {...rest}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={isDecorative}
      focusable="false"
      aria-label={ariaLabel}
      style={svgStyle}
      data-icon-name={iconName}
      data-icon-style={resolvedIconStyle}
      data-icon-fill={resolvedFill}
      data-icon-weight={resolvedWeight}
      data-icon-grade={resolvedGrade}
      data-icon-optical-size={resolvedOpticalSize}
    >
      <path d={pathData} />
    </svg>
  );
};
