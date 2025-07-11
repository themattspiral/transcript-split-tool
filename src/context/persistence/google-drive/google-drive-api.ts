// https://developers.google.com/workspace/drive/api/reference/rest/v3/files

import { persistenceSerialize } from '../persistence-util';

const API_BASE = import.meta.env.TST_GOOGLE_API_BASE;
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const JSON_MIME_TYPE = 'application/json';

export const PARSE_ERROR = 'PARSE_ERROR';

export interface GoogleDriveFolder {
  id: string;
  name: string;
  mimeType: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  version: number;
}

export interface GoogleDriveFilesResponse {
  files: GoogleDriveFile[];
  nextPageToken: string | null;
}

const escapeFilename = (name: string): string | null => {
  return name.replace('\\', '\\\\').replace("'", "\\'");
}

const FILE_FIELDS_UNENCODED = 'id,name,mimeType,createdTime,modifiedTime,version';
const FILE_FIELDS = encodeURIComponent(FILE_FIELDS_UNENCODED);
const FILE_LIST_FIELDS = encodeURIComponent(`nextPageToken,files(${FILE_FIELDS_UNENCODED})`);

export const getFolderInfo = async (token: string | null, folderName: string): Promise<GoogleDriveFolder | null> => {
  if (!token) {
    throw 401;
  }
  
  const searchQuery = encodeURIComponent(
    `mimeType='${FOLDER_MIME_TYPE}' and trashed=false and name='${escapeFilename(folderName)}'`
  );
  const url = `${API_BASE}/drive/v3/files?q=${searchQuery}`;

  const filesResponse = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!filesResponse.ok) {
    throw filesResponse.status;
  }

  const filesBody: { files: GoogleDriveFolder[] } = await filesResponse.json();

  let folder: GoogleDriveFolder | null = null;

  if (filesBody && filesBody.files && filesBody.files.length > 0) {
    folder = filesBody.files.find(f => f.name === folderName) || null;
  }

  return folder;
};

export const listJSONFilesInfo = async (token: string | null, parentFolderId: string, nextPageToken?: string | null): Promise<GoogleDriveFilesResponse> => {
  if (!token) {
    throw 401;
  }

  const searchQuery = encodeURIComponent(
    `mimeType='${JSON_MIME_TYPE}' and trashed=false and '${parentFolderId}' in parents`
  );
  const tokenQuery = nextPageToken ? `&pageToken=${encodeURIComponent(nextPageToken)}` : '';
  const url = `${API_BASE}/drive/v3/files?q=${searchQuery}&fields=${FILE_LIST_FIELDS}${tokenQuery}`

  const filesResponse = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!filesResponse.ok) {
    throw filesResponse.status;
  }

  const filesBody = await filesResponse.json();
  
  return {
    files: filesBody.files,
    nextPageToken: filesBody.nextPageToken || null
  }
};

export const getJSONFileInfo = async (token: string | null, fileName: string, parentFolderId: string): Promise<GoogleDriveFile | null> => {
  if (!token) {
    throw 401;
  }

  const searchQuery = encodeURIComponent(
    `mimeType='${JSON_MIME_TYPE}' and trashed=false and name='${escapeFilename(fileName)}' and '${parentFolderId}' in parents`
  );
  const url = `${API_BASE}/drive/v3/files?q=${searchQuery}&fields=${FILE_LIST_FIELDS}`;

  const filesResponse = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!filesResponse.ok) {
    throw filesResponse.status;
  }

  const filesBody: { files: GoogleDriveFile[] } = await filesResponse.json();
  
  let file: GoogleDriveFile | null = null;

  if (filesBody && filesBody.files && filesBody.files.length > 0) {
    file = filesBody.files.find((f: any) => f.name === fileName) || null;
  }

  return file;
};

export const getJSONFileContents = async (token: string | null, fileId: string): Promise<any> => {
  if (!token) {
    throw 401;
  }
  
  const url = `${API_BASE}/drive/v3/files/${fileId}?alt=media`;

  const filesResponse = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!filesResponse.ok) {
    throw filesResponse.status;
  }

  try {
    return await filesResponse.json();
  } catch (err) {
    console.error(`Error parsing JSON from file [${fileId}]:`, err);
    throw PARSE_ERROR;
  }
};

export const createFolder = async (token: string | null, folderName: string): Promise<GoogleDriveFolder> => {
  if (!token) {
    throw 401;
  }
  
  const url = `${API_BASE}/drive/v3/files`;

  const createResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': JSON_MIME_TYPE,
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: FOLDER_MIME_TYPE
    })
  });

  if (!createResponse.ok) {
   throw createResponse.status;
  }

  return await createResponse.json();
};

export const createJSONFile = async (token: string | null, fileName: string, parentFolderId: string, fileContents: any): Promise<GoogleDriveFile> => {
  if (!token) {
    throw 401;
  }
  
  const url = `${API_BASE}/upload/drive/v3/files?uploadType=multipart&fields=${FILE_FIELDS}`;

  const metadata = {
    name: `${fileName}`,
    mimeType: JSON_MIME_TYPE,
    parents: [parentFolderId]
  };
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: JSON_MIME_TYPE }));
  formData.append('file', new Blob([persistenceSerialize(fileContents)], { type: JSON_MIME_TYPE }));

  const createResponse = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`},
    body: formData
  });

  if (!createResponse.ok) {
    throw createResponse.status;
  }

  return await createResponse.json();
};

export const updateJSONFile = async (token: string | null, fileId: string, fileContents: any): Promise<GoogleDriveFile> => {
  if (!token) {
    throw 401;
  }
  
  const url = `${API_BASE}/upload/drive/v3/files/${fileId}?uploadType=media&fields=${FILE_FIELDS}`;

  const updateResponse = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': JSON_MIME_TYPE
    },
    body: new Blob([persistenceSerialize(fileContents)], { type: JSON_MIME_TYPE })
  });

  if (!updateResponse.ok) {
     throw updateResponse.status;
  }

  return await updateResponse.json();
};

const updateFileMetadata = async (token: string | null, fileId: string, metadata: any): Promise<GoogleDriveFile> => {
  if (!token) {
    throw 401;
  }
  
  const url = `${API_BASE}/drive/v3/files/${fileId}`;
  const updateResponse = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: new Blob([JSON.stringify(metadata)], { type: JSON_MIME_TYPE })
  });

  if (!updateResponse.ok) {
     throw updateResponse.status;
  }

  return await updateResponse.json();
};

export const trashFile = async (token: string | null, fileId: string): Promise<GoogleDriveFile> => {
  return updateFileMetadata(token, fileId, { trashed: true });
};

export const renameFile = async (token: string | null, fileId: string, name: string): Promise<GoogleDriveFile> => {
  return updateFileMetadata(token, fileId, { name });
};
