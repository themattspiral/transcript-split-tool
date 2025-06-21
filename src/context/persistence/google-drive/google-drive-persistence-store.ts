import { ExternalPersistenceStore } from '../persistence-context';
import { PersistenceStatus, Project } from '../../../shared/data';
import { authorize, completeAuthorize, revoke } from './google-oidc-oauth';
import {
  getFolderInfo, getJSONFileInfo, getJSONFileContents,
  createFolder, createJSONFile, updateJSONFile
} from './google-drive-api';

export class GoogleDrivePersistenceStore implements ExternalPersistenceStore {
  #apiToken: string | null = null;
  #folderId: string | null = null;
  #folderName: string;

  constructor(folderName: string) {
    this.#folderName = folderName;

    // TEMP!!
    this.#apiToken = localStorage.getItem('googleOauthToken');
  }

  // check for folder, create if needed, and cache id
  async initialize(): Promise<void> {
    if (!this.#apiToken) {
      console.log('no api token cached - short circuit unauth')
      throw PersistenceStatus.ErrorUnauthorized;
    }

    try {
      let folder = await getFolderInfo(this.#apiToken, this.#folderName);
      if (folder) {
        console.log('folder exists', folder.id);
      } else {
        console.log('no folder yet, creating...');
        folder = await createFolder(this.#apiToken, this.#folderName);
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
    if (!this.#apiToken) {
      console.log('no api token cached - short circuit unauth')
      throw PersistenceStatus.ErrorUnauthorized;
    }

    try {
      console.log('fetching');
      const projectFileInfo = await getJSONFileInfo(this.#apiToken, `${projectName}.json`, this.#folderId || '');

      if (projectFileInfo) {
        console.log('found project file:', projectFileInfo);

        const projectFileContents = await getJSONFileContents(this.#apiToken, projectFileInfo?.id || 'unknown');
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
    if (!this.#apiToken) {
      console.log('no api token cached - short circuit unauth')
      throw PersistenceStatus.ErrorUnauthorized;
    }

    try {
      console.log('creating manually');
      const projectFile = await createJSONFile(this.#apiToken, `${project.projectName}.json`, this.#folderId || '', project);
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
    if (!this.#apiToken) {
      console.log('no api token cached - short circuit unauth')
      throw PersistenceStatus.ErrorUnauthorized;
    }

    try {
      let projectFile = await getJSONFileInfo(this.#apiToken, `${project.projectName}.json`, this.#folderId || '');
      if (projectFile) {
        console.log('project file exists, update it:', projectFile.id);
        // setProjectId(projectFile.id);

        projectFile = await updateJSONFile(this.#apiToken, projectFile.id, project);
        console.log('updated.', projectFile);
      } else {
        console.log('gotta create');
        projectFile = await createJSONFile(this.#apiToken, `${project.projectName}.json`, this.#folderId || '', project);
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
    this.#apiToken = await completeAuthorize();

    // TEMP!!
    if (this.#apiToken) {
      localStorage.setItem('googleOauthToken', this.#apiToken);
    }
  }

  async revokeAuthorizeExternal() {
    // TEMP!!
    localStorage.removeItem('googleOauthToken');

    await revoke(this.#apiToken);
  }

  get isAuthorized(): boolean {
    return !!this.#apiToken;
  }

  get isInitialized(): boolean {
    return !!this.#folderId;
  }
}
