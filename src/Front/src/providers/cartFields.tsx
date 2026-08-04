/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useContext } from 'react';

import { CartFields, CartLabels, ErrorLabels } from 'types/index';
import { parseFieldsFromURLString } from 'utils/index';

type CartFieldsContextProps = {
  fields: CartFields;
  labels: CartLabels;
  errorLabels: ErrorLabels;
};

const CartFieldsContext = createContext<CartFieldsContextProps>({
  fields: {} as CartFields,
  labels: {} as CartLabels,
  errorLabels: {} as ErrorLabels,
});

type CartFieldsProviderProps = {
  fields: CartFields;
  children: React.ReactNode;
};

const CartFieldsProvider: React.FC<CartFieldsProviderProps> = ({ fields, children }) => {
  return (
    <CartFieldsContext.Provider
      value={{
        fields,
        labels: parseFieldsFromURLString<CartLabels>(fields.labelsNoticesAndTooltips),
        errorLabels: parseFieldsFromURLString<ErrorLabels>(fields.errorLabels),
      }}
    >
      {children}
    </CartFieldsContext.Provider>
  );
};

const useCartFields = () => useContext(CartFieldsContext);

export { CartFieldsProvider, useCartFields };
