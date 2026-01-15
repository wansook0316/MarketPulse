import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  showIcon?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'default',
      title,
      showIcon = true,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: {
        container: 'bg-gray-50 border-gray-200 text-gray-900',
        icon: <Info className="h-5 w-5 text-gray-600" />,
      },
      success: {
        container: 'bg-success-50 border-success-200 text-success-900',
        icon: <CheckCircle2 className="h-5 w-5 text-success-600" />,
      },
      warning: {
        container: 'bg-warning-50 border-warning-200 text-warning-900',
        icon: <AlertCircle className="h-5 w-5 text-warning-600" />,
      },
      danger: {
        container: 'bg-danger-50 border-danger-200 text-danger-900',
        icon: <XCircle className="h-5 w-5 text-danger-600" />,
      },
      info: {
        container: 'bg-primary-50 border-primary-200 text-primary-900',
        icon: <Info className="h-5 w-5 text-primary-600" />,
      },
    };

    const { container, icon } = variants[variant];

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full rounded-lg border p-4',
          container,
          className
        )}
        role="alert"
        {...props}
      >
        <div className="flex gap-3">
          {showIcon && <div className="flex-shrink-0">{icon}</div>}
          <div className="flex-1">
            {title && (
              <h5 className="mb-1 font-medium leading-none tracking-tight">
                {title}
              </h5>
            )}
            {children && <div className="text-sm opacity-90">{children}</div>}
          </div>
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
