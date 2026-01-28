import { useEffect, useMemo, useState } from "react";
import {
  getWorkTypeDictionary,
  getWorkTypeOptions,
  startWorkTypeSync,
  subscribeToWorkTypeUpdates,
  WorkTypeDefinition,
} from "@/lib/workTypes";

export const useWorkTypes = () => {
  const [workTypes, setWorkTypes] = useState<WorkTypeDefinition[]>(getWorkTypeDictionary());

  useEffect(() => {
    const unsubscribeSync = startWorkTypeSync();
    const unsubscribeUpdates = subscribeToWorkTypeUpdates((entries) => {
      setWorkTypes(entries);
    });

    return () => {
      unsubscribeUpdates();
      unsubscribeSync?.();
    };
  }, []);

  const options = useMemo(() => getWorkTypeOptions(), [workTypes]);

  return { workTypes, options };
};
