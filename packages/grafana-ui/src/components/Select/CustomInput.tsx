import { components, type InputProps } from 'react-select';

/**
 * Custom input component for react-select to add data-testid attribute
 */
export const CustomInput = (props: InputProps) => {
  let testId;
  const ariaDescribedBy =
    'aria-describedby' in props.selectProps && typeof props.selectProps['aria-describedby'] === 'string'
      ? props.selectProps['aria-describedby']
      : undefined;

  if ('data-testid' in props.selectProps && props.selectProps['data-testid']) {
    testId = props.selectProps['data-testid'] + '-input';
  }

  return <components.Input {...props} data-testid={testId} aria-describedby={ariaDescribedBy} />;
};
