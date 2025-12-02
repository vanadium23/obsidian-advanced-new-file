import { Plugin } from 'obsidian';

import {
  DEFAULT_SETTINGS,
  Settings,
  AdvancedNewFileSettingTab,
} from 'settings/Settings';

import ChooseFolderModal from './ChooseFolderModal';
import { NewFileLocation } from './enums';

export default class AdvancedNewFilePlugin extends Plugin {
  public settings: Settings;

  async onload() {
    console.log('loading plugin');

    await this.load_settings();

    this.addCommand({
      id: 'advanced-new-file',
      name: 'Create note in the current pane',
      callback: () => {
        new ChooseFolderModal(
          this.app,
          NewFileLocation.CurrentPane,
          this
        ).open();
      },
    });

    this.addCommand({
      id: 'advanced-new-file-new-pane',
      name: 'Create note in a new pane',
      callback: () => {
        new ChooseFolderModal(this.app, NewFileLocation.NewPane, this).open();
      },
    });

    this.addCommand({
      id: 'advanced-new-file-new-tab',
      name: 'Create note in a new tab',
      callback: () => {
        new ChooseFolderModal(this.app, NewFileLocation.NewTab, this).open();
      },
    });

    this.addSettingTab(new AdvancedNewFileSettingTab(this));
  }

  async onExternalSettingsChange() {
    await this.load_settings();
  }

  async save_settings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async load_settings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  onunload() {
    console.log('unloading plugin');
  }
}
