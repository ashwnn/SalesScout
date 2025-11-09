import React, { InputHTMLAttributes, forwardRef } from 'react';
import '@/styles/components.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="input-wrapper">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {props.required && <span className="input-required">*</span>}
          </label>
        )}
        
        <div className="input-container">
          {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
          
          <input
            ref={ref}
            id={inputId}
            className={`input ${error ? 'input-error' : ''} ${
              leftIcon ? 'input-with-left-icon' : ''
            } ${rightIcon ? 'input-with-right-icon' : ''} ${className}`}
            {...props}
          />
          
          {rightIcon && <span className="input-icon-right">{rightIcon}</span>}
        </div>
        
        {error && <p className="input-error-message">{error}</p>}
        {helperText && !error && <p className="input-helper-text">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="input-wrapper">
        {label && (
          <label htmlFor={textareaId} className="input-label">
            {label}
            {props.required && <span className="input-required">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={`textarea ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        
        {error && <p className="input-error-message">{error}</p>}
        {helperText && !error && <p className="input-helper-text">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
