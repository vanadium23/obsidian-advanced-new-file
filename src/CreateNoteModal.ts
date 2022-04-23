import {
  App,
  normalizePath,
  Platform,
  TFolder,
  Notice,
  Modal,
  Instruction,
} from 'obsidian';
import { path } from './utils';

export default class CreateNoteModal extends Modal {
  folder: TFolder;
  inputEl: HTMLInputElement;
  instructionsEl: HTMLElement;
  inputListener: EventListener;

  constructor(app: App) {
    super(app);

    // create input
    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.placeholder = 'Type filename for new note';
    this.inputEl.className = 'prompt-input';

    // create instructions
    const instructions = [
      {
        command: '↵',
        purpose: 'to create note (default: Untitled)',
      },
      {
        command: 'esc',
        purpose: 'to dismiss creation',
      },
    ] as Instruction[];
    this.instructionsEl = document.createElement('div');
    this.instructionsEl.addClass('prompt-instructions');
    const children = instructions.map((x) => {
      const child = document.createElement('div');
      child.addClass('prompt-instruction');

      const command = document.createElement('span');
      command.addClass('prompt-instruction-command');
      command.innerText = x.command;
      child.appendChild(command);

      const purpose = document.createElement('span');
      purpose.innerText = x.purpose;
      child.appendChild(purpose);

      return child;
    });
    for (const child of children) {
      this.instructionsEl.appendChild(child);
    }

    // make modal
    this.modalEl.className = 'prompt';
    this.modalEl.innerHTML = '';
    this.modalEl.appendChild(this.inputEl);
    this.modalEl.appendChild(this.instructionsEl);

    this.inputListener = this.listenInput.bind(this);
  }

  setFolder(folder: TFolder) {
    this.folder = folder;
  }

  listenInput(evt: KeyboardEvent) {
    if (evt.key === 'Enter') {
      // Do work
      this.createNewNote(this.inputEl.value);
      this.close();
    }
  }

  onOpen() {
    this.inputEl.focus();
    this.inputEl.addEventListener('keydown', this.inputListener);
  }

  onClose() {
    this.inputEl.removeEventListener('keydown', this.inputListener);
  }

  /**
   * Creates a directory (recursive) if it does not already exist.
   * This is a helper function that includes a workaround for a bug in the
   * Obsidian mobile app.
   */
  private async createDirectory(dir: string): Promise<void> {
    const { vault } = this.app;
    const { adapter } = vault;
    const root = vault.getRoot().path;
    const directoryPath = path.join(this.folder.path, dir);
    const directoryExists = await adapter.exists(directoryPath);
    // ===============================================================
    // -> Desktop App
    // ===============================================================
    if (!Platform.isIosApp) {
      if (!directoryExists) {
        return adapter.mkdir(normalizePath(directoryPath));
      }
    }
    // ===============================================================
    // -> Mobile App (IOS)
    // ===============================================================
    // This is a workaround for a bug in the mobile app:
    // To get the file explorer view to update correctly, we have to create
    // each directory in the path one at time.

    // Split the path into an array of sub paths
    // Note: `normalizePath` converts path separators to '/' on all platforms
    // @example '/one/two/three/' ==> ['one', 'one/two', 'one/two/three']
    // @example 'one\two\three' ==> ['one', 'one/two', 'one/two/three']
    const subPaths: string[] = normalizePath(directoryPath)
      .split('/')
      .filter((part) => part.trim() !== '')
      .map((_, index, arr) => arr.slice(0, index + 1).join('/'));

    // Create each directory if it does not exist
    for (const subPath of subPaths) {
      const directoryExists = await adapter.exists(path.join(root, subPath));
      if (!directoryExists) {
        await adapter.mkdir(path.join(root, subPath));
      }
    }
  }

  /**
   * Handles creating the new note
   * A new markdown file will be created at the given file path (`input`)
   * in the specified parent folder (`this.folder`)
   */
  async createNewNote(input: string): Promise<void> {
    const { vault } = this.app;
    const { adapter } = vault;
    const { dir, name } = path.parse(input);
    const directoryPath = path.join(this.folder.path, dir);
    const filePath = path.join(directoryPath, `${name}.md`);

    try {
      const fileExists = await adapter.exists(filePath);
      if (fileExists) {
        // If the file already exists, respond with error
        throw new Error(`${filePath} already exists`);
      }
      if (dir !== '') {
        // If `input` includes a directory part, create it
        await this.createDirectory(dir);
      }
      const File = await vault.create(filePath, '');
      // Create the file and open it in the active leaf
      await this.app.workspace.activeLeaf.openFile(File);
    } catch (error) {
      new Notice(error.toString());
    }
  }
}
