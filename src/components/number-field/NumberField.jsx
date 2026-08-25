import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './NumberField.css';

export const NumberField = ({
  label,
  value: externalValue,
  onChange,
  name,
  placeholder = "Enter a number",
  required = false,
  min = null,
  max = null,
  step = 1,
  disabled = false,
  readOnly = false,
  error = null,
  onBlur,
  onFocus,
  validate,
  size = "medium",
  className = "",
  helpText = "",
  id,
}) => {
  // Generate a unique ID if not provided
  const fieldId = id || name || `number-field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  // Internal state for uncontrolled usage
  const [internalValue, setInternalValue] = useState(externalValue !== undefined ? externalValue : '');
  const [touched, setTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState('');

  // Determine if component is controlled or uncontrolled
  const isControlled = externalValue !== undefined;
  const value = isControlled ? externalValue : internalValue;

  // Validation function
  const validateField = (val) => {
    if (!val && val !== 0) {
      return required ? 'This field is required' : '';
    }

    const numValue = parseFloat(val);
    
    // Check if it's a valid number
    if (isNaN(numValue)) {
      return 'Please enter a valid number';
    }

    // Check min value
    if (min !== null && numValue < min) {
      return `Value must be at least ${min}`;
    }

    // Check max value
    if (max !== null && numValue > max) {
      return `Value must be at most ${max}`;
    }

    // Check step validation (if applicable)
    if (step && step > 0 && min !== null) {
      const remainder = (numValue - min) % step;
      const tolerance = 0.00001;
      if (Math.abs(remainder) > tolerance && Math.abs(remainder - step) > tolerance) {
        return `Value must be a multiple of ${step} starting from ${min}`;
      }
    }

    // Custom validation
    if (validate) {
      return validate(numValue) || '';
    }

    return '';
  };

  // Run validation when value or touched state changes
  useEffect(() => {
    if (touched || error) {
      const validationError = validateField(value);
      setInternalError(validationError);
    }
  }, [value, touched, error, validate]);

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // For uncontrolled components
    if (!isControlled) {
      setInternalValue(newValue);
    }

    // Call onChange prop
    if (onChange) {
      if (name) {
        // Pass event-like object if name is provided
        onChange({
          target: {
            name,
            value: newValue,
            type: 'number',
          },
        });
      } else {
        // Pass just the value
        onChange(newValue);
      }
    }
  };

  // Handle blur event
  const handleBlur = (e) => {
    setTouched(true);
    setIsFocused(false);
    
    if (onBlur) {
      onBlur(e);
    }
  };

  // Handle focus event
  const handleFocus = (e) => {
    setIsFocused(true);
    
    if (onFocus) {
      onFocus(e);
    }
  };

  // Determine size classes
  const sizeClasses = {
    small: 'form-control-sm',
    medium: '',
    large: 'form-control-lg'
  };

  const inputSizeClass = sizeClasses[size] || '';

  // Determine validation state
  const hasError = (error || internalError) && touched;
  const finalError = error || internalError;

  return (
    <div className={`number-field ${className} ${hasError ? 'has-error' : ''} ${isFocused ? 'is-focused' : ''}`}>     
      {label && (
        <label 
          htmlFor={fieldId} 
          className={`form-label ${required ? 'required' : ''} ${disabled ? 'text-muted' : ''}`}
        >
          {label}
        </label>
      )}
      
      <div className="input-group">
        
        <input
          type="number"
          id={fieldId}
          name={name}
          className={`form-control ${inputSizeClass} ${hasError ? 'is-invalid' : ''} ${touched && !hasError && value ? 'is-valid' : ''}`}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          min={min !== null ? min : undefined}
          max={max !== null ? max : undefined}
          step={step}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={`${hasError ? errorId : ''} ${helpText ? helpId : ''}`}
          aria-label={label ? undefined : placeholder}
        />
        
      </div>
      
      {/* Error message */}
      {hasError && (
        <div id={errorId} className="invalid-feedback d-block">
          {finalError}
        </div>
      )}
      
      {/* Help text */}
      {helpText && !hasError && (
        <div id={helpId} className="form-text">
          {helpText}
        </div>
      )}
      
      {/* Range information */}
      {(min !== null || max !== null) && !hasError && (
        <div className="range-info mt-1">
          <small className="text-muted">
            {min !== null && max !== null 
              ? `Range: ${min} to ${max}`
              : min !== null 
                ? `Minimum: ${min}`
                : `Maximum: ${max}`}
          </small>
        </div>
      )}
    </div>
  );
};

// PropTypes for better development experience
NumberField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  error: PropTypes.string,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  validate: PropTypes.func,
  showClearButton: PropTypes.bool,
  showStepButtons: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string,
  helpText: PropTypes.string,
  id: PropTypes.string,
};
