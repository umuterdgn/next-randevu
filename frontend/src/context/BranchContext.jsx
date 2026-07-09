import { createContext, useContext, useState } from "react";

const BranchContext = createContext();

export const useBranchContext = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranchContext must be used within a BranchProvider");
  }
  return context;
};

export const BranchProvider = ({ children }) => {
  const [selectedBranch, setSelectedBranch] = useState(null);

  const value = {
    selectedBranch,
    setSelectedBranch,
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};
