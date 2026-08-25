// components/SearchDropdown.jsx
import { React, useRef, useMemo } from "react";
import Select from "react-select";

export const SearchDropdown = ({
  // Required props
  options = [],
  value,
  onChange,

  // Optional props
  label = "",
  required = false,
  //   placeholder = 'Select option',
  //   isLoading = false,
  //   isDisabled = false,
  isSearchable = true,
  //   onBlur,
  id,
  className = "",

  // Custom styles
  customStyles = {},
  // New prop to keep dropdown open after selection
  closeMenuOnSelect = true,
}) => {
  const selectRef = useRef(null);
  // Default styles
  const defaultStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "31px",
      height: "31px",
      fontSize: "0.875rem",
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: "31px",
      padding: "0 6px",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: "31px",
    }),
    ...customStyles,
  };

  // Find the selected option object
  // const selectedOption = value
  //   ? options.find((opt) => opt.value === value)
  //   : null;

  // Find the selected option object
  const selectedOption = useMemo(() => {
    return value ? options.find((opt) => opt.value === value) : null;
  }, [value, options]);

  return (
    <div>
      {/* <div className={`mb-2 ${className}`}>*/}
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <i className="text-danger">*</i>}
        </label>
      )}

      <Select
        options={options}
        // value={
        //   selectedOption
        //     ? {
        //         value: selectedOption.value,
        //         label: selectedOption.label,
        //       }
        //     : null
        // }
        value={selectedOption}
        onChange={onChange}
        ref={selectRef}
        // onBlur={onBlur}
        // placeholder={placeholder}
        isSearchable={isSearchable}
        // isDisabled={isDisabled || isLoading}
        className="react-select-container"
        classNamePrefix="react-select"
        closeMenuOnSelect={closeMenuOnSelect}
        // menuIsOpen={false}
        isOptionSelected={(option) => option.value === value}
        styles={defaultStyles}
        id={id}
      />

      {/* {isLoading && (
        <div className="small text-muted mt-1">
          Loading options...
        </div>
      )} */}
    </div>
  );
};

export default SearchDropdown;
