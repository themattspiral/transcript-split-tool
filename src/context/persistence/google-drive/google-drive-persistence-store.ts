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

  async #handleApiError(error: number | string, retryOnReauth: () => Promise<any>): Promise<any> {
    if (error === PARSE_ERROR) {
      throw PersistenceStatus.ErrorData;
    } else if (error === 401 || error === 403) {
      this.#accessToken = null;
      
      if (this.#authError) {
        // don't try refresh auth again if we're already in auth error state
        console.log('Got 401 from API - Internal authError True - Not Refreshing Auth again');
        throw PersistenceStatus.ErrorUnauthorized;
      } else {
        console.log('Got 401 from API - Internal authError False - Trying to Refresh Access Token');
        try {
          this.#accessToken = await refreshAuthorize();
          this.#authError = false;
          console.log('Refresh Successful - Retrying operation that failed');
          
          return await retryOnReauth();
        } catch (err) {
          console.log('Refresh Failed. Setting Internal authError True');
          this.#authError = true;
          throw PersistenceStatus.ErrorUnauthorized;
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
    const init = async () => {
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
    };

    try {
      return await init();
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, init);
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
      console.log('created project file:', projectFile);

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
        console.log('updated.', projectFile);
      } else {
        // TODO - remove this - it must be explicitly created (when possible)
        console.log('gotta create');
        projectFile = await createJSONFile(this.#accessToken, `${project.projectName}.json`, this.#folderId || '', project);
        console.log('created project file:', projectFile);
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

  async completeAuthorizeExternal(rememberMe: boolean) {
    try {
      console.log('store running completeAuthorize()');
      this.#accessToken = await completeAuthorize(rememberMe);
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

  // temp for testing failures
  forget() {
    this.#accessToken = null;
  }
}
