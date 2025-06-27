import { ExternalPersistenceStore } from '../persistence-context';
import { PersistenceStatus, Project } from '../../../shared/data';
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

  async #handleApiError(error: number | string): Promise<void> {
    if (error === PARSE_ERROR) {
      throw PersistenceStatus.ErrorData;
    } else if (error === 401 || error === 403) {
      this.#accessToken = null;
      throw PersistenceStatus.ErrorUnauthorized;
      
      // if (this.#authError) {
      //   // don't try refresh again if we're already in error state
      //   console.log('Got 401 from API - Internal authError True - Not Refreshing');
      //   throw PersistenceStatus.ErrorUnauthorized;
      // } else {
      //   console.log('Got 401 from API - Internal authError False - Trying to Refresh Access Token');
      //   try {
      //     this.#accessToken = await refreshAuthorize();
      //     this.#authError = false;
      //     console.log('Refresh Successful');
      //     // TODO - retry operation
      //   } catch (err) {
      //     console.log('Refresh Failed. Setting Internal authError True');
      //     this.#authError = true;
      //     throw PersistenceStatus.ErrorUnauthorized;
      //   }
      // }
    } else {
      throw PersistenceStatus.ErrorConnect;
    }
  }

  constructor(folderName: string) {
    this.#folderName = folderName;
  }

  // check for folder, create if needed, and cache id
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
      await this.#handleApiError(statusCode as number);
    }
  }
  
  async fetchProject(projectName: string): Promise<{ project: Project, hash: string} | null> {
    try {
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
    } catch (statusCode) {
      await this.#handleApiError(statusCode as number);

      // never called (#handleApiError throws)
      return {} as { project: Project, hash: string};
    }
  }
  
  async createProject(project: Project): Promise<string> {
    try {
      console.log('creating manually');
      const projectFile = await createJSONFile(this.#accessToken, `${project.projectName}.json`, this.#folderId || '', project);
      console.log('created project file:', projectFile);

      return projectFile.sha256Checksum;
    } catch (statusCode) {
      await this.#handleApiError(statusCode as number);
      
      // never called (#handleApiError throws)
      return '';
    }
  }
  
  async updateProject(project: Project): Promise<string> {
    console.log('store updating ', project.projectName);

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
      await this.#handleApiError(statusCode as number);
      
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
    } catch (err) {
      throw PersistenceStatus.ErrorUnauthorized;
    }
  }

  async revokeAuthorizeExternal() {
    this.#accessToken = null;
    
    await revoke();
  }

  get isAuthorized(): boolean {
    return !!this.#accessToken;
  }

  get isInitialized(): boolean {
    return !!this.#folderId;
  }
}
