import { components, type InputProps } from 'react-select';

/**
 * Custom input component for react-select to add data-testid attribute
 */
export const CustomInput = (props: InputProps) => {
  let testId;
  const selectAriaDescribedBy =
    'aria-describedby' in props.selectProps && typeof props.selectProps['aria-describedby'] === 'string'
      ? props.selectProps['aria-describedby']
      : undefined;
  const inputAriaDescribedBy = typeof props['aria-describedby'] === 'string' ? props['aria-describedby'] : undefined;
  const ariaDescribedBy = [inputAriaDescribedBy, selectAriaDescribedBy].filter(Boolean).join(' ') || undefined;

  if ('data-testid' in props.selectProps && props.selectProps['data-testid']) {
    testId = props.selectProps['data-testid'] + '-input';
  }

  return <components.Input {...props} data-testid={testId} aria-describedby={ariaDescribedBy} />;
};
