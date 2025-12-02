import AdvancedNewFilePlugin from 'main';
import { ButtonComponent, PluginSettingTab, Setting } from 'obsidian';
import { arraymove } from 'utils/Utils';

export interface FolderTemplate {
  folder: string;
  active: boolean;
}

export interface ExtensionTemplate {
  extension: string;
  active: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  enable_folder_templates: false,
  folder_templates: [{ folder: '', active: false }],
  enable_extension_templates: true,
  extension_default: 'md',
  extension_templates: [
    { extension: 'canvas', active: true },
    { extension: 'base', active: true },
    { extension: 'js', active: true },
    { extension: 'json', active: true },
    { extension: 'css', active: false },
  ],
};

export interface Settings {
  enable_folder_templates: boolean;
  folder_templates: Array<FolderTemplate>;
  enable_extension_templates: boolean;
  extension_default: string;
  extension_templates: Array<ExtensionTemplate>;
}

export class AdvancedNewFileSettingTab extends PluginSettingTab {
  constructor(private plugin: AdvancedNewFilePlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    this.containerEl.empty();

    this.add_extension_templates_setting();
  }

  add_extension_templates_setting(): void {
    new Setting(this.containerEl).setName('Handle extensions').setHeading();

    const descHeading = document.createDocumentFragment();
    descHeading.append(
      'Automatically add ',
      descHeading.createEl('strong', { text: '.md' }),
      ' to filenames. Can ignore a list of recognized extensions.',
      descHeading.createEl('br'),
      'Write extension names without dot like ',
      descHeading.createEl('code', { text: 'canvas' }),
      ' or ',
      descHeading.createEl('code', { text: 'base' }),
      '.'
    );

    new Setting(this.containerEl).setDesc(descHeading);

    const descUseNewExtensionTemplate = document.createDocumentFragment();
    descUseNewExtensionTemplate.append(
      'When enabled, .md extension is automatically appended to filename when missing. Optionally, define extensions that should be used as is.'
    );

    new Setting(this.containerEl)
      .setName('Automatically append .md extension')
      .setDesc(descUseNewExtensionTemplate)
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enable_extension_templates)
          .onChange((use_new_extension_templates) => {
            this.plugin.settings.enable_extension_templates =
              use_new_extension_templates;
            if (use_new_extension_templates) {
              this.plugin.settings.enable_folder_templates = false;
            }
            this.plugin.save_settings();
            // Force refresh
            this.display();
          });
      });

    if (!this.plugin.settings.enable_extension_templates) {
      return;
    }

    this.plugin.settings.extension_templates.forEach(
      (extension_template, index) => {
        const s = new Setting(this.containerEl)
          .addText((cb) => {
            cb.setPlaceholder('canvas')
              .setValue(extension_template.extension)
              .onChange((new_extension) => {
                new_extension = new_extension.trim();
                new_extension = new_extension.replace(/[\\/]/gi, '.'); // shouldn't have to deal with paths
                new_extension = new_extension.replace(/\.\./gi, '.'); // shouldn't have to deal with double dots
                new_extension = new_extension.replace(/^\./gi, ''); // leading dot not needed, save values consistently without it
                this.plugin.settings.extension_templates[index].extension =
                  new_extension;
                this.plugin.save_settings();
              });
            // @ts-ignore
            cb.inputEl.addClass('templater_search');
          })
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settings.extension_templates[index].active)
              .onChange((new_extension_state) => {
                this.plugin.settings.extension_templates[index].active =
                  new_extension_state;
                this.plugin.save_settings();
              });
          })
          .addExtraButton((cb) => {
            cb.setIcon('up-chevron-glyph')
              .setTooltip('Move up')
              .onClick(() => {
                arraymove(
                  this.plugin.settings.extension_templates,
                  index,
                  index - 1
                );
                this.plugin.save_settings();
                this.display();
              });
          })
          .addExtraButton((cb) => {
            cb.setIcon('down-chevron-glyph')
              .setTooltip('Move down')
              .onClick(() => {
                arraymove(
                  this.plugin.settings.extension_templates,
                  index,
                  index + 1
                );
                this.plugin.save_settings();
                this.display();
              });
          })
          .addExtraButton((cb) => {
            cb.setIcon('cross')
              .setTooltip('Delete')
              .onClick(() => {
                this.plugin.settings.extension_templates.splice(index, 1);
                this.plugin.save_settings();
                this.display();
              });
          });
        s.infoEl.remove();
      }
    );

    new Setting(this.containerEl).addButton((button: ButtonComponent) => {
      button
        .setButtonText('Add new extension')
        .setTooltip('Add additional extension')
        .setCta()
        .onClick(() => {
          this.plugin.settings.extension_templates.push({
            extension: '',
            active: false,
          });
          this.plugin.save_settings();
          this.display();
        });
    });
  }
}
