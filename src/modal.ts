import { App, FuzzySuggestModal, TFolder, Notice, Vault, Modal, Instruction } from 'obsidian';
import { path } from './utils';

const EMPTY_TEXT = 'No files found to append content. Enter to create a new one.';
const PLACEHOLDER_TEXT = 'Type file to append to or create';
const instructions = [
    { command: '↑↓', purpose: 'to navigate' },
    { command: '↵', purpose: 'to choose folder' },
    { command: 'esc', purpose: 'to dismiss' },
];

export class ChooseFolderModal extends FuzzySuggestModal<TFolder> {
    folders: TFolder[];
    chooseFolder: HTMLDivElement;
    suggestionEmpty: HTMLDivElement;
    noSuggestion: boolean;
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
        this.resultContainerEl.childNodes.forEach((c) =>
            c.parentNode.removeChild(c)
        );
        this.chooseFolder.innerText = this.inputEl.value;
        this.itemInstructionMessage(this.chooseFolder, 'No folder found');
        this.resultContainerEl.appendChild(this.chooseFolder);
        this.resultContainerEl.appendChild(this.suggestionEmpty);
    }

    onChooseItem(item: TFolder, evt: MouseEvent | KeyboardEvent): void {
        if (this.noSuggestion) {
            // TODO make something on
            return;
        }
        this.createNoteModal.setFolder(item);
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

export class CreateNoteModal extends Modal {
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

    async createNewNote(input: string): Promise<void> {
        const vault = this.app.vault;
        try {
            // Parse the input into a directory and file name
            const { dir, name } = path.parse(input);
            // The full path of the directory where the file will be created
            const fullDirectoryPath = path.join(this.folder.path, dir);
            // The full path of the file that will be created
            const fullFilePath = path.join(
                fullDirectoryPath,
                `${name || 'Untitled'}.md`
            );

            const fileExists = await vault.adapter.exists(fullFilePath);
            const directoryExists = await vault.adapter.exists(
                fullDirectoryPath
            );

            if (fileExists) {
                // If the file already exists, respond with error
                throw new Error(`${fullFilePath} already exists`);
            }
            if (!directoryExists) {
                // If the directory does NOT exist, create it recursively. This will not
                // overwrite existing directories in the path
                await vault.createFolder(fullDirectoryPath);
            }
            const File = await vault.create(fullFilePath, '');
            // Create the file and open it in the active leaf
            await this.app.workspace.activeLeaf.openFile(File);
            await vault.modify(File, 'ABC');
        } catch (error) {
            new Notice(error.toString());
        }
    }
}
