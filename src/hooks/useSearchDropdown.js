// hooks/useSearchDropdown.js
import { useState } from 'react';

export const useSearchDropdown = (initialValue = '') => {
  const [selectedValue, setSelectedValue] = useState(initialValue);

  const handleChange = (selectedOption) => {
    const value = selectedOption ? selectedOption.value : '';
    setSelectedValue(value);
    return value;
  };

  const reset = () => {
    setSelectedValue('');
  };

  return {
    selectedValue,
    setSelectedValue,
    handleChange,
    reset
  };
};