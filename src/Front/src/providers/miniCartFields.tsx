/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useContext } from 'react';

import { MiniCartFields, MiniCartLabels } from 'types/index';
import { parseFieldsFromURLString } from 'utils/index';

type MiniCartFieldsContextProps = {
  fields: MiniCartFields;
  labels: MiniCartLabels;
};

const MiniCartFieldsContext = createContext<MiniCartFieldsContextProps>({
  fields: {} as MiniCartFields,
  labels: {} as MiniCartLabels,
});

type MiniCartFieldsProviderProps = {
  fields: MiniCartFields;
  children: React.ReactNode;
};

const MiniCartFieldsProvider: React.FC<MiniCartFieldsProviderProps> = ({ fields, children }) => {
  return (
    <MiniCartFieldsContext.Provider
      value={{
        fields,
        labels: parseFieldsFromURLString<MiniCartLabels>(fields.labelsAndOtherProperties),
      }}
    >
      {children}
    </MiniCartFieldsContext.Provider>
  );
};

const useMiniCartFields = () => useContext(MiniCartFieldsContext);

export { MiniCartFieldsProvider, useMiniCartFields };
