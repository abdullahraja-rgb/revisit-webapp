// ==================| Toast Component |=================
export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

type ToastState = {
  toasts: Toast[];
};

type ToastAction =
  | { type: "ADD_TOAST"; payload: Toast }
  | { type: "REMOVE_TOAST"; payload: { id: string } };

type ToastContextType = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
};

export interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  lastAssessment: string;
  models: Model[];
}

export interface Model {
  id: string;
  name: string;
  room: string;
  captureDate: string;
  modelUrl: string;
  modelType: string;
  thumbnailUrl: string;
  measurements: ModelMeasurement[];
}

export interface ModelMeasurement {
  id: string;
  type: string;
  value: number;
  unit: string;
  points: [number, number, number][];
}
