import { Menu, Item } from 'react-contexify';

import { TranscriptMenuId } from './transcript-menus';
import { useTranscriptInteraction } from '../../context/transcript-interaction-context';

export const ErrorMultipleLinesMenu: React.FC = () => {
  const { updateMenuVisibility } = useTranscriptInteraction();
  
  return (
    <Menu
      id={TranscriptMenuId.ErrorMultipleLinesMenu}
      animation="slide"
      onVisibilityChange={isVisible => updateMenuVisibility(TranscriptMenuId.ErrorMultipleLinesMenu, isVisible)}
    >
      <Item disabled style={{ opacity: 1 }}>
        <div className="text-red-500 font-semibold font-sans">Please select text from a single transcript line at a time.</div>
      </Item>
    </Menu>
  );
};
