import { App, FuzzySuggestModal, TFolder, Vault } from 'obsidian';
import CreateNoteModal from './CreateNoteModal';

const EMPTY_TEXT = 'No folder found. Press esc to dismiss.';
const PLACEHOLDER_TEXT = 'Type folder name to fuzzy find.';
const instructions = [
  { command: '↑↓', purpose: 'to navigate' },
  { command: '↵', purpose: 'to choose folder' },
  { command: 'esc', purpose: 'to dismiss' },
];

export default class ChooseFolderModal extends FuzzySuggestModal<TFolder> {
  folders: TFolder[];
  chooseFolder: HTMLDivElement;
  suggestionEmpty: HTMLDivElement;
  noSuggestion: boolean;
  newDirectoryPath: string;
  createNoteModal: CreateNoteModal;

  constructor(app: App) {
    super(app);
    this.init();
  }

  init() {
    const folders = new Set() as Set<TFolder>;
    Vault.recurseChildren(this.app.vault.getRoot(), (file) => {
      if (file instanceof TFolder) {
        folders.add(file);
      }
    });
    this.folders = Array.from(folders);
    this.emptyStateText = EMPTY_TEXT;
    this.setPlaceholder(PLACEHOLDER_TEXT);
    this.setInstructions(instructions);
    this.initChooseFolderItem();
    this.createNoteModal = new CreateNoteModal(this.app);
  }

  getItems(): TFolder[] {
    return this.folders;
  }

  getItemText(item: TFolder): string {
    this.noSuggestion = false;
    return item.path;
  }

  onNoSuggestion() {
    this.noSuggestion = true;
    this.newDirectoryPath = this.inputEl.value;
    this.resultContainerEl.childNodes.forEach((c) =>
      c.parentNode.removeChild(c)
    );
    this.chooseFolder.innerText = this.inputEl.value;
    this.itemInstructionMessage(
      this.chooseFolder,
      'Press ↵ or append / to create folder.'
    );
    this.resultContainerEl.appendChild(this.chooseFolder);
    this.resultContainerEl.appendChild(this.suggestionEmpty);
  }

  shouldCreateFolder(evt: MouseEvent | KeyboardEvent): boolean {
    if (this.newDirectoryPath.endsWith('/')) {
      return true;
    }
    if (evt instanceof KeyboardEvent && evt.key == 'Enter') {
      return true;
    }
    return false;
  }

  onChooseItem(item: TFolder, evt: MouseEvent | KeyboardEvent): void {
    if (this.noSuggestion) {
      if (!this.shouldCreateFolder(evt)) {
        return;
      }
      this.createNoteModal.setFolder(
        this.app.vault.getRoot(),
        this.newDirectoryPath
      );
    } else {
      this.createNoteModal.setFolder(item, '');
    }
    this.createNoteModal.open();
  }

  initChooseFolderItem() {
    this.chooseFolder = document.createElement('div');
    this.chooseFolder.addClasses(['suggestion-item', 'is-selected']);
    this.suggestionEmpty = document.createElement('div');
    this.suggestionEmpty.addClass('suggestion-empty');
    this.suggestionEmpty.innerText = EMPTY_TEXT;
  }

  itemInstructionMessage(resultEl: HTMLElement, message: string) {
    const el = document.createElement('kbd');
    el.addClass('suggestion-hotkey');
    el.innerText = message;
    resultEl.appendChild(el);
  }
}
