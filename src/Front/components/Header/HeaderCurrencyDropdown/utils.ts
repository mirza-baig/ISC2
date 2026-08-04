import {
  CSSObjectWithLabel,
  GroupBase,
  OptionProps,
  ControlProps,
  StylesConfig,
} from 'react-select';
import { customColors } from 'utils/colors';

export const selectStyles = (selectCurrencyText?: string): StylesConfig => {
  return {
    container: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      border: 'none !important',
      marginLeft: '0 !important',
    }),
    control: (
      baseStyles: CSSObjectWithLabel,
      state: ControlProps<unknown, boolean, GroupBase<unknown>>
    ) => ({
      ...baseStyles,
      backgroundColor: state.menuIsOpen ? `${customColors['isc2-green']} !important` : '#33333A',
      minHeight: '36px',
      border: 'none !important',
      borderRadius: '0',
      outline: 'none !important',
      boxShadow: 'none !important',
      cursor: 'pointer',
      paddingLeft: '10px !important',
      paddingRight: '10px !important',
    }),
    valueContainer: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      padding: '0 !important',
    }),
    menu: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      width: '200px',
      marginTop: '0',
      left: '-85px',
      borderRadius: '8px',
    }),
    menuList: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      paddingTop: '55px',
      paddingBottom: '32px',
      position: 'relative',
      ':after': {
        content: `"${selectCurrencyText}"`,
        textTransform: 'uppercase',
        position: 'absolute',
        top: '30px',
        left: '24px',
        color: '#575C61',
        fontSize: '12px',
      },
    }),
    option: (
      baseStyles: CSSObjectWithLabel,
      state: OptionProps<unknown, boolean, GroupBase<unknown>>
    ) => ({
      ...baseStyles,
      color: state.isFocused ? 'white' : 'black',
      backgroundColor: state.isFocused ? '#33333A !important' : 'none',
      paddingLeft: '25px',
      paddingRight: '25px',
      cursor: 'pointer',
      fontSize: '15px',
    }),
    input: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      color: 'white',
    }),
    singleValue: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      marginLeft: 0,
      color: 'white',
      fontSize: '12px',
    }),
    indicatorSeparator: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      display: 'none',
    }),
  };
};
