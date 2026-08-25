//------------ NumberField ------------
export const validateNumberInput = (value) => {
  if (value === "") return value;
  const regex = /^\d*\.?\d*$/;
  if (!regex.test(value)) {
    return false; // Invalid input
  }

  // Check if there's more than one decimal point
  const decimalCount = (value.match(/\./g) || []).length;

  if (decimalCount > 1) {
    return false; // More than one decimal point
  }

  return value; // Valid input
};

export const isValidCharacters = (input) => {
  const regex = /^[A-Za-z0-9,./&#@]*$/;
  return regex.test(input);
};
