import { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';

import { DropdownOption, StylableProps } from 'data';
import { useViewState } from 'context/view-state-context';
import { Badge } from './badge';

interface DropdownProps extends StylableProps {
  options: DropdownOption[];
  selectedId: string;
  onChange: (optionId: string) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({ options, selectedId, onChange, className, style}) => {
  const { registerOutsideClick, unregisterOutsideClick } = useViewState();
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const selectedItem = options.find(op => op.id === selectedId) || options[0];

  const handleOutsideClick = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    registerOutsideClick(containerRef, handleOutsideClick);
    return () => unregisterOutsideClick(containerRef, handleOutsideClick);
  }, []);

  return (
    <div
      ref={containerRef}
      className={classNames('dropdown relative p-1 rounded-sm border-1 border-transparent hover:border-gray-600', className)}
      style={style}
    > 

      <button
        type="button"
        className="dropdown-button flex items-center cursor-pointer"
        onClick={() => setIsOpen(o => !o)}
      >
        <Badge size="large">{ selectedItem?.textLabel }</Badge>
        <FontAwesomeIcon icon={faCaretDown} size="sm" className={classNames('caret ml-2', { open: isOpen })} />
      </button>

      <div
        ref={menuRef}
        className="dropdown-menu absolute right-0 bg-white border-gray-400 rounded-sm shadow-xl z-5 overflow-y-hidden text-sm font-normal border-box w-max"
        style={{
          top: 'calc(100% + 2px)',
          maxHeight: isOpen ? `${menuRef.current?.scrollHeight}px` : '0',
          borderWidth: isOpen ? '1px' : '0'
        }}
      >
        {options.map(op => (
          <div
            key={op.id} 
            className={classNames('dropdown-menu-option py-1 px-2 select-none flex', { selectable: op.selectable !== false })}
            onClick={ op.selectable === false ? undefined : () => {
              onChange(op.id);
              setIsOpen(false)
            } }
          >
            <span className="inline-block shrink-0" style={{ width: `${(op.level || 0) * 15}px` }} />
            { op.label || op.textLabel }
          </div>
        ))}
      </div>

    </div>
  );
};