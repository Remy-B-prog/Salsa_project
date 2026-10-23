type FileSystemPermissionOptions = {
  mode?: 'read' | 'readwrite';
};

declare global {
  interface FileSystemDirectoryHandle {
    queryPermission(options?: FileSystemPermissionOptions): Promise<PermissionState>;
    requestPermission(options?: FileSystemPermissionOptions): Promise<PermissionState>;
  }
}

export {};
