import { Plugin } from 'obsidian';
import ChooseFolderModal from './ChooseFolderModal';
import { NewFileLocation } from './enums';

export default class AdvancedNewFilePlugin extends Plugin {
  async onload() {
    console.log('loading plugin');

    this.addCommand({
      id: 'advanced-new-file',
      name: 'Create note in the current pane',
      callback: () => {
        new ChooseFolderModal(this.app, NewFileLocation.CurrentPane).open();
      },
    });

    this.addCommand({
      id: 'advanced-new-file-new-pane',
      name: 'Create note in a new pane',
      callback: () => {
        new ChooseFolderModal(this.app, NewFileLocation.NewPane).open();
      },
    });

    this.addCommand({
      id: 'advanced-new-file-new-tab',
      name: 'Create note in a new tab',
      callback: () => {
        new ChooseFolderModal(this.app, NewFileLocation.NewTab).open();
      },
    });
  }

  onunload() {
    console.log('unloading plugin');
  }
}
