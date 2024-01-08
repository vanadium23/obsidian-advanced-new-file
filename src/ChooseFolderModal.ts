import {
  App,
  FuzzySuggestModal,
  TFolder,
  Vault,
  MarkdownView,
  TFile,
} from 'obsidian';
import CreateNoteModal from './CreateNoteModal';
import { NewFileLocation } from './enums';

const EMPTY_TEXT = 'No folder found. Press esc to dismiss.';
const PLACEHOLDER_TEXT = 'Type folder name to fuzzy find.';
const instructions = [
  { command: '↑↓', purpose: 'to navigate' },
  { command: 'Tab ↹', purpose: 'to autocomplete folder' },
  { command: '↵', purpose: 'to choose folder' },
  { command: 'esc', purpose: 'to dismiss' },
];

export default class ChooseFolderModal extends FuzzySuggestModal<TFolder> {
  mode: NewFileLocation;
  folders: TFolder[];
  chooseFolder: HTMLDivElement;
  suggestionEmpty: HTMLDivElement;
  noSuggestion: boolean;
  newDirectoryPath: string;
  createNoteModal: CreateNoteModal;
  inputListener: EventListener;

  constructor(app: App, mode: NewFileLocation) {
    super(app);
    this.mode = mode;
    this.init();
  }

  init() {
    const folders = new Set() as Set<TFolder>;
    const sortedFolders = [] as TFolder[];
    let leaf = this.app.workspace.getLeaf(false);
    if (
      leaf &&
      leaf.view instanceof MarkdownView &&
      leaf.view.file instanceof TFile &&
      leaf.view.file.parent instanceof TFolder
    ) {
      // pre-select current folder
      folders.add(leaf.view.file.parent);
      sortedFolders.push(leaf.view.file.parent);
    }
    Vault.recurseChildren(this.app.vault.getRoot(), (file) => {
      if (file instanceof TFolder && !folders.has(file)) {
        folders.add(file);
        sortedFolders.push(file);
      }
    });
    this.folders = sortedFolders;
    this.emptyStateText = EMPTY_TEXT;
    this.setPlaceholder(PLACEHOLDER_TEXT);
    this.setInstructions(instructions);
    this.initChooseFolderItem();
    this.createNoteModal = new CreateNoteModal(this.app, this.mode);

    this.inputListener = this.listenInput.bind(this);
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

  findCurrentSelect(): HTMLElement {
    return document.querySelector('.suggestion-item.is-selected');
  }

  listenInput(evt: KeyboardEvent) {
    if (evt.key === 'Tab') {
      this.inputEl.value = this.findCurrentSelect()?.innerText;
      // Disable tab selections on input
      evt.preventDefault();
    } else if (
      (evt.ctrlKey || evt.metaKey) &&
      (evt.key === 'k' || evt.key === 'p')
    ) {
      // Ctrl/cmd+k and ctrl/cmd+p mapped to up arrow
      const upArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      this.inputEl.dispatchEvent(upArrowEvent);
    } else if (
      (evt.ctrlKey || evt.metaKey) &&
      (evt.key === 'j' || evt.key === 'n')
    ) {
      // Ctrl/cmd+j and ctrl/cmd+n mapped to down arrow
      const downArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      this.inputEl.dispatchEvent(downArrowEvent);
    }
  }

  onOpen() {
    super.onOpen();
    this.inputEl.addEventListener('keydown', this.inputListener);
  }

  onClose() {
    this.inputEl.removeEventListener('keydown', this.inputListener);
    super.onClose();
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
