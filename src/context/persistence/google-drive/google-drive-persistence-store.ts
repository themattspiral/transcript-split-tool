import { PersistenceProjectFile, PersistenceProjectFilesResponse, PersistenceStatus, Project } from 'data';
import { ExternalPersistenceStore } from '../persistence-context';
import { authorize, completeAuthorize, refreshAuthorize, revoke } from './google-oidc-oauth';
import {
  getFolderInfo, getJSONFileContents,
  createFolder, createJSONFile, updateJSONFile, listJSONFilesInfo, PARSE_ERROR,
  GoogleDriveFilesResponse, GoogleDriveFile, trashFile, renameFile
} from './google-drive-api';

export class GoogleDrivePersistenceStore implements ExternalPersistenceStore {
  readonly isExternal: boolean = true;
  readonly requiresUniqueNames: boolean = false;

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
        console.log('store-handleApiError - 401 from API (authError already True) - Unauthorized');
        throw PersistenceStatus.ErrorUnauthorized;
      } else {
        console.log('store-handleApiError - 401 from API (authError False) - Trying to Refresh Access Token');

        try {
          this.#accessToken = await refreshAuthorize();
          console.log('store-handleApiError - Refresh Successful');
        } catch (statusCode) {
          if (statusCode === 401 || statusCode === 403) {
            console.log('store-handleApiError - Refresh Failed - Unauthorized (setting authError True)');
            this.#authError = true;
            throw PersistenceStatus.ErrorUnauthorized;
          } else {
            console.log('store-handleApiError - Error during auth refresh:', statusCode);
            throw PersistenceStatus.ErrorConnect;
          }
        }

        try {
          console.log('store-handleApiError - Retrying operation that failed');
          return await retryOnReauth();
        } catch (statusCode) {
          if (statusCode === 401 || statusCode === 403) {
            console.log('store-handleApiError - Auth error again after refresh - Unauthorized (Setting authError True)');
            this.#authError = true;
            throw PersistenceStatus.ErrorUnauthorized;
          } else {
            console.log('store-handleApiError - Error during retry operation:', statusCode);
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

  garbleAccessToken() {
    this.#accessToken += 'test_forcing_auth_error_';
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
  
  async fetchProjectContents(projectFileId: string): Promise<Project | null> {
    const fetchProj = async () => {
      console.log('store fetching project file by id');
      const project = await getJSONFileContents(this.#accessToken, projectFileId);
      console.log('fetched project file contents (by id)');
      return project;
    };
    
    try {
      return await fetchProj();
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, fetchProj);
    }
  }
  
  async createProjectFile(project: Project): Promise<PersistenceProjectFile> {
    const createProj = async (): Promise<PersistenceProjectFile> => {
      console.log('creating project file...');
      const projectFile = await createJSONFile(this.#accessToken, `${project.projectName}.json`, this.#folderId || '', project);
      console.log('created project file:', projectFile.id);

      return {
        fileId: projectFile.id,
        fileName: projectFile.name,
        projectName: projectFile.name.split('.json')[0],
        createdTime: projectFile.createdTime,
        modifiedTime: projectFile.modifiedTime,
        version: projectFile.version
      };
    };

    try {
      return await createProj();
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, createProj);
    }
  }
  
  async updateProjectFile(projectFileId: string, project: Project): Promise<PersistenceProjectFile> {
    const updateProj = async (): Promise<PersistenceProjectFile> => {
      console.log('store updating ', project.projectName);
      const projectFile = await updateJSONFile(this.#accessToken, projectFileId, project);
      console.log('updated project file:', projectFile);
      return {
        fileId: projectFile.id,
        fileName: projectFile.name,
        projectName: projectFile.name.split('.json')[0],
        createdTime: projectFile.createdTime,
        modifiedTime: projectFile.modifiedTime,
        version: projectFile.version
      };
    };

    try {
      return await updateProj();
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, updateProj);
    }
  }

  async listProjectFiles(nextPageToken?: string | null): Promise<PersistenceProjectFilesResponse> {
    const listProj = async (nextPageToken?: string | null): Promise<PersistenceProjectFilesResponse> => {
      console.log('store listing');
      const filesResponse: GoogleDriveFilesResponse = await listJSONFilesInfo(this.#accessToken, this.#folderId || '', nextPageToken);
      console.log('store listing fetched');
      return {
        nextPageToken: filesResponse.nextPageToken,
        projectFiles: filesResponse.files.map((f: GoogleDriveFile) => ({
          fileId: f.id,
          fileName: f.name,
          projectName: f.name.split('.json')[0],
          createdTime: f.createdTime,
          modifiedTime: f.modifiedTime,
          version: f.version
        }))
      };
    };

    try {
      return await listProj(nextPageToken);
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, listProj);
    }
  }

  async deleteProjectFile(projectFileId: string): Promise<void> {
    const deleteProj = async () => {
      console.log('store deleting project file by id');
      await trashFile(this.#accessToken, projectFileId);
      console.log('deleted project file');
      return;
    };
    
    try {
      return await deleteProj();
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, deleteProj);
    }
  }
  
  async renameProjectFile(projectFileId: string, name: string): Promise<PersistenceProjectFile> {
    const renameProj = async (): Promise<PersistenceProjectFile> => {
      console.log('store renaming project file by id');
      const projectFile = await renameFile(this.#accessToken, projectFileId, name);
      console.log('renamed project file');
      return {
        fileId: projectFile.id,
        fileName: projectFile.name,
        projectName: projectFile.name.split('.json')[0],
        createdTime: projectFile.createdTime,
        modifiedTime: projectFile.modifiedTime,
        version: projectFile.version
      };
    };
    
    try {
      return await renameProj();
    } catch (statusCode) {
      // will either return the result of the retry after reauth if successful,
      // or throw the appropriate PersistenceStatus for the error
      return await this.#handleApiError(statusCode as number, renameProj);
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
