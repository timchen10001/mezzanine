import {
  forwardRef,
  useRef,
  useState,
  useContext,
  ChangeEventHandler,
  FocusEventHandler,
} from 'react';
import {
  selectClasses as classes,
  SelectInputSize,
} from '@mezzanine-ui/core/select';
import { PlusIcon } from '@mezzanine-ui/icons';
import { useComposeRefs } from '../hooks/useComposeRefs';
import { FormControlContext } from '../Form';
import Menu, { MenuProps } from '../Menu';
import Empty from '../Empty';
import Option from './Option';
import Icon from '../Icon';
import { PopperProps } from '../Popper';
import { SelectControlContext } from './SelectControlContext';
import { useAutoCompleteValueControl } from '../Form/useAutoCompleteValueControl';
import { useClickAway } from '../hooks/useClickAway';
import { PickRenameMulti } from '../utils/general';
import { cx } from '../utils/cx';
import InputTriggerPopper from '../_internal/InputTriggerPopper';
import SelectTrigger, { SelectTriggerProps, SelectTriggerInputProps } from './SelectTrigger';

export interface AutoCompleteProps
  extends
  Omit<SelectTriggerProps,
  | 'active'
  | 'clearable'
  | 'forceHideSuffixActionIcon'
  | 'mode'
  | 'onClick'
  | 'onKeyDown'
  | 'onChange'
  | 'renderValue'
  | 'inputProps'
  | 'suffixActionIcon'
  | 'value'
  >,
  PickRenameMulti<Pick<MenuProps, 'itemsInView' | 'maxHeight' | 'role' | 'size'>, {
    maxHeight: 'menuMaxHeight';
    role: 'menuRole';
    size: 'menuSize';
  }>,
  PickRenameMulti<Pick<PopperProps, 'options'>, {
    options: 'popperOptions';
  }> {
  /**
   * Set to true when options can be added dynamically
   * @default false
   */
  addable?: boolean;
  /**
   * The default selection
   */
  defaultValue?: string;
  /**
   * Should the filter rules be disabled (If you need to control options filter by yourself)
   * @default false
   */
  disabledOptionsFilter?: boolean;
  /**
   * The other native props for input element.
   */
  inputProps?: Omit<
  SelectTriggerInputProps,
  'onChange'
  | 'placeholder'
  | 'role'
  | 'value'
  | `aria-${
    | 'controls'
    | 'expanded'
    | 'owns'
    }`
  >;
  /**
   * The change event handler of input element.
   */
  onChange?(text: string): any;
  /**
   * insert callback whenever insert icon is clicked
   * return `true` when insert is successfully
   */
  onInsert?(text: string): boolean;
  /**
   * The search event handler
   */
  onSearch?(input: string): any;
  /**
   * The options that mapped autocomplete options
   */
  options: string[];
  /**
   * select input placeholder
   */
  placeholder?: string;
  /**
   * Whether the selection is required.
   * @default false
   */
  required?: boolean;
  /**
   * The size of input.
   * @default 'medium'
   */
  size?: SelectInputSize;
  /**
   * The value of selection.
   * @default undefined
   */
  value?: string;
}

const MENU_ID = 'mzn-select-autocomplete-menu-id';

/**
 * The AutoComplete component for react. <br />
 * Note that if you need search for ONLY given options, not included your typings,
 * should considering using the `Select` component with `onSearch` prop.
 */
