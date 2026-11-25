import React from 'react';

export interface BdtIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Bangladeshi Taka (BDT) Icon Component (৳)
 * Designed as a drop-in replacement for Lucide icon components (such as DollarSign).
 */
export const BdtIcon: React.FC<BdtIconProps> = ({
  size = 16,
  className = '',
  style,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style
      }}
      aria-hidden="true"
      {...props}
    >
      <text
        x="50%"
        y="52%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="19"
        fontWeight="800"
        fontFamily="'Segoe UI', Roboto, 'Noto Sans Bengali', Arial, sans-serif"
      >
        ৳
      </text>
    </svg>
  );
};

export default BdtIcon;
