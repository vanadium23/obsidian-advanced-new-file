import { Plugin } from 'obsidian';
import { ChooseFolderModal } from './modal';


export default class AdvancedNewFilePlugin extends Plugin {
	async onload() {
		console.log('loading plugin');

		this.addCommand({
			id: 'advanced-new-file',
			name: 'Create note',
			callback: () => {
				new ChooseFolderModal(this.app).open();
			}
		});
	}

	onunload() {
		console.log('unloading plugin');
	}
}
