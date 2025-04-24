declare module 'react-native-modal-dropdown' {
  import { ComponentType } from 'react';
  import { StyleProp, ViewStyle, TextStyle } from 'react-native';

  export interface ModalDropdownProps {
    disabled?: boolean;
    defaultIndex?: number;
    defaultValue?: string;
    options: any[];
    animated?: boolean;
    scrollEnabled?: boolean;
    showsVerticalScrollIndicator?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    dropdownStyle?: StyleProp<ViewStyle>;
    dropdownTextStyle?: StyleProp<TextStyle>;
    dropdownTextHighlightStyle?: StyleProp<TextStyle>;
    adjustFrame?: (style: Object) => Object;
    renderRow?: (option: any, index: number, isSelected: boolean) => React.ReactNode;
    renderSeparator?: (sectionID: number, rowID: number, adjacentRowHighlighted: boolean) => React.ReactNode;
    renderButtonText?: (rowData: any) => string;
    onDropdownWillShow?: () => boolean | void;
    onDropdownWillHide?: () => boolean | void;
    onSelect?: (idx: number, value: any) => void;
  }

  const ModalDropdown: ComponentType<ModalDropdownProps>;
  export default ModalDropdown;
}
