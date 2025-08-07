export const validateRequired = (value: string): string | null => {
  if (!value || value.trim().length === 0) {
    return 'Bu alan zorunludur';
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Geçerli bir email adresi giriniz';
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number): string | null => {
  if (value.length < minLength) {
    return `En az ${minLength} karakter olmalıdır`;
  }
  return null;
};

export const validateDate = (date: string): string | null => {
  const selectedDate = new Date(date);
  const today = new Date();
  
  if (isNaN(selectedDate.getTime())) {
    return 'Geçerli bir tarih seçiniz';
  }
  
  if (selectedDate < today) {
    return 'Geçmiş tarih seçilemez';
  }
  
  return null;
};

export const validateForm = (values: Record<string, any>, rules: Record<string, (value: any) => string | null>) => {
  const errors: Record<string, string> = {};
  
  Object.keys(rules).forEach(field => {
    const error = rules[field](values[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 