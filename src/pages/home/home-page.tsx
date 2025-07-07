import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAppSettings } from 'context/app-settings-context';

export const HomePage: React.FC = () => {
  const { hasSavedAppSettings } = useAppSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasSavedAppSettings()) {
      navigate('/projects', { replace: true });
    }
  }, [hasSavedAppSettings, navigate]);

  return (
    <main className='flex flex-col items-center'>
      <section className='w-[75%] h-dvh border-l-1 border-r-1 border-grey-600 p-2'>

        <h1 className="flex items-center mb-8">
          <div className="grow-1 text-2xl text-gray-600 flex justify-center items-center">
            Poetic Structure Transcript Split Tool
          </div>
        </h1>
        
        <section className="ml-4 mr-4">
          Intro to tool
          
          Begin by choosing a Storage Method in <Link to="/settings">App Settings</Link>.
        </section>

      </section>
    </main>
  );
};
