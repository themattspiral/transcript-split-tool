import { PersistenceStatus, Project } from 'data';
import { ExternalPersistenceStore, PersistenceProjectFilesResponse, ProjectFile } from '../persistence-context';
import { authorize, completeAuthorize, refreshAuthorize, revoke } from './google-oidc-oauth';
import {
  getFolderInfo, getJSONFileInfo, getJSONFileContents,
  createFolder, createJSONFile, updateJSONFile, listJSONFilesInfo, PARSE_ERROR,
  GoogleDriveFile
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
  
  async fetchProject(projectName: string): Promise<Project | null> {
    const fetch = async () => {
      console.log('store fetching project file');
      const projectFileInfo = await getJSONFileInfo(this.#accessToken, `${projectName}.json`, this.#folderId || '');

      if (projectFileInfo?.id) {
        console.log('found project file:', projectFileInfo.id);

        const project = await getJSONFileContents(this.#accessToken, projectFileInfo.id);
        console.log('fetched project file contents');

        return project;
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
  
  async createProject(project: Project): Promise<void> {
    const create = async () => {
      console.log('creating project file...');
      const projectFile = await createJSONFile(this.#accessToken, `${project.projectName}.json`, this.#folderId || '', project);
      console.log('created project file:', projectFile.id);
    };

    try {
      return await create();
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, create);
    }
  }
  
  async updateProject(project: Project): Promise<void> {
    const update = async () => {
      console.log('store updating ', project.projectName);

      let projectFile = await getJSONFileInfo(this.#accessToken, `${project.projectName}.json`, this.#folderId || '');
      if (projectFile) {
        console.log('project file exists, update it:', projectFile.id);

        projectFile = await updateJSONFile(this.#accessToken, projectFile.id, project);
        console.log('updated project file:', projectFile.name);
      } else {
        console.log('could not locate existing project file for:', project.projectName);

        // trigger a DataError throw
        throw PARSE_ERROR;
      }
    };

    try {
      return await update();
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, update);
    }
  }

  async listProjects(nextPageToken?: string | null): Promise<PersistenceProjectFilesResponse> {
    const list = async (nextPageToken?: string | null) => {
      console.log('store listing');
      return await listJSONFilesInfo(this.#accessToken, this.#folderId || '', nextPageToken);
    };

    try {
      const filesResponse = await list(nextPageToken);
      return {
        nextPageToken: filesResponse.nextPageToken,
        projectFiles: filesResponse.files.map((f: GoogleDriveFile) => ({
          fileName: f.name,
          projectName: f.name.split('.json')[0],
          createdTime: f.createdTime,
          modifiedTime: f.modifiedTime,
          version: f.version
        }))
      };
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, list);
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
