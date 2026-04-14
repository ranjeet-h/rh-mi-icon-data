import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { IconContextDefaults } from './types.js';

const IconContext = createContext<IconContextDefaults>({});

export interface IconProviderProps {
  defaults?: IconContextDefaults;
  children: ReactNode;
}

export const IconProvider = ({ defaults = {}, children }: IconProviderProps) => {
  return <IconContext.Provider value={defaults}>{children}</IconContext.Provider>;
};

export const useIconDefaults = (): IconContextDefaults => {
  return useContext(IconContext);
};
