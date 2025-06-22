import { ExternalPersistenceStore } from '../persistence-context';
import { PersistenceStatus, Project } from '../../../shared/data';
import { authorize, completeAuthorize, revoke } from './google-oidc-oauth';
import {
  getFolderInfo, getJSONFileInfo, getJSONFileContents,
  createFolder, createJSONFile, updateJSONFile
} from './google-drive-api';

export class GoogleDrivePersistenceStore implements ExternalPersistenceStore {
  #accessToken: string | null = null;
  #folderId: string | null = null;
  #folderName: string;

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
      if (statusCode === 401 || statusCode === 403) {
        throw PersistenceStatus.ErrorUnauthorized;
      } else {
        throw PersistenceStatus.ErrorConnect;
      }
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

        return { project: projectFileContents, hash: projectFileInfo.sha256Checksum };
      } else {
        return null;
      }
    } catch (statusCode) {
      if (statusCode === 401 || statusCode === 403) {
        throw PersistenceStatus.ErrorUnauthorized;
      } else {
        throw PersistenceStatus.ErrorConnect;
      }
    }

    return {} as { project: Project, hash: string};
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
      if (statusCode === 401 || statusCode === 403) {
        throw PersistenceStatus.ErrorUnauthorized;
      } else {
        throw PersistenceStatus.ErrorConnect;
      }
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
        // setProjectId(projectFile.id);

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
      if (statusCode === 401 || statusCode === 403) {
        throw PersistenceStatus.ErrorUnauthorized;
      } else {
        throw PersistenceStatus.ErrorConnect;
      }
    }
  }

  authorizeExternal() {
    authorize();
  }

  async completeAuthorizeExternal() {
    this.#accessToken = await completeAuthorize();

    // TEMP!!
    if (this.#accessToken) {
      localStorage.setItem('googleOauthToken', this.#accessToken);
    }
  }

  async revokeAuthorizeExternal() {
    // TEMP!!
    localStorage.removeItem('googleOauthToken');

    await revoke(this.#accessToken);
  }

  get isAuthorized(): boolean {
    return !!this.#accessToken;
  }

  get isInitialized(): boolean {
    return !!this.#folderId;
  }
}
