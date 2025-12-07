// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[]; // Non-blocking recommendations
}

export interface ValidationError {
  field: string;
  message: string;
  section?: string; // Which editor section this relates to
}



