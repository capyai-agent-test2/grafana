import { css, cx } from '@emotion/css';
import { type CSSProperties } from 'react';
import * as React from 'react';

import { type GrafanaTheme2, fieldColorModeRegistry } from '@grafana/data';
import { type LineStyle } from '@grafana/schema';

import { useTheme2, useStyles2 } from '../../themes/ThemeContext';

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  gradient?: string;
  lineStyle?: LineStyle;
  pointShape?: 'circle' | 'square';
  showLine?: boolean;
  showPoints?: boolean;
}

const SeriesIconBase = React.forwardRef<HTMLDivElement, Props>(
  ({ color, className, gradient, lineStyle, pointShape, showLine, showPoints, ...restProps }, ref) => {
    const theme = useTheme2();
    const styles = useStyles2(getStyles);

    let cssColor: string;

    if (gradient) {
      const colors = fieldColorModeRegistry.get(gradient).getColors?.(theme);
      if (colors?.length) {
        cssColor = `linear-gradient(90deg, ${colors.join(', ')})`;
      } else {
        // Not sure what to default to, this will return gray, this should not happen though.
        cssColor = theme.visualization.getColorByName('');
      }
    } else {
      cssColor = color!;
    }

    let customStyle: CSSProperties;
    const renderLine = showLine ?? true;
    const renderPoint = showPoints ?? false;

    if (!renderLine && renderPoint) {
      customStyle = {
        background: 'transparent',
      };
    } else if (lineStyle?.fill === 'dot' && !gradient) {
      // make a circle bg image and repeat it
      customStyle = {
        backgroundImage: `radial-gradient(circle at 2px 2px, ${color} 2px, transparent 0)`,
        backgroundSize: '4px 4px',
        backgroundRepeat: 'space',
      };
    } else if (lineStyle?.fill === 'dash' && !gradient) {
      // make a rectangle bg image and repeat it
      customStyle = {
        backgroundImage: `linear-gradient(to right, ${color} 100%, transparent 0%)`,
        backgroundSize: '6px 4px',
        backgroundRepeat: 'space',
      };
    } else {
      customStyle = {
        background: cssColor,
        borderRadius: theme.shape.radius.pill,
      };
    }

    return (
      <div
        data-testid="series-icon"
        ref={ref}
        className={cx(className, styles.forcedColors, styles.container)}
        style={customStyle}
        {...restProps}
      >
        {renderPoint && (
          <span
            data-testid="series-icon-point"
            className={cx(
              styles.point,
              pointShape === 'square' ? styles.squarePoint : styles.circlePoint,
              renderLine && styles.pointWithLine
            )}
            style={{ background: color }}
          />
        )}
      </div>
    );
  }
);

SeriesIconBase.displayName = 'SeriesIconBase';

export const SeriesIcon = React.memo(SeriesIconBase);

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    position: 'relative',
    display: 'inline-block',
    width: '14px',
    height: '8px',
    marginTop: '1px',
  }),
  forcedColors: css({
    '@media (forced-colors: active)': {
      forcedColorAdjust: 'none',
    },
  }),
  point: css({
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '8px',
    height: '8px',
    transform: 'translate(-50%, -50%)',
  }),
  pointWithLine: css({
    boxShadow: `0 0 0 1px ${theme.colors.background.primary}`,
  }),
  circlePoint: css({
    borderRadius: theme.shape.radius.circle,
  }),
  squarePoint: css({
    borderRadius: theme.shape.radius.default,
  }),
});

SeriesIcon.displayName = 'SeriesIcon';
