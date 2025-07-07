import { PersistenceStatus, Project } from 'data';
import { PersistenceProjectFilesResponse, PersistenceStore } from './persistence-context';
import { persistenceSerialize } from './persistence-util';

const PROJECT_KEY_PREFIX = 'project.';

export class LocalStoragePersistenceStore implements PersistenceStore {
  isExternal: boolean = false;

  #projectKey(projectName: string): string {
    return `${PROJECT_KEY_PREFIX}${projectName}`;
  }

  constructor() {}

  async initialize(): Promise<void> {}
  
  async fetchProject(projectName: string): Promise<Project | null> {
    try {
      const projectStr = localStorage.getItem(this.#projectKey(projectName));
      
      return projectStr ? JSON.parse(projectStr) : null;
    } catch (err) {
      console.error(`Error parsing JSON from localStorage entry [${this.#projectKey(projectName)}]:`, err);
      throw PersistenceStatus.ErrorData;
    }
  }
  
  async createProject(project: Project): Promise<void> {
    const projectStr = persistenceSerialize(project);
    localStorage.setItem(this.#projectKey(project.projectName), projectStr);
  }
  
  async updateProject(project: Project): Promise<void> {
    return this.createProject(project);
  }

  async listProjects(): Promise<PersistenceProjectFilesResponse> {
    return {
      nextPageToken: null,
      projectFiles: []
    };
  }

  get isInitialized(): boolean {
    return true;
  }
}