const AutoComplete = forwardRef<HTMLDivElement, AutoCompleteProps>(function Select(props, ref) {
  const {
    disabled: disabledFromFormControl,
    fullWidth: fullWidthFromFormControl,
    required: requiredFromFormControl,
    severity,
  } = useContext(FormControlContext) || {};
  const {
    addable = false,
    className,
    disabled = disabledFromFormControl || false,
    disabledOptionsFilter = false,
    defaultValue,
    error = severity === 'error' || false,
    fullWidth = fullWidthFromFormControl || false,
    inputRef,
    inputProps,
    itemsInView = 4,
    menuMaxHeight,
    menuRole = 'listbox',
    menuSize = 'medium',
    onChange: onChangeProp,
    onClear: onClearProp,
    onInsert,
    onSearch,
    options: optionsProp,
    popperOptions = {},
    placeholder = '',
    prefix,
    required = requiredFromFormControl || false,
    size = 'medium',
    value: valueProp,
  } = props;

  const [open, toggleOpen] = useState(false);
  const {
    focused,
    onFocus,
    onChange,
    onClear,
    options,
    searchText,
    setSearchText,
    setValue,
    value,
  } = useAutoCompleteValueControl({
    defaultValue,
    disabledOptionsFilter,
    onChange: onChangeProp,
    onClear: onClearProp,
    onClose: () => toggleOpen(false),
    options: optionsProp,
    value: valueProp,
  });

  /** insert feature */
  const [insertText, setInsertText] = useState<string>('');

  const nodeRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLElement>(null);
  const popperRef = useRef<HTMLDivElement>(null);
  const composedRef = useComposeRefs([ref, controlRef]);

  useClickAway(
    () => {
      if (!open || focused) return;

      return () => {
        toggleOpen((prev) => !prev);
      };
    },
    nodeRef,
    [
      focused,
      nodeRef,
      open,
      toggleOpen,
    ],
  );

  /** Trigger input props */
  const onSearchInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    /** should sync both search input and value */
    setSearchText(e.target.value);
    setValue(e.target.value);

    /** return current value to onSearch */
    onSearch?.(e.target.value);
  };

  const onSearchInputFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    e.stopPropagation();

    toggleOpen(true);
    onFocus(true);

    inputProps?.onFocus?.(e);
  };

  const onSearchInputBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    onFocus(false);

    inputProps?.onBlur?.(e);
  };

  const resolvedInputProps: SelectTriggerInputProps = {
    ...inputProps,
    'aria-controls': MENU_ID,
    'aria-expanded': open,
    'aria-owns': MENU_ID,
    onBlur: onSearchInputBlur,
    onChange: onSearchInputChange,
    onFocus: onSearchInputFocus,
    placeholder,
    role: 'combobox',
  };

  return (
    <SelectControlContext.Provider
      value={{
        onChange,
        value,
      }}
    >
      <div
        ref={nodeRef}
        className={cx(
          classes.host,
          {
            [classes.hostFullWidth]: fullWidth,
          },
        )}
      >
        <SelectTrigger
          ref={composedRef}
          active={open}
          className={className}
          clearable
          disabled={disabled}
          error={error}
          forceHideSuffixActionIcon
          fullWidth={fullWidth}
          inputRef={inputRef}
          mode="single"
          onTagClose={onChange}
          onClear={onClear}
          prefix={prefix}
          readOnly={false}
          required={required}
          inputProps={resolvedInputProps}
          size={size}
          suffixActionIcon={undefined}
          value={value}
        />
        <InputTriggerPopper
          ref={popperRef}
          anchor={controlRef}
          className={classes.popper}
          open={open}
          sameWidth
          options={popperOptions}
        >
          <Menu
            id={MENU_ID}
            aria-activedescendant={value?.id ?? ''}
            itemsInView={itemsInView}
            maxHeight={menuMaxHeight}
            role={menuRole}
            size={menuSize}
            style={{ border: 0 }}
          >
            <Option value={searchText}>
              {searchText}
            </Option>
            {options.length ? options.map((option) => (
              <Option key={option} value={option}>
                {option}
              </Option>
            )) : (
              <Empty>
                查無資料
              </Empty>
            )}
          </Menu>
          {addable ? (
            <div className={classes.autoComplete}>
              <input
                type="text"
                onChange={(e) => setInsertText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                placeholder="新增選項"
                value={insertText}
              />
              <Icon
                className={cx(
                  classes.autoCompleteIcon,
                  {
                    [classes.autoCompleteIconActive]: !!insertText,
                  },
                )}
                icon={PlusIcon}
                onClick={(e) => {
                  e.stopPropagation();

                  if (insertText) {
                    const insertSuccess = onInsert?.(insertText) ?? false;

                    if (insertSuccess) {
                      setInsertText('');
                    }
                  }
                }}
              />
            </div>
          ) : null}
        </InputTriggerPopper>
      </div>
    </SelectControlContext.Provider>
  );
});

export default AutoComplete;
