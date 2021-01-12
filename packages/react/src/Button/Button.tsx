import {
  ButtonHTMLAttributes,
  ComponentType,
  DetailedHTMLProps,
  forwardRef,
  ReactNode,
} from 'react';
import { SpinnerIcon } from '@mezzanine-ui/icons';
import {
  buttonClasses as classes,
  ButtonColor,
  ButtonSize,
  ButtonVariant,
} from '@mezzanine-ui/core/button';
import { cx } from '../utils/cx';
import Icon from '../Icon';

export type ButtonComponent = 'button' | 'label' | 'a' | ComponentType<ButtonProps>;

export interface ButtonProps extends
  Omit<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, 'ref'> {
  /**
   * The color name provided by palette.
   * @default 'primary'
   */
  color?: ButtonColor;
  /**
   * Override the componoent used to render.
   * @default 'button'
   */
  component?: ButtonComponent;
  /**
   * If true, will use error color instead of color from props.
   * @default false
   */
  error?: boolean;
  /**
   * The icon placed on the end of button.
   */
  iconEnd?: ReactNode;
  /**
   * The icon placed on the start of button.
   */
  iconStart?: ReactNode;
  /**
   * If true, replace the original icon.
   * Replace iconEnd if only iconEnd provided, or iconStart.
   * @default false
   */
  loading?: boolean;
  /**
   * The size of button.
   * @default 'medium'
   */
  size?: ButtonSize;
  /**
   * The variant of button.
   * @default 'text'
   */
  variant?: ButtonVariant;
}

/**
 * The react component for `mezzanine` button.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const {
    children,
    className,
    color = 'primary',
    component = 'button',
    disabled = false,
    error = false,
    loading = false,
    iconEnd: iconEndProp,
    iconStart: iconStartProp,
    onClick,
    size = 'medium',
    type = 'button',
    variant = 'text',
    ...rest
  } = props;
  const Component = component as 'button';

  let iconStart: ReactNode = iconStartProp;
  let iconEnd: ReactNode = iconEndProp;

  if (loading) {
    const loadingIcon = <Icon icon={SpinnerIcon} spin />;

    if (iconEnd && !iconStart) {
      iconEnd = loadingIcon;
    } else {
      iconStart = loadingIcon;
    }
  }

  const asIconBtn = children == null && !!(iconStart || iconEnd);

  return (
    <Component
      ref={ref as any}
      {...rest}
      aria-disabled={disabled}
      className={cx(
        classes.host,
        classes.variant(variant),
        classes.color(color),
        classes.size(size),
        {
          [classes.error]: error,
          [classes.icon]: asIconBtn,
          [classes.loading]: loading,
        },
        className,
      )}
      disabled={disabled}
      onClick={(event) => {
        if (!disabled && !loading && onClick) {
          onClick(event);
        }
      }}
      type={type}
    >
      {iconStart}
      {children && <span className={classes.label}>{children}</span>}
      {iconEnd}
    </Component>
  );
});

export default Button;
