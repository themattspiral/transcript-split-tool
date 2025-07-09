import { PersistenceProjectFile, PersistenceProjectFilesResponse, PersistenceStatus, Project } from 'data';
import { PersistenceStore } from './persistence-context';
import { persistenceSerialize } from './persistence-util';

const PROJECT_KEY_PREFIX = 'project.';

export class LocalStoragePersistenceStore implements PersistenceStore {
  readonly isExternal: boolean = false;
  readonly requiresUniqueNames: boolean = true;

  #projectKey(projectName: string): string {
    return `${PROJECT_KEY_PREFIX}${projectName}`;
  }

  constructor() {}

  async initialize(): Promise<void> {}
  
  // todo - decide how to handle project file id in localstorage
  async fetchProject(projectFileId: string): Promise<Project | null> {
    try {
      const projectStr = localStorage.getItem(this.#projectKey(projectFileId));
      
      return projectStr ? JSON.parse(projectStr) : null;
    } catch (err) {
      console.error(`Error parsing JSON from localStorage entry [${this.#projectKey(projectFileId)}]:`, err);
      throw PersistenceStatus.ErrorData;
    }
  }
  
  async createProject(project: Project): Promise<PersistenceProjectFile> {
    const projectStr = persistenceSerialize(project);
    localStorage.setItem(this.#projectKey(project.projectName), projectStr);
    return {
      fileId: project.projectName,
      fileName: project.projectName,
      projectName: project.projectName,
      createdTime: 'todo',
      modifiedTime: 'todo',
      version: 1
    };
  }
  
  async updateProject(projectFileId: string, project: Project): Promise<PersistenceProjectFile> {
    return this.createProject(project);
  }

  async listProjects(): Promise<PersistenceProjectFilesResponse> {
    // TODO, add required fields
    return {
      nextPageToken: null,
      projectFiles: []
    };
  }

  // todo - decide how to handle project file id in localstorage
  async deleteProject(projectFileId: string): Promise<void> {
    localStorage.removeItem(this.#projectKey(projectFileId));
  }

  get isInitialized(): boolean {
    return true;
  }
}
