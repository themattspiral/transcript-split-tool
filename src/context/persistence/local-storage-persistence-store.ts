import { PersistenceStore } from './persistence-context';
import { PersistenceStatus, Project } from '../../shared/data';
import { persistenceSerialize } from './persistence-utils';

const PROJECT_KEY_PREFIX = 'project.';

export class LocalStoragePersistenceStore implements PersistenceStore {
  isExternal: boolean = false;

  async #sha256Hash(message: string): Promise<string> {
    if (!window.crypto) {
      return 'local';
    }

    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  #projectKey(projectName: string): string {
    return `${PROJECT_KEY_PREFIX}${projectName}`;
  }

  constructor() {}

  async initialize(): Promise<void> {}
  
  async fetchProject(projectName: string): Promise<{ project: Project, hash: string} | null> {
    try {
      const projectStr = localStorage.getItem(this.#projectKey(projectName));

      if (projectStr) {
        const projectContents = JSON.parse(projectStr);
        const hash = await this.#sha256Hash(projectStr);

        return { project: projectContents, hash };
      } else {
        return null;
      }
    } catch (err) {
      console.error(`Error parsing JSON from localStorage entry [${this.#projectKey(projectName)}]:`, err);
      throw PersistenceStatus.ErrorData;
    }
  }
  
  async createProject(project: Project): Promise<string> {
    const projectStr = persistenceSerialize(project);
    localStorage.setItem(this.#projectKey(project.projectName), projectStr);

    try {
      return await this.#sha256Hash(projectStr);
    } catch (error) {
      return '--';
    }
  }
  
  async updateProject(project: Project): Promise<string> {
    return this.createProject(project);
  }

  get isInitialized(): boolean {
    return true;
  }
}
