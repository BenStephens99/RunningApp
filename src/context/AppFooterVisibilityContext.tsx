import {
  createContext,
  useContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type AppFooterVisibilityContextValue = {
  isFooterHidden: boolean;
  setFooterHidden: Dispatch<SetStateAction<boolean>>;
};

const AppFooterVisibilityContext =
  createContext<AppFooterVisibilityContextValue | null>(null);

export function AppFooterVisibilityProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AppFooterVisibilityContextValue;
}) {
  return (
    <AppFooterVisibilityContext.Provider value={value}>
      {children}
    </AppFooterVisibilityContext.Provider>
  );
}

export function useAppFooterVisibility() {
  const context = useContext(AppFooterVisibilityContext);

  if (!context) {
    throw new Error(
      "useAppFooterVisibility must be used within AppFooterVisibilityProvider",
    );
  }

  return context;
}
