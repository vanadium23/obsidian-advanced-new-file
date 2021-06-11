import { Plugin } from 'obsidian';
import { ChooseFolderModal } from './modal';


export default class AdvancedNewFilePlugin extends Plugin {
	async onload() {
		console.log('loading plugin');

		this.addCommand({
			id: 'advanced-new-file',
			name: 'Create note',
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						new ChooseFolderModal(this.app).open();
					}
					return true;
				}
				return false;
			}
		});
	}

	onunload() {
		console.log('unloading plugin');
	}
}
