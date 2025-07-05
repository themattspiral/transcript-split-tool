import { PersistenceStatus, Project } from 'data';
import { ExternalPersistenceStore } from '../persistence-context';
import { authorize, completeAuthorize, refreshAuthorize, revoke } from './google-oidc-oauth';
import {
  getFolderInfo, getJSONFileInfo, getJSONFileContents,
  createFolder, createJSONFile, updateJSONFile, PARSE_ERROR
} from './google-drive-api';

export class GoogleDrivePersistenceStore implements ExternalPersistenceStore {
  isExternal: boolean = true;

  #authError: boolean = false;
  #accessToken: string | null = null;
  #folderId: string | null = null;
  #folderName: string;

  async #handleApiError(error: number | string, retryOnReauth?: () => Promise<any>): Promise<any> {
    if (error === PARSE_ERROR) {
      throw PersistenceStatus.ErrorData;
    } else if (error === 401 || error === 403) {
      this.#accessToken = null;
      
      if (this.#authError || !retryOnReauth) {
        // don't try refresh auth again if we're already in auth error state (or no retry function provided)
        console.log('store-handleAptError - 401 from API (authError already True) - Unauthorized');
        throw PersistenceStatus.ErrorUnauthorized;
      } else {
        console.log('store-handleAptError - 401 from API (authError False) - Trying to Refresh Access Token');

        try {
          this.#accessToken = await refreshAuthorize();
          console.log('store-handleAptError - Refresh Successful');
        } catch (statusCode) {
          if (statusCode === 401 || statusCode === 403) {
            console.log('store-handleAptError - Refresh Failed - Unauthorized (setting authError True)');
            this.#authError = true;
            throw PersistenceStatus.ErrorUnauthorized;
          } else {
            console.log('store-handleAptError - Error during auth refresh:', statusCode);
            throw PersistenceStatus.ErrorConnect;
          }
        }

        try {
          console.log('store-handleAptError - Retrying operation that failed');
          return await retryOnReauth();
        } catch (statusCode) {
          if (statusCode === 401 || statusCode === 403) {
            console.log('store-handleAptError - Auth error again after refresh - Unauthorized (Setting authError True)');
            this.#authError = true;
            throw PersistenceStatus.ErrorUnauthorized;
          } else {
            console.log('store-handleAptError - Error during retry operation:', statusCode);
            throw PersistenceStatus.ErrorConnect;
          }
        }
      }
    } else {
      throw PersistenceStatus.ErrorConnect;
    }
  }

  constructor(folderName: string) {
    this.#folderName = folderName;
  }

  // check for project folder, create if needed, and cache id
  async initialize(): Promise<void> {
    if (this.#accessToken) {
      console.log('init: skipping token refresh, we got it from completing auth already');
    } else {
      console.log('init: beginning with token refresh');
      try {
        this.#accessToken = await refreshAuthorize();
        this.#authError = false;
        console.log('init: got new token');
      } catch (statusCode) {
        console.log('init: Error getting token:', statusCode);

        if ((statusCode as number) === 401 || (statusCode as number) === 403) {
          this.#authError = true;
          throw PersistenceStatus.ErrorUnauthorized;
        } else {
          this.#authError = true;
          throw PersistenceStatus.ErrorConnect;
        }
      }
    }
    
    try {
      console.log('init: getting project folder info...');
      let folder = await getFolderInfo(this.#accessToken, this.#folderName);
      if (folder) {
        console.log('init: folder exists', folder.id);
      } else {
        console.log('init: no folder yet, creating...');
        folder = await createFolder(this.#accessToken, this.#folderName);
        console.log('init: created folder', folder.id);
      }

      this.#folderId = folder.id;
    } catch (statusCode) {
      return await this.#handleApiError(statusCode as number);
    }
  }
  
  async fetchProject(projectName: string): Promise<{ project: Project, hash: string} | null> {
    const fetch = async () => {
      console.log('store fetching project file');
      const projectFileInfo = await getJSONFileInfo(this.#accessToken, `${projectName}.json`, this.#folderId || '');

      if (projectFileInfo?.id) {
        console.log('found project file:', projectFileInfo.id);

        const projectFileContents = await getJSONFileContents(this.#accessToken, projectFileInfo.id);
        console.log('fetched project file contents');

        return { project: projectFileContents as Project, hash: projectFileInfo.sha256Checksum };
      } else {
        return null;
      }
    };
    
    try {
      return await fetch();
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, fetch);
    }
  }
  
  async createProject(project: Project): Promise<string> {
    const create = async () => {
      console.log('creating manually');
      const projectFile = await createJSONFile(this.#accessToken, `${project.projectName}.json`, this.#folderId || '', project);
      console.log('created project file:', projectFile.id);

      return projectFile.sha256Checksum;
    };

    try {
      return await create();
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, create);
    }
  }
  
  async updateProject(project: Project): Promise<string> {
    const update = async () => {
      console.log('store updating ', project.projectName);

      let projectFile = await getJSONFileInfo(this.#accessToken, `${project.projectName}.json`, this.#folderId || '');
      if (projectFile) {
        console.log('project file exists, update it:', projectFile.id);

        projectFile = await updateJSONFile(this.#accessToken, projectFile.id, project);
        console.log('updated. hash:', projectFile.sha256Checksum);
      } else {
        // TODO - remove this - it must be explicitly created (when possible)
        console.log('gotta create');
        projectFile = await createJSONFile(this.#accessToken, `${project.projectName}.json`, this.#folderId || '', project);
        console.log('created project file:', projectFile.id);
      }

      return projectFile.sha256Checksum;
    };

    try {
      return await update();
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, update);
    }
  }

  authorizeExternal() {
    authorize();
  }

  async completeAuthorizeExternal(code: string, state: string, rememberMe: boolean): Promise<void> {
    try {
      console.log('store running completeAuthorize()');
      this.#accessToken = await completeAuthorize(code, state, rememberMe);
      console.log('store finished completeAuthorize()');
    } catch (statusCode) {
      await this.#handleApiError(statusCode as number);
    }
  }

  async revokeAuthorizeExternal() {
    this.#accessToken = null;
    
    await revoke();
  }

  get isInitialized(): boolean {
    return !!this.#folderId;
  }
}
