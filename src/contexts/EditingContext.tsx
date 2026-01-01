import { createContext, useContext, useState, ReactNode } from "react";

interface EditingContextType {
  isEditing: boolean;
  toggleEditing: () => void;
  setEditing: (value: boolean) => void;
}

const EditingContext = createContext<EditingContextType | undefined>(undefined);

export function EditingProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEditing = () => {
    setIsEditing((prev) => !prev);
  };

  const setEditing = (value: boolean) => {
    setIsEditing(value);
  };

  return (
    <EditingContext.Provider value={{ isEditing, toggleEditing, setEditing }}>
      {children}
    </EditingContext.Provider>
  );
}

export function useEditing() {
  const context = useContext(EditingContext);
  if (context === undefined) {
    throw new Error("useEditing must be used within an EditingProvider");
  }
  return context;
}

