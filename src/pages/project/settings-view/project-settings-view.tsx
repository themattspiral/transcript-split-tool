import { NavLink } from 'react-router-dom';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleArrowLeft, faHouseChimney, faGear } from '@fortawesome/free-solid-svg-icons';

import { useAppSettings } from 'context/app-settings-context';

export const ProjectSettingsView: React.FC = () => {
  const { appSettings } = useAppSettings();

  return (
    <div>Project Specific Settings Here</div>
  );
};
