import { memo, useLayoutEffect, useRef, type KeyboardEvent, type HTMLProps } from 'react';

import { t } from '@grafana/i18n';

import { NavigationKey } from '../types';

export interface Props
  extends Omit<HTMLProps<HTMLInputElement>, 'aria-controls' | 'aria-expanded' | 'onChange' | 'role' | 'value'> {
  'aria-controls': string;
  'aria-expanded': boolean;
  onChange: (value: string) => void;
  onNavigate: (key: NavigationKey, clearOthers: boolean) => void;
  value: string | null;
}

export const VariableInput = memo(
  ({ value, id, onNavigate, onChange, 'aria-controls': ariaControls, 'aria-expanded': ariaExpanded, ...restProps }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
      const input = inputRef.current;
      if (input) {
        input.focus();
        input.setAttribute('style', `width:${Math.max(input.width, 150)}px`);
      }
    }, []);

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (NavigationKey[event.keyCode] && event.keyCode !== NavigationKey.select) {
        const clearOthers = event.ctrlKey || event.metaKey || event.shiftKey;
        onNavigate(event.keyCode, clearOthers);
        event.preventDefault();
      }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    };

    return (
      <input
        {...restProps}
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={ariaControls}
        aria-expanded={ariaExpanded}
        aria-haspopup="listbox"
        autoComplete="off"
        className="gf-form-input"
        value={value ?? ''}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={t('variable.dropdown.placeholder', 'Enter variable value')}
      />
    );
  }
);
VariableInput.displayName = 'VariableInput';
