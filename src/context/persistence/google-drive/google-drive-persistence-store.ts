import { ExternalPersistenceStore } from '../persistence-context';
import { PersistenceStatus, Project } from '../../../shared/data';
import { authorize, completeAuthorize, revoke } from './google-oidc-oauth';
import {
  getFolderInfo, getJSONFileInfo, getJSONFileContents,
  createFolder, createJSONFile, updateJSONFile, PARSE_ERROR
} from './google-drive-api';

export class GoogleDrivePersistenceStore implements ExternalPersistenceStore {
  isExternal: boolean = true;

  #accessToken: string | null = null;
  #folderId: string | null = null;
  #folderName: string;

  #handleApiError(error: number | string) {
    if (error === PARSE_ERROR) {
      throw PersistenceStatus.ErrorData;
    } else if (error === 401 || error === 403) {
      this.#accessToken = null;
      // temp
      localStorage.removeItem('googleOauthToken');
      throw PersistenceStatus.ErrorUnauthorized;
    } else {
      throw PersistenceStatus.ErrorConnect;
    }
  }

  constructor(folderName: string) {
    this.#folderName = folderName;

    // TEMP!!
    this.#accessToken = localStorage.getItem('googleOauthToken');
  }

  // check for folder, create if needed, and cache id
  async initialize(): Promise<void> {
    if (!this.#accessToken) {
      console.log('no api token cached - short circuit unauth')
      throw PersistenceStatus.ErrorUnauthorized;
    }

    try {
      let folder = await getFolderInfo(this.#accessToken, this.#folderName);
      if (folder) {
        console.log('folder exists', folder.id);
      } else {
        console.log('no folder yet, creating...');
        folder = await createFolder(this.#accessToken, this.#folderName);
        console.log('created folder', folder.id);
      }

      this.#folderId = folder.id;
    } catch (statusCode) {
      this.#handleApiError(statusCode as number);
    }
  }
  
  async fetchProject(projectName: string): Promise<{ project: Project, hash: string} | null> {
    if (!this.#accessToken) {
      console.log('no api token cached - short circuit unauth')
      throw PersistenceStatus.ErrorUnauthorized;
    }

    try {
      console.log('fetching');
      const projectFileInfo = await getJSONFileInfo(this.#accessToken, `${projectName}.json`, this.#folderId || '');

      if (projectFileInfo) {
        console.log('found project file:', projectFileInfo);

        const projectFileContents = await getJSONFileContents(this.#accessToken, projectFileInfo?.id || 'unknown');
        console.log('fetched project file contents:', projectFileContents);

        return { project: projectFileContents as Project, hash: projectFileInfo.sha256Checksum };
      } else {
        return null;
      }
    } catch (statusCode) {
      this.#handleApiError(statusCode as number);

      // never called (#handleApiError throws)
      return {} as { project: Project, hash: string};
    }
  }
  
  async createProject(project: Project): Promise<string> {
    if (!this.#accessToken) {
      console.log('no api token cached - short circuit unauth')
      throw PersistenceStatus.ErrorUnauthorized;
    }

    try {
      console.log('creating manually');
      const projectFile = await createJSONFile(this.#accessToken, `${project.projectName}.json`, this.#folderId || '', project);
      console.log('created project file:', projectFile);

      return projectFile.sha256Checksum;
    } catch (statusCode) {
      this.#handleApiError(statusCode as number);
      
      // never called (#handleApiError throws)
      return '';
    }
  }
  
  async updateProject(project: Project): Promise<string> {
    if (!this.#accessToken) {
      console.log('no api token cached - short circuit unauth')
      throw PersistenceStatus.ErrorUnauthorized;
    }

    try {
      let projectFile = await getJSONFileInfo(this.#accessToken, `${project.projectName}.json`, this.#folderId || '');
      if (projectFile) {
        console.log('project file exists, update it:', projectFile.id);

        projectFile = await updateJSONFile(this.#accessToken, projectFile.id, project);
        console.log('updated.', projectFile);
      } else {
        // TODO - remove this - it must be explicitly created (when possible)
        console.log('gotta create');
        projectFile = await createJSONFile(this.#accessToken, `${project.projectName}.json`, this.#folderId || '', project);
        console.log('created project file:', projectFile);
      }

      return projectFile.sha256Checksum;
    } catch (statusCode) {
      this.#handleApiError(statusCode as number);
      
      // never called (#handleApiError throws)
      return '';
    }
  }

  authorizeExternal() {
    authorize();
  }

  async completeAuthorizeExternal() {
    try {
      console.log('store running completeAuthorize()');
      this.#accessToken = await completeAuthorize();
      console.log('store finished completeAuthorize()');


      // TEMP!!
      if (this.#accessToken) {
        localStorage.setItem('googleOauthToken', this.#accessToken);
      }
    } catch (err) {
      throw PersistenceStatus.ErrorUnauthorized;
    }
  }

  async revokeAuthorizeExternal() {
    // temp
    // await revoke(this.#accessToken);
    
    this.#accessToken = null;

    // TEMP!!
    localStorage.removeItem('googleOauthToken');
  }

  get isAuthorized(): boolean {
    return !!this.#accessToken;
  }

  get isInitialized(): boolean {
    return !!this.#folderId;
  }
}
